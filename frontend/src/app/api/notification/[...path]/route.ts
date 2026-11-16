import { NextRequest, NextResponse } from "next/server";

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
    const tokenResponse = await fetch(`${API_URL}/api/auth/token`, {
      headers: sessionHeaders,
      cache: "no-store",
      redirect: "error",
      signal,
    });
    if (!tokenResponse.ok) {
      const status = tokenResponse.status === 401 || tokenResponse.status === 403
        ? tokenResponse.status
        : 502;
      return NextResponse.json({ message: "Unable to authenticate request" }, { status });
    }

    const session = (await tokenResponse.json()) as { token?: unknown } | null;
    if (typeof session?.token !== "string" || !session.token) {
      return NextResponse.json({ message: "Unable to authenticate request" }, { status: 401 });
    }

    const pathname = path.map(encodeURIComponent).join("/");
    const query = request.nextUrl.searchParams.toString();
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${session.token}`,
    };

    const response = await fetch(
      `${API_URL}/api/notification/${pathname}${
        query ? `?${query}` : ""
      }`,
      {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "error",
        signal,
      },
    );

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
  } catch {
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
