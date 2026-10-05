import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.FOODMATRIX_API_URL ?? "http://localhost:8000";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;

    if (!path?.length) {
      return NextResponse.json(
        {
          message: "Organization API path is required",
        },
        { status: 400 },
      );
    }

    const targetUrl =
      `${API_URL}/api/organization/${path.join("/")}` + request.nextUrl.search;

    const headers = new Headers();

    const cookie = request.headers.get("cookie");

    if (cookie) {
      headers.set("Cookie", cookie);
    }

    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    headers.set("Accept", request.headers.get("accept") ?? "application/json");

    headers.set(
      "Origin",
      request.headers.get("origin") ?? "http://localhost:3000",
    );

    const hasBody = request.method !== "GET" && request.method !== "HEAD";

    const body = hasBody ? await request.arrayBuffer() : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseBody = await backendResponse.text();

    const responseHeaders = new Headers();

    const responseContentType = backendResponse.headers.get("content-type");

    if (responseContentType) {
      responseHeaders.set("Content-Type", responseContentType);
    }

    // Forward any Set-Cookie headers
    // returned by the backend.
    const setCookies = backendResponse.headers.getSetCookie();

    for (const setCookie of setCookies) {
      responseHeaders.append("Set-Cookie", setCookie);
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Organization proxy error:", error);

    return NextResponse.json(
      {
        message: "Organization service unavailable",
      },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
