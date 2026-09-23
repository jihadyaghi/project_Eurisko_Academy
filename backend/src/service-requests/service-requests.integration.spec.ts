import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestStatus } from './enum/service-request-status.enum';
describe('ServiceRequestsService Integration', () => {
  const prisma = new PrismaService();
  const service = new ServiceRequestsService(prisma);
  beforeAll(async () => {
    await prisma.$connect();
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
    await prisma.user.create({
      data: {
        id: 101,
        name: 'Test Employee',
        email: 'test.employee@example.com',
        passwordHash: 'test-password-hash',
        role: UserRole.EMPLOYEE,
      },
    });
    await prisma.user.create({
      data: {
        id: 201,
        name: 'Test IT Handler',
        email: 'test.handler@example.com',
        passwordHash: 'test-password-hash',
        role: UserRole.HANDLER,
        departmentId: 1,
      },
    });
    await prisma.serviceRequest.create({
      data: {
        employeeId: 101,
        departmentId: 1,
        handlerId: 201,
        title: 'Laptop Issue',
        description: 'My laptop is not turning on.',
        category: 'hardware',
        priority: 'normal',
        status: ServiceRequestStatus.SUBMITTED,
      },
    });
  });
  afterAll(async () => {
    await prisma.serviceRequestStatusHistory.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await prisma.$disconnect();
  });
  it('should persist a valid status transition in SQLite', async () => {
    const request = await prisma.serviceRequest.findFirst();
    expect(request).not.toBeNull();
    const updated = await service.transitionStatus(
      request!.id,
      ServiceRequestStatus.IN_PROGRESS,
      201,
    );
    expect(updated.status).toBe(
      ServiceRequestStatus.IN_PROGRESS,
    );
    const persisted =
      await prisma.serviceRequest.findUnique({
        where: {
          id: request!.id,
        },
      });
    expect(persisted?.status).toBe(
      ServiceRequestStatus.IN_PROGRESS,
    );
    const history =
      await prisma.serviceRequestStatusHistory.findFirst({
        where: {
          serviceRequestId: request!.id,
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
  });
});