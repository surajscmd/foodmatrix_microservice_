import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") ?? "";

    const origin =
      request.headers.get("origin") ??
      "http://localhost:3000";

    const logoutResponse = await fetch(
      `${API_URL}/api/auth/sign-out`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
          Origin: origin,
        },
        cache: "no-store",
      },
    );

    const data = await logoutResponse
      .json()
      .catch(() => null);

    const response = NextResponse.json(
      data ?? {
        success: logoutResponse.ok,
      },
      {
        status: logoutResponse.status,
      },
    );

    // Forward Better Auth cookie deletion
    const setCookies =
      logoutResponse.headers.getSetCookie();

    for (const setCookie of setCookies) {
      response.headers.append(
        "Set-Cookie",
        setCookie,
      );
    }

    return response;
  } catch (error) {
    console.error("FoodMatrix logout error:", error);

    return NextResponse.json(
      {
        message: "Logout failed",
      },
      {
        status: 503,
      },
    );
  }
}
