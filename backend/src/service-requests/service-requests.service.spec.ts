import {BadRequestException,ForbiddenException,NotFoundException,} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {beforeEach,describe,expect,it,vi,} from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestStatus } from './enum/service-request-status.enum';

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;
  const prismaMock = {
    department: {
      findUnique: vi.fn(),
    },
    serviceRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
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
    const module: TestingModule =
      await Test.createTestingModule({
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
  it('should create a submitted service request for the authenticated employee', async () => {
    prismaMock.department.findUnique.mockResolvedValue({
      id: 1,
      name: 'IT',
    });
    prismaMock.serviceRequest.create.mockResolvedValue({
      id: 2,
      employeeId: 101,
      departmentId: 1,
      handlerId: null,
      title: 'Laptop Issue',
      description: 'My laptop keeps shutting down.',
      category: 'hardware',
      priority: 'high',
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.create(
      101,
      {
        title: 'Laptop Issue',
        description: 'My laptop keeps shutting down.',
        departmentId: 1,
        category: 'hardware' as any,
        priority: 'high' as any,
      },
    );
    expect(result.employeeId).toBe(101);
    expect(result.handlerId).toBeNull();
    expect(result.status).toBe(
      ServiceRequestStatus.SUBMITTED,
    );
    expect(
      prismaMock.serviceRequest.create,
    ).toHaveBeenCalledWith({
      data: {
        employeeId: 101,
        departmentId: 1,
        handlerId: null,
        title: 'Laptop Issue',
        description: 'My laptop keeps shutting down.',
        category: 'hardware',
        priority: 'high',
        status: ServiceRequestStatus.SUBMITTED,
      },
    });
  });
  it('should reject creating a request for an unknown department', async () => {
    prismaMock.department.findUnique.mockResolvedValue(
      null,
    );
    await expect(
      service.create(
        101,
        {
          title: 'Unknown request',
          description: 'Test request',
          departmentId: 999,
          category: 'hardware' as any,
          priority: 'normal' as any,
        },
      ),
    ).rejects.toThrow(NotFoundException);
    expect(
      prismaMock.serviceRequest.create,
    ).not.toHaveBeenCalled();
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
      where: {
        id: 1,
      },
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
  it('should allow a handler to claim an unassigned request from the same department', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue({
      id: 2,
      employeeId: 101,
      departmentId: 1,
      handlerId: null,
      title: 'Laptop Issue',
      description: 'Laptop problem',
      category: 'hardware',
      priority: 'high',
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.serviceRequest.update.mockResolvedValue({
      id: 2,
      employeeId: 101,
      departmentId: 1,
      handlerId: 201,
      title: 'Laptop Issue',
      description: 'Laptop problem',
      category: 'hardware',
      priority: 'high',
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.assignToHandler(
      2,
      201,
      1,
    );
    expect(result.handlerId).toBe(201);
    expect(
      prismaMock.serviceRequest.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 2,
      },
      data: {
        handlerId: 201,
      },
    });
  });
  it('should reject a handler claiming a request from another department', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue({
      id: 2,
      employeeId: 101,
      departmentId: 2,
      handlerId: null,
      title: 'HR Request',
      description: 'Employment document request',
      category: 'employment_document',
      priority: 'normal',
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      service.assignToHandler(
        2,
        201,
        1,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(
      prismaMock.serviceRequest.update,
    ).not.toHaveBeenCalled();
  });
  it('should reject claiming an already assigned request', async () => {
    prismaMock.serviceRequest.findUnique.mockResolvedValue({
      id: 2,
      employeeId: 101,
      departmentId: 1,
      handlerId: 202,
      title: 'Laptop Issue',
      description: 'Laptop problem',
      category: 'hardware',
      priority: 'normal',
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      service.assignToHandler(
        2,
        201,
        1,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(
      prismaMock.serviceRequest.update,
    ).not.toHaveBeenCalled();
  });
  it('should return only requests for the handler department', async () => {
    prismaMock.serviceRequest.findMany.mockResolvedValue([
      {
        id: 2,
        employeeId: 101,
        departmentId: 1,
        handlerId: null,
        title: 'Laptop Issue',
        description: 'Laptop problem',
        category: 'hardware',
        priority: 'high',
        status: ServiceRequestStatus.SUBMITTED,
      },
    ]);
    const result = await service.findByDepartment(1);
    expect(result).toHaveLength(1);
    expect(
      prismaMock.serviceRequest.findMany,
    ).toHaveBeenCalledWith({
      where: {
        departmentId: 1,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });
  it('should reject handler inbox access without a department', async () => {
    await expect(
      service.findByDepartment(null),
    ).rejects.toThrow(ForbiddenException);
    expect(
      prismaMock.serviceRequest.findMany,
    ).not.toHaveBeenCalled();
  });
});