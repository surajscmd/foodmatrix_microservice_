import { afterEach, expect, it, jest } from '@jest/globals';
import { deliverPasswordReset } from './password-reset-delivery.js';

afterEach(() => {
  jest.restoreAllMocks();
});

it('sends the reset link to the configured mail webhook without following redirects', async () => {
  const fetch = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 202 }));
  await deliverPasswordReset(
    'https://mailer.example/reset',
    'test-token',
    'staff@example.com',
    'https://auth.example/reset/link',
  );
  expect(fetch).toHaveBeenCalledWith(
    new URL('https://mailer.example/reset'),
    expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        email: 'staff@example.com',
        resetUrl: 'https://auth.example/reset/link',
      }),
      redirect: 'error',
    }),
  );
});

it('never sends a reset link over plain HTTP', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch');
  await expect(
    deliverPasswordReset(
      'http://mailer.example/reset',
      'test-token',
      'staff@example.com',
      'https://auth.example/reset/link',
    ),
  ).rejects.toThrow('requires HTTPS');
  expect(fetch).not.toHaveBeenCalled();
});
