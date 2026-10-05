import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000";

function getRedirectPath(role: unknown) {
  switch (role) {
    case "SUPER_ADMIN":
    case "FRANCHISE_ADMIN":
    case "OPERATIONS":
      return "/operations";

    case "RESTAURANT_ADMIN":
    case "STAFF":
      return "/restaurant";

    default:
      return "/unauthorized";
  }
}

function decodeJwtPayload(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT");
  }

  const normalized = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return JSON.parse(
    Buffer.from(normalized, "base64").toString("utf-8"),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const origin =
      request.headers.get("origin") ??
      "http://localhost:3000";

    // ---------------------------------------------
    // 1. Login through Kong
    // ---------------------------------------------

    const signInResponse = await axios.post(
      `${API_URL}/api/auth/sign-in/email`,
      {
        email: body.email,
        password: body.password,
        rememberMe: body.rememberMe ?? false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
        },
        validateStatus: () => true,
      },
    );

    if (signInResponse.status < 200 ||
        signInResponse.status >= 300) {
      return NextResponse.json(
        {
          message:
            signInResponse.data?.message ??
            "Invalid email or password",
        },
        {
          status: signInResponse.status,
        },
      );
    }

    // ---------------------------------------------
    // 2. Get Better Auth session cookies
    // ---------------------------------------------

    const setCookies =
      signInResponse.headers["set-cookie"] ?? [];

    if (setCookies.length === 0) {
      return NextResponse.json(
        {
          message:
            "Login succeeded but no session cookie was created",
        },
        {
          status: 500,
        },
      );
    }

    const cookieHeader = setCookies
      .map((cookie) => cookie.split(";")[0])
      .join("; ");

    // ---------------------------------------------
    // 3. Get JWT through Kong
    // ---------------------------------------------

    const tokenResponse = await axios.get(
      `${API_URL}/api/auth/token`,
      {
        headers: {
          Cookie: cookieHeader,
          Origin: origin,
        },
        validateStatus: () => true,
      },
    );

    if (
      tokenResponse.status < 200 ||
      tokenResponse.status >= 300 ||
      !tokenResponse.data?.token
    ) {
      console.error(
        "JWT generation failed:",
        tokenResponse.status,
        tokenResponse.data,
      );

      return NextResponse.json(
        {
          message:
            "Login succeeded but JWT generation failed",
        },
        {
          status: 500,
        },
      );
    }

    // ---------------------------------------------
    // 4. Read role from JWT
    // ---------------------------------------------

    const jwtPayload = decodeJwtPayload(
      tokenResponse.data.token,
    );

    const role = jwtPayload.role;

    console.log("FoodMatrix authentication:", {
      email: jwtPayload.email,
      role,
      franchiseId: jwtPayload.franchiseId,
      managedRestaurantId:
        jwtPayload.managedRestaurantId,
    });

    // ---------------------------------------------
    // 5. Determine destination
    // ---------------------------------------------

    const redirectTo = getRedirectPath(role);

    // ---------------------------------------------
    // 6. Send response to browser
    // ---------------------------------------------

    const response = NextResponse.json({
      user: signInResponse.data?.user ?? null,
      role,
      redirectTo,
    });

    // ---------------------------------------------
    // 7. Forward Better Auth cookies
    // ---------------------------------------------

    for (const cookie of setCookies) {
      response.headers.append(
        "Set-Cookie",
        cookie,
      );
    }

    return response;
  } catch (error) {
    console.error(
      "FoodMatrix authentication error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Authentication service unavailable",
      },
      {
        status: 503,
      },
    );
  }
}