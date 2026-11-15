import {
  frontendOrigin,
  loadWorkspace,
  WorkspaceError,
} from "@/lib/server/organization-workspace";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const workspace = await loadWorkspace(
      request.headers.get("cookie") ?? "",
      request.headers.get("origin") ?? frontendOrigin,
    );
    return Response.json({ workspace }, { headers });
  } catch (error) {
    const status = error instanceof WorkspaceError ? error.status : 503;
    const message =
      error instanceof WorkspaceError
        ? error.message
        : "We couldn’t load your workspace. Please try again.";
    return Response.json({ message }, { status, headers });
  }
}
