export async function deliverPasswordReset(
  endpoint: string,
  token: string | undefined,
  email: string,
  resetUrl: string,
) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || !token) {
    throw new Error('Password reset delivery requires HTTPS and a token');
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, resetUrl }),
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error('Password reset delivery was rejected');
}
