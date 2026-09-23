import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import request from 'supertest';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import {
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ServiceRequestStatus } from '../src/service-requests/enum/service-request-status.enum';
describe('Service Request E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let requestId: number;
  let handlerToken: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.serviceRequestStatusHistory.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await prisma.department.create({
      data: {
        id: 1,
        name: 'IT',
      },
    });
    const passwordHash = await bcrypt.hash(
      'password123',
      10,
    );
    await prisma.user.create({
      data: {
        id: 101,
        name: 'E2E Employee',
        email: 'e2e.employee@example.com',
        passwordHash,
        role: UserRole.EMPLOYEE,
      },
    });
    await prisma.user.create({
      data: {
        id: 201,
        name: 'E2E IT Handler',
        email: 'e2e.handler@example.com',
        passwordHash,
        role: UserRole.HANDLER,
        departmentId: 1,
      },
    });
    const created =
      await prisma.serviceRequest.create({
        data: {
          employeeId: 101,
          departmentId: 1,
          handlerId: 201,
          title: 'E2E Test Request',
          description:
            'Used to verify the full API flow.',
          category: 'hardware',
          priority: 'normal',
          status: ServiceRequestStatus.SUBMITTED,
        },
      });
    requestId = created.id;
    const loginResponse = await request(
      app.getHttpServer(),
    )
      .post('/auth/login')
      .send({
        email: 'e2e.handler@example.com',
        password: 'password123',
      })
      .expect(201);
    handlerToken = loginResponse.body.accessToken;
    expect(handlerToken).toBeTruthy();
  });
  afterAll(async () => {
    await prisma.serviceRequestStatusHistory.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await app.close();
  });
  it(
    'should allow the authenticated assigned handler to move a request to in_progress',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .patch(
          `/service-requests/${requestId}/status`,
        )
        .set(
          'Authorization',
          `Bearer ${handlerToken}`,
        )
        .send({
          status: ServiceRequestStatus.IN_PROGRESS,
        })
        .expect(200);
      expect(response.body.status).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );
      expect(response.body.handlerId).toBe(201);
      const persisted =
        await prisma.serviceRequest.findUnique({
          where: {
            id: requestId,
          },
        });
      expect(persisted?.status).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );
      const history =
        await prisma.serviceRequestStatusHistory.findFirst({
          where: {
            serviceRequestId: requestId,
          },
        });
      expect(history).not.toBeNull();
      expect(history?.fromStatus).toBe(
        ServiceRequestStatus.SUBMITTED,
      );
      expect(history?.toStatus).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );
      expect(history?.changedByUserId).toBe(201);
    },
  );
});