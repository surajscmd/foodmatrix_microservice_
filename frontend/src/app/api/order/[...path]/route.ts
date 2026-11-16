import { NextRequest, NextResponse } from "next/server";

import { getOrderAuthorization } from "@/lib/order-authorization";

export const runtime = "nodejs";

const gateway = (
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

type Context = { params: Promise<{ path: string[] }> };
type Method = "GET" | "POST" | "PATCH" | "DELETE";

type Route = {
  method: Method;
  pattern: RegExp;
};

const uuid = "[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}";
const order = `orders/(${uuid})`;
const payment = `payments/(${uuid})`;
const orderPayments = `payments/order/(${uuid})`;
const customer = `customers/(${uuid})`;

const routes: Route[] = [
  { method: "POST", pattern: /^orders$/ },
  { method: "GET", pattern: /^orders\/kitchen\/upcoming$/ },
  { method: "GET", pattern: /^orders\/dashboard$/ },
  { method: "GET", pattern: /^orders$/ },
  { method: "GET", pattern: new RegExp(`^${order}$`) },
  { method: "POST", pattern: new RegExp(`^${order}/items$`) },
  {
    method: "POST",
    pattern: new RegExp(`^${order}/items/${uuid}/unavailability$`),
  },
  {
    method: "PATCH",
    pattern: new RegExp(`^${order}/items/${uuid}/unavailability$`),
  },
  {
    method: "PATCH",
    pattern: new RegExp(`^${order}/kitchen/items/${uuid}/status$`),
  },

  {
    method: "DELETE",
    pattern: new RegExp(`^${order}/items/${uuid}$`),
  },
  {
    method: "DELETE",
    pattern: new RegExp(`^${order}/items/${uuid}/modifiers/${uuid}$`),
  },
  {
    method: "POST",
    pattern: new RegExp(`^${order}/(?:confirm|prepare|ready|complete|cancel)$`),
  },

  { method: "POST", pattern: /^payments$/ },
  { method: "GET", pattern: new RegExp(`^${payment}$`) },
  {
    method: "GET",
    pattern: new RegExp(`^${orderPayments}(?:/summary)?$`),
  },
  {
    method: "POST",
    pattern: new RegExp(`^${payment}/refund$`),
  },
  {
    method: "POST",
    pattern: new RegExp(`^${orderPayments}/refund$`),
  },

  { method: "POST", pattern: /^customers$/ },
  { method: "GET", pattern: /^customers$/ },
  {
    method: "GET",
    pattern: new RegExp(`^${customer}(?:/orders)?$`),
  },
  { method: "PATCH", pattern: new RegExp(`^${customer}$`) },
  { method: "DELETE", pattern: new RegExp(`^${customer}$`) },
];

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
    const session = await getOrderAuthorization(
      gateway,
      { Cookie: cookie, Origin: origin, Accept: "application/json" },
      AbortSignal.timeout(10_000),
    );
    if (!session.authorization)
      return failure(session.status, "Unable to verify your session.");

    const headers = new Headers({
      Authorization: session.authorization,
      Accept: "application/json",
    });
    for (const name of ["content-type", "idempotency-key"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const url = new URL(`${gateway}/api/order/${resource}`);
    url.search = request.nextUrl.search;

    return relay(await upstream(url, {
      method: route.method,
      headers,
      body: route.method !== "GET" && request.body
        ? await request.arrayBuffer()
        : undefined,
    }));
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
