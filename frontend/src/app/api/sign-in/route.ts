import {
  dashboardForRole,
  frontendOrigin,
  gatewayUrl,
  loadWorkspace,
  WorkspaceError,
} from "@/lib/server/organization-workspace";

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || typeof body?.password !== "string") {
    return Response.json(
      { message: "Email and password are required." },
      { status: 400, headers: noStore },
    );
  }

  const origin = request.headers.get("origin") ?? frontendOrigin;
  try {
    const signIn = await fetch(gatewayUrl + "/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({
        email: body.email.trim(),
        password: body.password,
        rememberMe: body.rememberMe === true,
      }),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!signIn.ok) {
      const data = await signIn.json().catch(() => null);
      return Response.json(
        {
          message:
            typeof data?.message === "string"
              ? data.message
              : "Unable to sign in. Please try again.",
        },
        { status: signIn.status, headers: noStore },
      );
    }

    const cookies = signIn.headers.getSetCookie();
    if (!cookies.length)
      throw new WorkspaceError(
        503,
        "Sign-in did not create a session. Please try again.",
      );

    const session = cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
    const workspace = await loadWorkspace(session, origin);
    const headers = new Headers(noStore);
    for (const cookie of cookies) headers.append("Set-Cookie", cookie);

    const role = workspace.currentUser.systemUser.role;
    return Response.json(
      {
        workspace,
        user: workspace.currentUser.user,
        role,
        redirectTo: dashboardForRole(role),
      },
      { headers },
    );
  } catch (error) {
    const status = error instanceof WorkspaceError ? error.status : 503;
    const message =
      error instanceof WorkspaceError
        ? error.message
        : "Sign-in is temporarily unavailable. Please try again.";
    return Response.json({ message }, { status, headers: noStore });
  }
}
