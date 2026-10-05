import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

type UserRole =
  | "SUPER_ADMIN"
  | "FRANCHISE_ADMIN"
  | "RESTAURANT_ADMIN"
  | "STAFF"
  | "OPERATIONS";

function getAllowedPortal(role: unknown) {
  switch (role) {
    case "SUPER_ADMIN":
    case "FRANCHISE_ADMIN":
    case "OPERATIONS":
      return "operations";

    case "RESTAURANT_ADMIN":
    case "STAFF":
      return "restaurant";

    default:
      return null;
  }
}

function decodeJwtPayload(token: string): {
  role?: UserRole;
} {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT");
  }

  const normalized = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  return JSON.parse(
    Buffer.from(padded, "base64").toString("utf-8"),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isOperationsRoute =
    pathname === "/operations" ||
    pathname.startsWith("/operations/");

  const isRestaurantRoute =
    pathname === "/restaurant" ||
    pathname.startsWith("/restaurant/");

  // Only protect dashboard routes.
  if (!isOperationsRoute && !isRestaurantRoute) {
    return NextResponse.next();
  }

  const cookie = request.headers.get("cookie");

  // No Better Auth session cookie.
  if (!cookie) {
    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  try {
    // Ask Better Auth for the JWT associated with this session.
    const tokenResponse = await fetch(
      `${API_URL}/api/auth/token`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
          Origin: FRONTEND_ORIGIN,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL("/login", request.url),
      );
    }

    const tokenData = await tokenResponse.json();

    if (
      !tokenData ||
      typeof tokenData.token !== "string"
    ) {
      return NextResponse.redirect(
        new URL("/login", request.url),
      );
    }

    const jwtPayload = decodeJwtPayload(tokenData.token);

    const allowedPortal = getAllowedPortal(
      jwtPayload.role,
    );

    // Authenticated but no valid FoodMatrix role.
    if (!allowedPortal) {
      return NextResponse.redirect(
        new URL("/unauthorized", request.url),
      );
    }

    // Operations route
    if (isOperationsRoute && allowedPortal !== "operations") {
      return NextResponse.redirect(
        new URL("/unauthorized", request.url),
      );
    }

    // Restaurant route
    if (
      isRestaurantRoute &&
      allowedPortal !== "restaurant"
    ) {
      return NextResponse.redirect(
        new URL("/unauthorized", request.url),
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error(
      "FoodMatrix route protection error:",
      error,
    );

    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }
}

export const config = {
  matcher: [
    "/operations",
    "/operations/:path*",
    "/restaurant",
    "/restaurant/:path*",
  ],
};
