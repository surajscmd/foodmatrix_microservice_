export async function getOrderAuthorization(
  gateway: string,
  headers: HeadersInit,
  signal: AbortSignal,
) {
  const response = await fetch(`${gateway}/api/auth/token`, {
    headers,
    signal,
    cache: "no-store",
    redirect: "error",
  });

  if (!response.ok) {
    const status = response.status === 401 || response.status === 403
      ? response.status
      : 502;
    return { status, authorization: null };
  }

  const session = (await response.json()) as { token?: unknown } | null;
  if (typeof session?.token !== "string" || !session.token)
    return { status: 401, authorization: null };

  return { status: 200, authorization: `Bearer ${session.token}` };
}
