import {afterAll,beforeAll,describe,expect,it,} from 'vitest';
import request from 'supertest';
import {INestApplication,ValidationPipe,} from '@nestjs/common';
import {Test,TestingModule,} from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ServiceRequestStatus } from '../src/service-requests/enum/service-request-status.enum';

describe('Service Request E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let employeeToken: string;
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
    const employeeLoginResponse = await request(
      app.getHttpServer(),
    )
      .post('/auth/login')
      .send({
        email: 'e2e.employee@example.com',
        password: 'password123',
      })
      .expect(201);
    employeeToken =
      employeeLoginResponse.body.accessToken;
    expect(employeeToken).toBeTruthy();
    const handlerLoginResponse = await request(
      app.getHttpServer(),
    )
      .post('/auth/login')
      .send({
        email: 'e2e.handler@example.com',
        password: 'password123',
      })
      .expect(201);
    handlerToken =
      handlerLoginResponse.body.accessToken;
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
    'should complete the employee-to-handler service request flow',
    async () => {
      const createResponse = await request(
        app.getHttpServer(),
      )
        .post('/service-requests')
        .set(
          'Authorization',
          `Bearer ${employeeToken}`,
        )
        .send({
          title: 'Laptop Issue',
          description:
            'My laptop keeps shutting down and I cannot work.',
          departmentId: 1,
          category: 'hardware',
          priority: 'high',
        })
        .expect(201);
      const requestId = createResponse.body.id;
      expect(requestId).toBeTruthy();
      expect(createResponse.body.employeeId).toBe(
        101,
      );
      expect(createResponse.body.departmentId).toBe(
        1,
      );
      expect(createResponse.body.handlerId).toBeNull();
      expect(createResponse.body.status).toBe(
        ServiceRequestStatus.SUBMITTED,
      );
      const inboxResponse = await request(
        app.getHttpServer(),
      )
        .get('/service-requests/handler/inbox')
        .set(
          'Authorization',
          `Bearer ${handlerToken}`,
        )
        .expect(200);
      const inboxRequest =
        inboxResponse.body.find(
          (item: any) => item.id === requestId,
        );
      expect(inboxRequest).toBeDefined();
      expect(inboxRequest.departmentId).toBe(1);
      expect(inboxRequest.handlerId).toBeNull();
      const assignResponse = await request(
        app.getHttpServer(),
      )
        .patch(
          `/service-requests/${requestId}/assign`,
        )
        .set(
          'Authorization',
          `Bearer ${handlerToken}`,
        )
        .expect(200);
      expect(assignResponse.body.handlerId).toBe(
        201,
      );
      const startResponse = await request(
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

      expect(startResponse.body.status).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );
      const completeResponse = await request(
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
          status: ServiceRequestStatus.COMPLETED,
        })
        .expect(200);
      expect(completeResponse.body.status).toBe(
        ServiceRequestStatus.COMPLETED,
      );
      const persistedRequest =
        await prisma.serviceRequest.findUnique({
          where: {
            id: requestId,
          },
        });
      expect(persistedRequest).not.toBeNull();
      expect(persistedRequest?.employeeId).toBe(101);
      expect(persistedRequest?.handlerId).toBe(201);
      expect(persistedRequest?.status).toBe(
        ServiceRequestStatus.COMPLETED,
      );
      const history =
        await prisma.serviceRequestStatusHistory.findMany({
          where: {
            serviceRequestId: requestId,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });
      expect(history).toHaveLength(2);
      expect(history[0].fromStatus).toBe(
        ServiceRequestStatus.SUBMITTED,
      );
      expect(history[0].toStatus).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );
      expect(history[0].changedByUserId).toBe(201);
      expect(history[1].fromStatus).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );
      expect(history[1].toStatus).toBe(
        ServiceRequestStatus.COMPLETED,
      );
      expect(history[1].changedByUserId).toBe(201);
    },
  );
});