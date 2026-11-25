import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { KafkaProducerService } from '../src/modules/kafka/kafka-producer.service';
import { ShiftScheduleService } from '../src/modules/shift-schedule/shift-schedule.service';

const assigned = 'f058e4b4-4550-4a30-8bf8-147c062df5cb';
const other = '1d5dcd9e-3f40-407e-be69-5e049a077787';
const findSchedules = jest.fn();
const createSchedule = jest.fn();
const createTemplate = jest.fn<
  Promise<unknown>,
  [Prisma.ShiftTemplateCreateArgs]
>();
const queryRaw = jest.fn();

describe('HR HTTP API', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: queryRaw,
        shiftTemplate: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: createTemplate,
        },
      })
      .overrideProvider(KafkaProducerService)
      .useValue({})
      .overrideProvider(ShiftScheduleService)
      .useValue({ findAll: findSchedules, create: createSchedule })
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    findSchedules.mockReset().mockResolvedValue({ data: [] });
    createSchedule.mockReset();
    createTemplate.mockReset().mockResolvedValue({ status: 'ACTIVE' });
    queryRaw.mockReset().mockResolvedValue([]);
  });

  it('exposes anonymous liveness and database readiness probes', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ status: 'ok' });
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect({ status: 'ready' });
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  function authenticateAs(role: string) {
    return jest.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        Response.json({
          id: 'account',
          role,
          franchiseId: 'franchise',
          managedRestaurantId: role === 'FRANCHISE_ADMIN' ? null : assigned,
          restaurants: [
            {
              id: assigned,
              name: 'Assigned',
              timezone: 'Asia/Kolkata',
              currency: 'INR',
            },
          ],
        }),
      ),
    );
  }

  it('limits unfiltered franchise schedule requests and denies locations outside that franchise', async () => {
    authenticateAs('FRANCHISE_ADMIN');
    await request(app.getHttpServer())
      .get('/shift-schedules')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
    expect(findSchedules).toHaveBeenCalledWith(
      { in: [assigned] },
      undefined,
      undefined,
      undefined,
    );
    await request(app.getHttpServer())
      .get('/shift-schedules')
      .query({ restaurantId: other })
      .set('Authorization', 'Bearer test-token')
      .expect(403);
    expect(findSchedules).toHaveBeenCalledTimes(1);
  });

  it('lets staff read their restaurant schedule while requiring management access to create shifts', async () => {
    authenticateAs('STAFF');
    await request(app.getHttpServer())
      .get('/shift-schedules')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
    expect(findSchedules).toHaveBeenCalledWith(
      assigned,
      undefined,
      undefined,
      undefined,
    );
    await request(app.getHttpServer())
      .post('/shift-schedules')
      .set('Authorization', 'Bearer test-token')
      .send({
        restaurantId: assigned,
        staffId: other,
        shiftTemplateId: other,
        scheduledStart: '2026-11-16T03:00:00.000Z',
        scheduledEnd: '2026-11-16T11:00:00.000Z',
      })
      .expect(403);
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('restricts Operations to its assigned location and fails closed when Organization is down', async () => {
    const organization = authenticateAs('OPERATIONS');
    await request(app.getHttpServer())
      .get('/shift-schedules')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
    expect(findSchedules).toHaveBeenCalledWith(
      assigned,
      undefined,
      undefined,
      undefined,
    );
    await request(app.getHttpServer())
      .get('/shift-schedules')
      .query({ restaurantId: other })
      .set('Authorization', 'Bearer test-token')
      .expect(403);
    organization.mockRejectedValueOnce(new Error('unavailable'));
    await request(app.getHttpServer())
      .get('/shift-schedules')
      .set('Authorization', 'Bearer test-token')
      .expect(503);
    expect(findSchedules).toHaveBeenCalledTimes(1);
  });

  it('rejects unauthenticated HR requests and invalid organization data', async () => {
    await request(app.getHttpServer()).get('/shift-schedules').expect(401);
    authenticateAs('OPERATIONS').mockResolvedValueOnce(
      Response.json({
        id: 'account',
        role: 'OPERATIONS',
        franchiseId: 'franchise',
        managedRestaurantId: assigned,
        restaurants: [null],
      }),
    );
    await request(app.getHttpServer())
      .get('/shift-schedules')
      .set('Authorization', 'Bearer test-token')
      .expect(503);
    expect(findSchedules).not.toHaveBeenCalled();
  });

  it('allows a shift template to use the default status and requires segment data', async () => {
    authenticateAs('RESTAURANT_ADMIN');
    const template = { restaurantId: assigned, name: 'Lunch', type: 'MORNING' };
    await request(app.getHttpServer())
      .post('/shift-templates')
      .set('Authorization', 'Bearer test-token')
      .send(template)
      .expect(400);
    await request(app.getHttpServer())
      .post('/shift-templates')
      .set('Authorization', 'Bearer test-token')
      .send({ ...template, segments: [] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/shift-templates')
      .set('Authorization', 'Bearer test-token')
      .send({ ...template, segments: [null] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/shift-templates')
      .set('Authorization', 'Bearer test-token')
      .send({
        ...template,
        segments: [
          {
            sequence: 1,
            startTime: '09:00',
            endTime: '17:00',
            crossesMidnight: false,
          },
        ],
      })
      .expect(201);
    expect(createTemplate).toHaveBeenCalledTimes(1);
    expect(createTemplate.mock.calls[0]?.[0]).toMatchObject({
      data: { status: 'ACTIVE' },
    });
  });

  it('rejects explicit nulls for optional staff fields', async () => {
    authenticateAs('RESTAURANT_ADMIN');
    await request(app.getHttpServer())
      .patch('/staff/' + other)
      .set('Authorization', 'Bearer test-token')
      .send({ pin: null })
      .expect(400);
  });

  it('rejects a leave request with an impossible calendar date', async () => {
    authenticateAs('RESTAURANT_ADMIN');
    await request(app.getHttpServer())
      .post('/leaves')
      .set('Authorization', 'Bearer test-token')
      .send({
        staffId: other,
        type: 'Annual',
        isPaidLeave: true,
        startDate: '2026-02-30',
        endDate: '2026-03-02',
        reason: 'Holiday',
      })
      .expect(400);
  });

  it('returns database status without staff data', async () => {
    await request(app.getHttpServer())
      .get('/prisma/test')
      .expect(200, { message: 'HR database connection successful' });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
});
