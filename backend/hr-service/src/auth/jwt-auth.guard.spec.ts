import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

it('requests the HR access endpoint under the configured Organization path', async () => {
  const originalUrl = process.env.ORGANIZATION_SERVICE_URL;
  process.env.ORGANIZATION_SERVICE_URL =
    'http://example.test/api/organization/';
  try {
    const request = { headers: { authorization: 'Bearer token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const user = {
      id: 'account',
      role: 'FRANCHISE_ADMIN',
      franchiseId: 'franchise',
      managedRestaurantId: null,
      restaurants: [],
    };
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json(user));

    await expect(new JwtAuthGuard().canActivate(context)).resolves.toBe(true);
    expect(fetch.mock.calls[0]?.[0]).toEqual(
      new URL('http://example.test/api/organization/hr-access'),
    );
    expect(fetch.mock.calls[0]?.[1]?.headers).toEqual({
      Authorization: 'Bearer token',
    });
    expect(request).toHaveProperty('user', user);
  } finally {
    if (originalUrl === undefined) delete process.env.ORGANIZATION_SERVICE_URL;
    else process.env.ORGANIZATION_SERVICE_URL = originalUrl;
    jest.restoreAllMocks();
  }
});
