import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
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

import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';

import { ServiceRequestStatus } from '../src/service-requests/enum/service-request-status.enum';

describe('Service Request E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let employeeToken: string;
  let secondEmployeeToken: string;

  let handlerToken: string;
  let secondHandlerToken: string;
  let hrHandlerToken: string;

  let otherEmployeeRequestId: number;
  let hrRequestId: number;
  let assignedRequestId: number;

  const notificationsMock = {
    sendRequestCompletedEmail:
      vi.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(
          NotificationsService,
        )
        .useValue(notificationsMock)
        .compile();

    app =
      moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    // Clean test database in FK-safe order
    await prisma.serviceRequestStatusHistory.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    // Departments
    await prisma.department.create({
      data: {
        id: 1,
        name: 'IT',
      },
    });

    await prisma.department.create({
      data: {
        id: 2,
        name: 'HR',
      },
    });

    const passwordHash =
      await bcrypt.hash(
        'password123',
        10,
      );

    // Employee 1
    await prisma.user.create({
      data: {
        id: 101,
        name: 'E2E Employee',
        email:
          'e2e.employee@example.com',
        passwordHash,
        role: UserRole.EMPLOYEE,
        isActive: true,
      },
    });

    // Employee 2
    await prisma.user.create({
      data: {
        id: 102,
        name: 'Second E2E Employee',
        email:
          'e2e.employee2@example.com',
        passwordHash,
        role: UserRole.EMPLOYEE,
        isActive: true,
      },
    });

    // IT Handler 1
    await prisma.user.create({
      data: {
        id: 201,
        name: 'E2E IT Handler',
        email:
          'e2e.handler@example.com',
        passwordHash,
        role: UserRole.HANDLER,
        departmentId: 1,
        isActive: true,
      },
    });

    // IT Handler 2
    await prisma.user.create({
      data: {
        id: 202,
        name:
          'Second E2E IT Handler',
        email:
          'e2e.handler2@example.com',
        passwordHash,
        role: UserRole.HANDLER,
        departmentId: 1,
        isActive: true,
      },
    });

    // HR Handler
    await prisma.user.create({
      data: {
        id: 203,
        name: 'E2E HR Handler',
        email:
          'e2e.hr.handler@example.com',
        passwordHash,
        role: UserRole.HANDLER,
        departmentId: 2,
        isActive: true,
      },
    });

    // Request owned by Employee 2
    const otherEmployeeRequest =
      await prisma.serviceRequest.create({
        data: {
          employeeId: 102,
          departmentId: 1,
          handlerId: null,
          title:
            'Other Employee Request',
          description:
            'Request belonging to another employee.',
          category: 'hardware',
          priority: 'normal',
          status:
            ServiceRequestStatus.SUBMITTED,
        },
      });

    otherEmployeeRequestId =
      otherEmployeeRequest.id;

    // HR request
    const hrRequest =
      await prisma.serviceRequest.create({
        data: {
          employeeId: 102,
          departmentId: 2,
          handlerId: 203,
          title:
            'HR Document Request',
          description:
            'Request belonging to HR department.',
          category:
            'employment_document',
          priority: 'normal',
          status:
            ServiceRequestStatus.SUBMITTED,
        },
      });

    hrRequestId = hrRequest.id;

    // Request assigned to IT Handler 1
    const assignedRequest =
      await prisma.serviceRequest.create({
        data: {
          employeeId: 101,
          departmentId: 1,
          handlerId: 201,
          title:
            'Assigned IT Request',
          description:
            'This request is assigned to handler 201.',
          category: 'hardware',
          priority: 'normal',
          status:
            ServiceRequestStatus.SUBMITTED,
        },
      });

    assignedRequestId =
      assignedRequest.id;

    // Employee 1 login
    const employeeLoginResponse =
      await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email:
            'e2e.employee@example.com',
          password: 'password123',
        })
        .expect(201);

    employeeToken =
      employeeLoginResponse.body
        .accessToken;

    expect(
      employeeToken,
    ).toBeTruthy();

    // Employee 2 login
    const secondEmployeeLoginResponse =
      await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email:
            'e2e.employee2@example.com',
          password: 'password123',
        })
        .expect(201);

    secondEmployeeToken =
      secondEmployeeLoginResponse
        .body.accessToken;

    expect(
      secondEmployeeToken,
    ).toBeTruthy();

    // IT Handler 1 login
    const handlerLoginResponse =
      await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email:
            'e2e.handler@example.com',
          password: 'password123',
        })
        .expect(201);

    handlerToken =
      handlerLoginResponse.body
        .accessToken;

    expect(
      handlerToken,
    ).toBeTruthy();

    // IT Handler 2 login
    const secondHandlerLoginResponse =
      await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email:
            'e2e.handler2@example.com',
          password: 'password123',
        })
        .expect(201);

    secondHandlerToken =
      secondHandlerLoginResponse
        .body.accessToken;

    expect(
      secondHandlerToken,
    ).toBeTruthy();

    // HR Handler login
    const hrHandlerLoginResponse =
      await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email:
            'e2e.hr.handler@example.com',
          password: 'password123',
        })
        .expect(201);

    hrHandlerToken =
      hrHandlerLoginResponse.body
        .accessToken;

    expect(
      hrHandlerToken,
    ).toBeTruthy();
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
      const createResponse =
        await request(
          app.getHttpServer(),
        )
          .post(
            '/service-requests',
          )
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

      const requestId =
        createResponse.body.id;

      expect(
        requestId,
      ).toBeTruthy();

      expect(
        createResponse.body
          .employeeId,
      ).toBe(101);

      expect(
        createResponse.body
          .departmentId,
      ).toBe(1);

      expect(
        createResponse.body
          .handlerId,
      ).toBeNull();

      expect(
        createResponse.body.status,
      ).toBe(
        ServiceRequestStatus.SUBMITTED,
      );

      // Employee can see own request
      const employeeRequestDetails =
        await request(
          app.getHttpServer(),
        )
          .get(
            `/service-requests/${requestId}`,
          )
          .set(
            'Authorization',
            `Bearer ${employeeToken}`,
          )
          .expect(200);

      expect(
        employeeRequestDetails.body
          .employeeId,
      ).toBe(101);

      // Handler department inbox
      const inboxResponse =
        await request(
          app.getHttpServer(),
        )
          .get(
            '/service-requests/handler/inbox',
          )
          .set(
            'Authorization',
            `Bearer ${handlerToken}`,
          )
          .expect(200);

      const inboxRequest =
        inboxResponse.body.find(
          (item: any) =>
            item.id === requestId,
        );

      expect(
        inboxRequest,
      ).toBeDefined();

      expect(
        inboxRequest.departmentId,
      ).toBe(1);

      expect(
        inboxRequest.handlerId,
      ).toBeNull();

      // Claim
      const assignResponse =
        await request(
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

      expect(
        assignResponse.body
          .handlerId,
      ).toBe(201);

      // submitted -> in_progress
      const startResponse =
        await request(
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
            status:
              ServiceRequestStatus.IN_PROGRESS,
          })
          .expect(200);

      expect(
        startResponse.body.status,
      ).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );

      // in_progress -> completed
      const completeResponse =
        await request(
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
            status:
              ServiceRequestStatus.COMPLETED,
          })
          .expect(200);

      expect(
        completeResponse.body.status,
      ).toBe(
        ServiceRequestStatus.COMPLETED,
      );

      expect(
        notificationsMock
          .sendRequestCompletedEmail,
      ).toHaveBeenCalledTimes(1);

      expect(
        notificationsMock
          .sendRequestCompletedEmail,
      ).toHaveBeenCalledWith({
        employeeEmail:
          'e2e.employee@example.com',

        employeeName:
          'E2E Employee',

        requestId,

        requestTitle:
          'Laptop Issue',
      });

      // Verify persisted request
      const persistedRequest =
        await prisma.serviceRequest.findUnique({
          where: {
            id: requestId,
          },
        });

      expect(
        persistedRequest,
      ).not.toBeNull();

      expect(
        persistedRequest
          ?.employeeId,
      ).toBe(101);

      expect(
        persistedRequest
          ?.handlerId,
      ).toBe(201);

      expect(
        persistedRequest?.status,
      ).toBe(
        ServiceRequestStatus.COMPLETED,
      );

      // Verify audit history
      const history =
        await prisma.serviceRequestStatusHistory.findMany(
          {
            where: {
              serviceRequestId:
                requestId,
            },

            orderBy: {
              createdAt: 'asc',
            },
          },
        );

      expect(
        history,
      ).toHaveLength(2);

      expect(
        history[0].fromStatus,
      ).toBe(
        ServiceRequestStatus.SUBMITTED,
      );

      expect(
        history[0].toStatus,
      ).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );

      expect(
        history[0]
          .changedByUserId,
      ).toBe(201);

      expect(
        history[1].fromStatus,
      ).toBe(
        ServiceRequestStatus.IN_PROGRESS,
      );

      expect(
        history[1].toStatus,
      ).toBe(
        ServiceRequestStatus.COMPLETED,
      );

      expect(
        history[1]
          .changedByUserId,
      ).toBe(201);
    },
  );

  it(
    'should reject access to employee requests without authentication',
    async () => {
      await request(
        app.getHttpServer(),
      )
        .get(
          '/service-requests/my',
        )
        .expect(401);
    },
  );

  it(
    'should reject an employee accessing the handler inbox',
    async () => {
      await request(
        app.getHttpServer(),
      )
        .get(
          '/service-requests/handler/inbox',
        )
        .set(
          'Authorization',
          `Bearer ${employeeToken}`,
        )
        .expect(403);
    },
  );

  it(
    'should reject a handler creating an employee service request',
    async () => {
      await request(
        app.getHttpServer(),
      )
        .post(
          '/service-requests',
        )
        .set(
          'Authorization',
          `Bearer ${handlerToken}`,
        )
        .send({
          title:
            'Unauthorized Request',
          description:
            'A handler should not create this request.',
          departmentId: 1,
          category: 'hardware',
          priority: 'normal',
        })
        .expect(403);
    },
  );

  it(
    'should reject an employee viewing another employee request',
    async () => {
      await request(
        app.getHttpServer(),
      )
        .get(
          `/service-requests/${otherEmployeeRequestId}`,
        )
        .set(
          'Authorization',
          `Bearer ${employeeToken}`,
        )
        .expect(403);
    },
  );

  it(
    'should allow the owner to view their own request',
    async () => {
      const response =
        await request(
          app.getHttpServer(),
        )
          .get(
            `/service-requests/${otherEmployeeRequestId}`,
          )
          .set(
            'Authorization',
            `Bearer ${secondEmployeeToken}`,
          )
          .expect(200);

      expect(
        response.body.employeeId,
      ).toBe(102);
    },
  );

  it(
    'should reject an IT handler viewing an HR request',
    async () => {
      await request(
        app.getHttpServer(),
      )
        .get(
          `/service-requests/${hrRequestId}`,
        )
        .set(
          'Authorization',
          `Bearer ${handlerToken}`,
        )
        .expect(403);
    },
  );

  it(
    'should allow an HR handler to view an HR request',
    async () => {
      const response =
        await request(
          app.getHttpServer(),
        )
          .get(
            `/service-requests/${hrRequestId}`,
          )
          .set(
            'Authorization',
            `Bearer ${hrHandlerToken}`,
          )
          .expect(200);

      expect(
        response.body.departmentId,
      ).toBe(2);
    },
  );

  it(
    'should reject a different handler changing the status of an assigned request',
    async () => {
      await request(
        app.getHttpServer(),
      )
        .patch(
          `/service-requests/${assignedRequestId}/status`,
        )
        .set(
          'Authorization',
          `Bearer ${secondHandlerToken}`,
        )
        .send({
          status:
            ServiceRequestStatus.IN_PROGRESS,
        })
        .expect(403);

      const persistedRequest =
        await prisma.serviceRequest.findUnique({
          where: {
            id:
              assignedRequestId,
          },
        });

      expect(
        persistedRequest?.status,
      ).toBe(
        ServiceRequestStatus.SUBMITTED,
      );

      expect(
        persistedRequest
          ?.handlerId,
      ).toBe(201);
    },
  );

  it(
    'should not expose a public endpoint for all service requests',
    async () => {
      await request(
        app.getHttpServer(),
      )
        .get(
          '/service-requests',
        )
        .expect(404);
    },
  );
});