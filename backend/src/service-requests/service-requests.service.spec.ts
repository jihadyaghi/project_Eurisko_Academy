import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestStatus } from './enum/service-request-status.enum';
describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;
  const prismaMock = {
    serviceRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    serviceRequestStatusHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback: any) => {
      return callback({
        serviceRequest: prismaMock.serviceRequest,
        serviceRequestStatusHistory:
          prismaMock.serviceRequestStatusHistory,
      });
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();
    service = module.get<ServiceRequestsService>(
      ServiceRequestsService,
    );
    vi.clearAllMocks();
  });
  it('should reject completed -> in progress transition', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue({
      id: 1,
      employeeId: 101,
      departmentId: 1,
      handlerId: 201,
      title: 'Laptop Issue',
      description: 'My laptop is not turning on.',
      category: 'hardware',
      priority: 'normal',
      status: ServiceRequestStatus.COMPLETED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      service.transitionStatus(
        1,
        ServiceRequestStatus.IN_PROGRESS,
        201,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(
      prismaMock.serviceRequest.update,
    ).not.toHaveBeenCalled();
    expect(
      prismaMock.serviceRequestStatusHistory.create,
    ).not.toHaveBeenCalled();
  });
  it('should allow submitted -> in progress transition', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue({
      id: 1,
      employeeId: 101,
      departmentId: 1,
      handlerId: 201,
      title: 'Laptop Issue',
      description: 'My laptop is not turning on.',
      category: 'hardware',
      priority: 'normal',
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.serviceRequest.update.mockResolvedValue({
      id: 1,
      employeeId: 101,
      departmentId: 1,
      handlerId: 201,
      title: 'Laptop Issue',
      description: 'My laptop is not turning on.',
      category: 'hardware',
      priority: 'normal',
      status: ServiceRequestStatus.IN_PROGRESS,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.serviceRequestStatusHistory.create.mockResolvedValue({
      id: 1,
      serviceRequestId: 1,
      fromStatus: ServiceRequestStatus.SUBMITTED,
      toStatus: ServiceRequestStatus.IN_PROGRESS,
      changedByUserId: 201,
      createdAt: new Date(),
    });
    const result = await service.transitionStatus(
      1,
      ServiceRequestStatus.IN_PROGRESS,
      201,
    );
    expect(result.status).toBe(
      ServiceRequestStatus.IN_PROGRESS,
    );
    expect(
      prismaMock.serviceRequest.update,
    ).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: ServiceRequestStatus.IN_PROGRESS,
      },
    });
    expect(
      prismaMock.serviceRequestStatusHistory.create,
    ).toHaveBeenCalledWith({
      data: {
        serviceRequestId: 1,
        fromStatus: ServiceRequestStatus.SUBMITTED,
        toStatus: ServiceRequestStatus.IN_PROGRESS,
        changedByUserId: 201,
      },
    });
  });
});