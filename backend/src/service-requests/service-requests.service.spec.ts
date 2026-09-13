import {BadRequestException} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {PrismaService} from '../prisma/prisma.service';
import {ServiceRequestsService} from './service-requests.service';
import {ServiceRequestStatus} from './enum/service-request-status.enum';
import {beforeEach, describe, expect, it, vi} from 'vitest';
describe('ServiceRequestsService', ()=>{
  let service: ServiceRequestsService;
  const prismaMock = {
    serviceRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  };
  beforeEach(async ()=>{
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        {
          provide: PrismaService,
          useValue: prismaMock 
        }
      ]
    }).compile();
    service = module.get<ServiceRequestsService>(ServiceRequestsService);
    vi.clearAllMocks();
  });
  it('should reject completed -> in progress transition', async ()=>{
    prismaMock.serviceRequest.findUnique.mockResolvedValue({
      id: 1,
      employeeId: 101,
      departmentId: 1,
      handlerId: 201,
      title: 'Laptop Issue',
      description: 'My laptop is not turning on.',
      status: ServiceRequestStatus.COMPLETED,
    });
    await expect(
      service.transitionStatus(1, ServiceRequestStatus.IN_PROGRESS, 201)
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.serviceRequest.update).not.toHaveBeenCalled();
  });
});