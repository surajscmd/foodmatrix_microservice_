const apiUrl = process.env.FOODMATRIX_API_URL ?? "http://localhost:8000";

function resetErrorMessage(status: number, code: unknown, requestingEmail: boolean) {
  switch (code) {
    case "RESET_PASSWORD_DISABLED":
      return "Password reset email hasn’t been set up. Contact your administrator.";
    case "INVALID_ORIGIN":
    case "INVALID_REDIRECT_URL":
      return "Password reset isn’t available at this web address. Use your usual FoodMatrix sign-in address.";
    case "INVALID_TOKEN":
      return "This reset link is invalid or has expired. Request a new link.";
    case "PASSWORD_TOO_SHORT":
      return "Your new password is too short.";
    case "PASSWORD_TOO_LONG":
      return "Your new password is too long.";
    case "VALIDATION_ERROR":
      return requestingEmail
        ? "Enter a valid email address."
        : "Check your new password and try again.";
  }

  if (status === 429) return "Too many attempts. Please wait and try again.";
  return "Password reset is temporarily unavailable. Please try again later.";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    !request.headers.get("content-type")?.startsWith("application/json")
  ) {
    return Response.json(
      { message: "Invalid reset request." },
      { status: 400 },
    );
  }

  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== "object") {
    return Response.json(
      { message: "Invalid reset request." },
      { status: 400 },
    );
  }

  try {
    let endpoint: string;
    let payload: object;
    if ("email" in input && typeof input.email === "string") {
      endpoint = "request-password-reset";
      payload = {
        email: input.email.trim(),
        redirectTo: new URL("/login/reset-password", origin).href,
      };
    } else if (
      "token" in input &&
      typeof input.token === "string" &&
      "newPassword" in input &&
      typeof input.newPassword === "string"
    ) {
      endpoint = "reset-password";
      payload = { token: input.token, newPassword: input.newPassword };
    } else {
      return Response.json(
        { message: "Invalid reset request." },
        { status: 400 },
      );
    }

    const response = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) return Response.json({ ok: true });

    const error = await response.json().catch(() => null);
    const message = resetErrorMessage(
      response.status,
      error?.code,
      endpoint === "request-password-reset",
    );
    return Response.json({ message }, { status: response.status });
  } catch {
    return Response.json(
      { message: "Password reset is temporarily unavailable." },
      { status: 503 },
    );
  }
}
