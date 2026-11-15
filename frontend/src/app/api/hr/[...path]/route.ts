import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { path } = await context.params;

    const pathName = path.join("/");
    const searchParams =
      request.nextUrl.searchParams.toString();

    const targetUrl =
      `${API_URL}/api/hr/${pathName}` +
      (searchParams ? `?${searchParams}` : "");

    // ---------------------------------------------
    // 1. Get Better Auth cookies from browser
    // ---------------------------------------------

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

    // ---------------------------------------------
    // 2. Exchange session cookie for JWT
    // ---------------------------------------------

    const tokenResponse = await axios.get<{ token?: unknown }>(
      `${API_URL}/api/auth/token`,
      {
        headers: {
          Cookie: cookie,
          Origin:
            request.headers.get("origin") ??
            "http://localhost:3000",
        },
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
      console.error(
        "JWT generation failed:",
        tokenResponse.status,
      );

      return NextResponse.json(
        {
          message: "Unable to authenticate request",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------
    // 3. Prepare headers for HR request
    // ---------------------------------------------

    const headers = new Headers();

    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );

    const contentType =
      request.headers.get("content-type");

    if (contentType) {
      headers.set(
        "content-type",
        contentType,
      );
    }

    // ---------------------------------------------
    // 4. Prepare request body
    // ---------------------------------------------

    let body: string | undefined;

    if (
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {
      body = await request.text();
    }

    // ---------------------------------------------
    // 5. Forward request through Kong
    // ---------------------------------------------

    const response = await fetch(
      targetUrl,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
      },
    );

    const headersToBrowser = new Headers({
      "cache-control": "private, no-store",
      "content-type": response.headers.get("content-type") ?? "application/json",
    });
    const disposition = response.headers.get("content-disposition");
    if (disposition) headersToBrowser.set("content-disposition", disposition);

    // ---------------------------------------------
    // 6. Return HR response to browser
    // ---------------------------------------------

    return new NextResponse(
      response.body,
      {
        status: response.status,
        headers: headersToBrowser,
      },
    );
  } catch (error) {
    console.error(
      "HR API proxy error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to HR service",
      },
      {
        status: 502,
      },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(
    request,
    context,
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(
    request,
    context,
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(
    request,
    context,
  );
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(
    request,
    context,
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(
    request,
    context,
  );
}
