import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_URL = (
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

interface TokenResponse {
  token?: string;
}

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { path } = await context.params;

    // --------------------------------------------------
    // 1. Validate the requested path
    // --------------------------------------------------

    if (
      !path.length ||
      path.some(
        (part) =>
          !part || part === "." || part === ".." || /[/\\?#]/.test(part),
      )
    ) {
      return NextResponse.json(
        {
          message: "Invalid inventory request path",
        },
        {
          status: 400,
        },
      );
    }

    const allowedResources = new Set([
      "warehouse-stock",
      "restaurant-stock",
      "stock-movements",
      "stock-requests",
      "stock-transfers",
      "waste-logs",
    ]);

    if (!allowedResources.has(path[0] ?? "")) {
      return NextResponse.json(
        {
          message: "Inventory route not found",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------
    // 2. Get Better Auth session cookie
    // --------------------------------------------------

    const cookie = request.headers.get("cookie");

    if (!cookie) {
      return NextResponse.json(
        {
          message: "Authentication cookie is missing",
        },
        {
          status: 401,
        },
      );
    }

    // --------------------------------------------------
    // 3. Exchange session cookie for JWT
    // --------------------------------------------------

    const tokenResponse = await axios.get<TokenResponse>(
      `${API_URL}/api/auth/token`,
      {
        headers: {
          Cookie: cookie,
          Origin: request.headers.get("origin") ?? request.nextUrl.origin,
        },
        timeout: 15_000,
        maxRedirects: 0,
        validateStatus: () => true,
      },
    );

    const token = tokenResponse.data?.token;

    if (
      tokenResponse.status < 200 ||
      tokenResponse.status >= 300 ||
      typeof token !== "string" ||
      !token.trim()
    ) {
      return NextResponse.json(
        {
          message: "Unable to authenticate request. Please sign in again.",
        },
        {
          status: 401,
        },
      );
    }

    // --------------------------------------------------
    // 4. Build Kong Inventory URL
    //
    // Kong strips /api/inventory before forwarding
    // the request to Inventory Service on port 3006.
    // --------------------------------------------------

    const pathName = path.map((part) => encodeURIComponent(part)).join("/");

    const targetUrl = new URL(`${API_URL}/api/inventory/${pathName}`);

    targetUrl.search = request.nextUrl.search;

    // --------------------------------------------------
    // 5. Prepare upstream headers
    // --------------------------------------------------

    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    });

    // Stock-request actions resolve warehouse scope from the authenticated session.
    if (
      path[0] === "stock-requests" &&
      ["POST", "PATCH", "DELETE"].includes(request.method)
    ) {
      headers.set("Cookie", cookie);
    }

    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    // --------------------------------------------------
    // 6. Read request body
    // --------------------------------------------------

    let body: string | undefined;

    if (request.method !== "GET" && request.method !== "HEAD") {
      const requestBody = await request.text();

      if (requestBody) {
        body = requestBody;
      }
    }

    // --------------------------------------------------
    // 7. Forward request through Kong
    // --------------------------------------------------

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });

    // --------------------------------------------------
    // 8. Preserve upstream status and response
    // --------------------------------------------------

    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
    });

    const responseContentType = response.headers.get("content-type");

    if (responseContentType) {
      responseHeaders.set("Content-Type", responseContentType);
    }

    const requestId = response.headers.get("Kong-Request-ID");

    if (requestId) {
      responseHeaders.set("Kong-Request-ID", requestId);
    }

    const hasNoBody =
      request.method === "HEAD" || [204, 205, 304].includes(response.status);

    return new NextResponse(hasNoBody ? null : await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const isTimeout =
      (axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")) ||
      (error instanceof Error && error.name === "TimeoutError");

    // Avoid logging session cookies, JWTs, or Axios configs.
    console.error(
      "Inventory proxy request failed:",
      isTimeout ? "Gateway timeout" : "Upstream request failed",
    );

    return NextResponse.json(
      {
        message: isTimeout
          ? "Inventory request timed out. Refresh stock before retrying a stock change."
          : "Unable to connect to authentication or Inventory Service through Kong.",
      },
      {
        status: isTimeout ? 504 : 502,
      },
    );
  }
}

// ======================================================
// HTTP METHODS
// ======================================================

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}
