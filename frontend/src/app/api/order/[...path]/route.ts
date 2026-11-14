import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import type { CurrentUserResponse } from "@/utils/types/organization";

export const runtime = "nodejs";

const gateway = (
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

type Context = { params: Promise<{ path: string[] }> };
type Method = "GET" | "POST" | "PATCH" | "DELETE";

type Scope =
  | "create-order"
  | "kitchen"
  | "dashboard"
  | "order"
  | "create-payment"
  | "payment"
  | "refund-payment"
  | "refund-order"
  | "customer"
  | "register";

type Route = {
  method: Method;
  pattern: RegExp;
  scope: Scope;
};

const uuid = "[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}";
const order = `orders/(${uuid})`;
const payment = `payments/(${uuid})`;
const orderPayments = `payments/order/(${uuid})`;
const customer = `customers/(${uuid})`;

const routes: Route[] = [
  { method: "POST", pattern: /^orders$/, scope: "create-order" },
  { method: "GET", pattern: /^orders\/kitchen\/upcoming$/, scope: "kitchen" },
  { method: "GET", pattern: /^orders\/dashboard$/, scope: "dashboard" },
  { method: "GET", pattern: /^orders$/, scope: "register" },
  { method: "GET", pattern: new RegExp(`^${order}$`), scope: "order" },
  { method: "POST", pattern: new RegExp(`^${order}/items$`), scope: "order" },
  {
    method: "POST",
    pattern: new RegExp(`^${order}/items/${uuid}/unavailability$`),
    scope: "order",
  },
  {
    method: "PATCH",
    pattern: new RegExp(`^${order}/items/${uuid}/unavailability$`),
    scope: "order",
  },
  {
    method: "PATCH",
    pattern: new RegExp(`^${order}/kitchen/items/${uuid}/status$`),
    scope: "order",
  },

  {
    method: "DELETE",
    pattern: new RegExp(`^${order}/items/${uuid}$`),
    scope: "order",
  },
  {
    method: "DELETE",
    pattern: new RegExp(`^${order}/items/${uuid}/modifiers/${uuid}$`),
    scope: "order",
  },
  {
    method: "POST",
    pattern: new RegExp(`^${order}/(?:confirm|prepare|ready|complete|cancel)$`),
    scope: "order",
  },

  { method: "POST", pattern: /^payments$/, scope: "create-payment" },
  { method: "GET", pattern: new RegExp(`^${payment}$`), scope: "payment" },
  {
    method: "GET",
    pattern: new RegExp(`^${orderPayments}(?:/summary)?$`),
    scope: "order",
  },
  {
    method: "POST",
    pattern: new RegExp(`^${payment}/refund$`),
    scope: "refund-payment",
  },
  {
    method: "POST",
    pattern: new RegExp(`^${orderPayments}/refund$`),
    scope: "refund-order",
  },

  { method: "POST", pattern: /^customers$/, scope: "customer" },
  { method: "GET", pattern: /^customers$/, scope: "customer" },
  {
    method: "GET",
    pattern: new RegExp(`^${customer}(?:/orders)?$`),
    scope: "customer",
  },
  { method: "PATCH", pattern: new RegExp(`^${customer}$`), scope: "customer" },
  { method: "DELETE", pattern: new RegExp(`^${customer}$`), scope: "customer" },
];

const uuidPattern = new RegExp(`^${uuid}$`);

function failure(status: number, message: string) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function upstream(url: string | URL, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
}

async function relay(response: Response) {
  const headers = new Headers({ "Cache-Control": "private, no-store" });
  const contentType = response.headers.get("content-type");
  const requestId = response.headers.get("Kong-Request-ID");

  if (contentType) headers.set("Content-Type", contentType);
  if (requestId) headers.set("Kong-Request-ID", requestId);

  const body = [204, 205, 304].includes(response.status)
    ? null
    : await response.arrayBuffer();

  return new NextResponse(body, { status: response.status, headers });
}

async function readObject(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  const value: unknown = await request.json().catch(() => null);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

async function proxy(request: NextRequest, context: Context) {
  const { path } = await context.params;

  if (path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part))) {
    return failure(404, "Order Service route not found.");
  }

  const resource = path.join("/");
  const route = routes.find(
    ({ method, pattern }) =>
      request.method === method && pattern.test(resource),
  );

  if (!route) return failure(404, "Order Service route not found.");

  const cookie = request.headers.get("cookie");
  if (!cookie) return failure(401, "Sign in again.");

  const origin = process.env.FRONTEND_ORIGIN ?? request.nextUrl.origin;

  if (route.method !== "GET" && request.headers.get("origin") !== origin) {
    return failure(403, "Request origin is not allowed.");
  }

  try {
    const session = await upstream(`${gateway}/api/organization/auth/me`, {
      headers: { Cookie: cookie, Origin: origin, Accept: "application/json" },
    });

    if (!session.ok) {
      const status = [401, 403].includes(session.status) ? session.status : 502;
      return failure(status, "Unable to verify your session.");
    }

    const { data } = (await session.json()) as CurrentUserResponse;
    const { role, isActive, managedRestaurantId } = data.systemUser;

    if (!isActive) return failure(403, "Account is inactive.");

    if (route.scope === "customer") {
      if (role !== "SUPER_ADMIN") {
        return failure(403, "Customer administration requires a super admin.");
      }

      const url = new URL(`${gateway}/api/order/${resource}`);
      url.search = request.nextUrl.search;

      const headers = new Headers({ Accept: "application/json" });
      const contentType = request.headers.get("content-type");
      if (contentType) headers.set("Content-Type", contentType);

      return relay(
        await upstream(url, {
          method: route.method,
          headers,
          body: request.body ? await request.arrayBuffer() : undefined,
        }),
      );
    }

    if (
      (role !== "RESTAURANT_ADMIN" && role !== "STAFF") ||
      !managedRestaurantId ||
      !uuidPattern.test(managedRestaurantId)
    ) {
      return failure(403, "An assigned restaurant account is required.");
    }

    const managerOnly =
      route.scope === "dashboard" ||
      route.scope === "refund-order" ||
      route.scope === "refund-payment";

    if (managerOnly && role !== "RESTAURANT_ADMIN") {
      return failure(403, "A restaurant manager account is required.");
    }

    const headers = new Headers({ Accept: "application/json" });
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    const url = new URL(`${gateway}/api/order/${resource}`);
    url.search = request.nextUrl.search;

    let body: BodyInit | undefined;
    let orderId = route.pattern.exec(resource)?.[1];

    if (
      route.scope === "kitchen" ||
      route.scope === "dashboard" ||
      route.scope === "register"
    ) {
      url.searchParams.set("restaurantId", managedRestaurantId);
    }

    if (route.scope === "dashboard") {
      const key = process.env.RESTAURANT_DASHBOARD_KEY;
      if (!key)
        return failure(503, "Order dashboard configuration is missing.");
      headers.set("x-dashboard-key", key);
    }

    if (route.scope === "create-order" || route.scope === "create-payment") {
      const input = await readObject(request);
      if (!input) return failure(400, "A JSON object is required.");

      headers.set("Content-Type", "application/json");

      if (route.scope === "create-order") {
        const key = request.headers.get("idempotency-key")?.trim();

        if (!key || key.length > 255) {
          return failure(
            400,
            "Idempotency-Key must contain 1 to 255 characters.",
          );
        }

        const scopedKey = createHash("sha256")
          .update(`${managedRestaurantId}:${key}`)
          .digest("hex");

        headers.set("Idempotency-Key", scopedKey);
        body = JSON.stringify({ ...input, restaurantId: managedRestaurantId });
      } else {
        if (
          typeof input.orderId !== "string" ||
          !uuidPattern.test(input.orderId)
        ) {
          return failure(400, "A valid orderId is required.");
        }

        orderId = input.orderId;
        body = JSON.stringify(input);
      }
    } else if (route.method !== "GET" && request.body) {
      body = await request.arrayBuffer();
    }

    if (route.scope === "payment" || route.scope === "refund-payment") {
      const lookup = await upstream(
        `${gateway}/api/order/payments/${orderId}`,
        {
          headers: { Accept: "application/json" },
        },
      );

      if (!lookup.ok) return relay(lookup);

      const result = (await lookup.clone().json()) as {
        data: { order: { restaurantId: string } };
      };

      if (result.data.order.restaurantId !== managedRestaurantId) {
        return failure(404, "Payment not found.");
      }

      if (route.scope === "payment") return relay(lookup);
    } else if (orderId) {
      const lookup = await upstream(`${gateway}/api/order/orders/${orderId}`, {
        headers: { Accept: "application/json" },
      });

      if (!lookup.ok) return relay(lookup);

      const result = (await lookup.clone().json()) as {
        data: { restaurantId: string };
      };

      if (result.data.restaurantId !== managedRestaurantId) {
        return failure(404, "Order not found.");
      }

      if (route.method === "GET" && resource === `orders/${orderId}`) {
        return relay(lookup);
      }
    }

    return relay(await upstream(url, { method: route.method, headers, body }));
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return failure(
        504,
        "Order Service timed out. Check the order before retrying.",
      );
    }

    return failure(502, "Unable to reach authentication or the Order Service.");
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
