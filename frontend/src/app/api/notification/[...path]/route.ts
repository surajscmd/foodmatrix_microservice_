import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import type { CurrentUserResponse } from "@/utils/types/organization";

const API_URL = (
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function isAllowedRoute(
  method: string,
  path: string[],
): boolean {
  if (path[0] !== "notifications") return false;

  if (
    path.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        part.includes("/") ||
        part.includes("\\"),
    )
  ) {
    return false;
  }

  if (method === "GET") {
    return (
      path.length === 2 ||
      (path.length === 3 &&
        (path[1] === "warehouse" || path[1] === "restaurant"))
    );
  }

  if (method === "PATCH") {
    return (
      (path.length === 3 && path[2] === "read") ||
      (path.length === 4 &&
        (path[1] === "warehouse" || path[1] === "restaurant") &&
        path[3] === "read-all")
    );
  }

  return false;
}

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { path } = await context.params;

    if (!isAllowedRoute(request.method, path)) {
      return NextResponse.json(
        { message: "Notification route not found" },
        { status: 404 },
      );
    }

    const cookie = request.headers.get("cookie");

    if (!cookie) {
      return NextResponse.json(
        { message: "Authentication cookie is missing" },
        { status: 401 },
      );
    }

    const origin = process.env.FRONTEND_ORIGIN ?? request.nextUrl.origin;
    if (request.method === "PATCH" && request.headers.get("origin") !== origin) {
      return NextResponse.json({ message: "Request origin is not allowed" }, { status: 403 });
    }

    const sessionHeaders = { Cookie: cookie, Origin: origin };
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
    const session = await fetch(`${API_URL}/api/organization/auth/me`, {
      headers: sessionHeaders,
      cache: "no-store",
      signal,
    });
    if (!session.ok) {
      const status = session.status === 401 || session.status === 403 ? session.status : 502;
      return NextResponse.json({ message: "Unable to verify your session" }, { status });
    }

    const { data } = (await session.json()) as CurrentUserResponse;
    const user = data?.systemUser;
    const restaurantUser = user?.role === "RESTAURANT_ADMIN" || user?.role === "STAFF";
    if (!user?.isActive ||
      (path[1] === "restaurant" && (!restaurantUser || path[2] !== user.managedRestaurantId)) ||
      (restaurantUser && (path[1] === "warehouse" || !user.managedRestaurantId))
    ) {
      return NextResponse.json({ message: "Notification location is not available to this account" }, { status: 403 });
    }

    const tokenResponse = await axios.get<{
      token?: string;
    }>(`${API_URL}/api/auth/token`, {
      headers: sessionHeaders,
      timeout: 15000,
      signal,
      validateStatus: () => true,
    });

    if (
      tokenResponse.status < 200 ||
      tokenResponse.status >= 300 ||
      typeof tokenResponse.data?.token !== "string" ||
      !tokenResponse.data.token
    ) {
      return NextResponse.json(
        { message: "Unable to authenticate request" },
        { status: 401 },
      );
    }

    const pathname = path.map(encodeURIComponent).join("/");
    const query = request.nextUrl.searchParams.toString();
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${tokenResponse.data.token}`,
    };

    const individual = path[1] !== "restaurant" && path[1] !== "warehouse";
    if (restaurantUser && individual && request.method === "PATCH") {
      const detail = await fetch(`${API_URL}/api/notification/notifications/${encodeURIComponent(path[1])}`, {
        headers,
        cache: "no-store",
        signal,
      });
      if (!detail.ok) {
        return NextResponse.json({ message: "Unable to verify notification" }, { status: detail.status });
      }
      const { data: item } = await detail.json();
      if (item?.scope !== "RESTAURANT" || item.restaurantId !== user.managedRestaurantId) {
        return NextResponse.json({ message: "Notification not found" }, { status: 404 });
      }
    }

    const response = await fetch(
      `${API_URL}/api/notification/${pathname}${
        query ? `?${query}` : ""
      }`,
      {
        method: request.method,
        headers,
        cache: "no-store",
        signal,
      },
    );

    if (restaurantUser && individual && request.method === "GET" && response.ok) {
      const { data: item } = await response.clone().json();
      if (item?.scope !== "RESTAURANT" || item.restaurantId !== user.managedRestaurantId) {
        return NextResponse.json({ message: "Notification not found" }, { status: 404 });
      }
    }

    const body = await response.text();

    return new NextResponse(
      response.status === 204 ? null : body,
      {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("content-type") ??
            "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Notification proxy error:", error);

    return NextResponse.json(
      { message: "Unable to connect to Notification Service" },
      { status: 502 },
    );
  }
}

export function GET(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}
