import { NextRequest, NextResponse } from "next/server";

const gateway = (
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const resources = new Set([
  "menu-items",
  "menu-categories",
  "ingredients",
  "restaurant-menu-item",
  "modifier-group",
  "modifiers",
  "item-modifier-groups",
  "recipe-items",
]);

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function failure(status: number, message: string) {
  return NextResponse.json(
    { message },
    { status, headers: { "cache-control": "private, no-store" } },
  );
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (!resources.has(path[0]) || path.some((part) => !/^[a-z0-9-]+$/i.test(part))) {
    return failure(404, "Catalog route not found");
  }

  const cookie = request.headers.get("cookie");
  if (!cookie) return failure(401, "Sign in again to access Catalog");

  const origin = process.env.FRONTEND_ORIGIN ?? request.nextUrl.origin;
  const isRead = request.method === "GET";
  if (!isRead && request.headers.get("origin") !== origin) {
    return failure(403, "Request origin is not allowed");
  }

  try {
    const tokenResponse = await fetch(`${gateway}/api/auth/token`, {
      headers: { Cookie: cookie, Origin: origin, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) {
      const { status } = tokenResponse;
      if (status === 401 || status === 403) {
        return failure(status, "Unable to authenticate Catalog request");
      }
      return failure(502, "Unable to verify your session");
    }

    const session = (await tokenResponse.json()) as { token?: unknown } | null;
    if (typeof session?.token !== "string" || !session.token) {
      return failure(401, "Unable to authenticate Catalog request");
    }

    const url = new URL(`${gateway}/api/catalog/${path.join("/")}`);
    url.search = request.nextUrl.search;
    const headers = new Headers({ Authorization: `Bearer ${session.token}` });
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    const response = await fetch(url, {
      method: request.method,
      headers,
      body: !isRead && request.body ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

    const hasBody = response.status !== 204 && response.status !== 205 && response.status !== 304;
    const responseHeaders = new Headers({ "cache-control": "private, no-store" });
    const responseType = response.headers.get("content-type");
    if (responseType) responseHeaders.set("Content-Type", responseType);

    return new NextResponse(hasBody ? await response.arrayBuffer() : null, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return failure(502, "Unable to connect to Catalog service");
  }
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PATCH,
  proxyRequest as PUT,
  proxyRequest as DELETE,
};
