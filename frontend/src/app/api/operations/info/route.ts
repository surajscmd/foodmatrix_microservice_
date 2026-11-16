import { NextRequest, NextResponse } from "next/server";

import { getOrderAuthorization } from "@/lib/order-authorization";
import type { OrderDashboard } from "@/lib/order-api";
import type { CurrentUserResponse, RestaurantResponse, RestaurantsResponse } from "@/utils/types/organization";

const gateway = (process.env.FOODMATRIX_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return NextResponse.json({ message: "Sign in again." }, { status: 401 });

  const origin = process.env.FRONTEND_ORIGIN ?? request.nextUrl.origin;
  const sessionHeaders = { Cookie: cookie, Origin: origin, Accept: "application/json" };
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]);
  try {
    const session = await fetch(`${gateway}/api/organization/auth/me`, { headers: sessionHeaders, signal, cache: "no-store" });
    if (!session.ok) {
      const status = session.status === 401 || session.status === 403 ? session.status : 502;
      return NextResponse.json({ message: "Unable to verify your session." }, { status });
    }

    const { data } = (await session.json()) as CurrentUserResponse;
    const user = data.systemUser;
    const franchiseId = user.franchiseId;
    if (!user.isActive || (user.role !== "SUPER_ADMIN" && (user.role !== "FRANCHISE_ADMIN" || !franchiseId))) {
      return NextResponse.json({ message: "Franchise administration access is required." }, { status: 403 });
    }

    const locations = await fetch(`${gateway}/api/organization/restaurants`, { headers: sessionHeaders, signal, cache: "no-store" });
    if (!locations.ok) {
      return NextResponse.json({ message: "Unable to load restaurants." }, { status: 502 });
    }
    const { data: restaurants } = (await locations.json()) as RestaurantsResponse;
    const allowed = restaurants.filter((item) => !franchiseId || item.franchiseId === franchiseId);
    const { authorization, status } = await getOrderAuthorization(gateway, sessionHeaders, signal);
    if (!authorization) return NextResponse.json({ message: "Unable to verify your session." }, { status });

    const metrics: { restaurant: RestaurantResponse["data"]; dashboard: OrderDashboard | null }[] = [];
    for (let index = 0; index < allowed.length; index += 8) {
      const batch = await Promise.all(allowed.slice(index, index + 8).map(async (restaurant) => {
        try {
          const url = new URL(`${gateway}/api/order/orders/dashboard`);
          url.searchParams.set("restaurantId", restaurant.id);
          const response = await fetch(url, {
            headers: { Accept: "application/json", Authorization: authorization },
            signal,
            cache: "no-store",
          });
          const dashboard = response.ok ? (await response.json()) as OrderDashboard : null;
          return { restaurant, dashboard };
        } catch {
          return { restaurant, dashboard: null };
        }
      }));
      metrics.push(...batch);
    }

    return NextResponse.json({ metrics }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Order metrics are unavailable." }, { status: 502 });
  }
}
