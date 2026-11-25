import { jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from './lib/prisma/prisma.service.js';

describe('HealthController', () => {
  const query = jest.fn<() => Promise<unknown>>();
  const controller = new HealthController({
    $queryRaw: query,
  } as unknown as PrismaService);

  beforeEach(() => query.mockReset());
  afterEach(() => jest.useRealTimers());

  it('keeps liveness independent of database availability', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(query).not.toHaveBeenCalled();
  });

  it('reports ready only after the database responds', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.ready()).resolves.toEqual({ status: 'ready' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns unavailable without leaking database error details', async () => {
    query.mockRejectedValue(new Error('private connection details'));
    await expect(controller.ready()).rejects.toThrow(
      new ServiceUnavailableException('Database is unavailable'),
    );
  });

  it('coalesces concurrent probes into one database query', async () => {
    let release: (() => void) | undefined;
    query.mockReturnValue(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    const first = controller.ready();
    const second = controller.ready();
    expect(query).toHaveBeenCalledTimes(1);
    release?.();
    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: 'ready' },
      { status: 'ready' },
    ]);
  });

  it('bounds readiness time when the database does not respond', async () => {
    jest.useFakeTimers();
    query.mockReturnValue(new Promise(() => undefined));
    const result = expect(controller.ready()).rejects.toThrow(
      new ServiceUnavailableException('Database is unavailable'),
    );
    await jest.advanceTimersByTimeAsync(2000);
    await result;
  });
});
