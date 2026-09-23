import {BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {ServiceRequestStatus} from './enum/service-request-status.enum';
import {PrismaService} from '../prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Injectable()
export class ServiceRequestsService {
    constructor(private readonly prisma: PrismaService) {}
    async create(employeeId: number, body: CreateServiceRequestDto){
        const department = await this.prisma.department.findUnique({
            where: {
                id: body.departmentId
            }
        });
        if (!department){
            throw new NotFoundException(`Department with id ${body.departmentId} not found`);
        }
        const request = await this.prisma.serviceRequest.create({
            data: {
                employeeId,
                departmentId: body.departmentId,
                handlerId: null,
                title: body.title,
                description: body.description,
                category: body.category,
                priority: body.priority,
                status: ServiceRequestStatus.SUBMITTED
            }
        });
        return request;
    }
    findAll() {
        return this.prisma.serviceRequest.findMany();
    }
    async findOne(id: number) {
        const request = await this.prisma.serviceRequest.findUnique({
            where: { id },
        })
        if (!request){
            throw new NotFoundException(`Service request with id ${id} not found`);
        }
        return request;
    }
    async transitionStatus(id: number, targetStatus: ServiceRequestStatus, handlerId: number) {
        const request = await this.findOne(id);
        if (request.handlerId !== handlerId) {
            throw new ForbiddenException('Only the assigned handler can change this Service Request status');
        }
        const validTransitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
            [ServiceRequestStatus.SUBMITTED]: [ServiceRequestStatus.IN_PROGRESS],
            [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.COMPLETED],
            [ServiceRequestStatus.COMPLETED]: []
        };
        const currentStatus = request.status as ServiceRequestStatus;
        const allowedNestStatuses = validTransitions[currentStatus];
        if (!allowedNestStatuses.includes(targetStatus)) {
            throw new BadRequestException(`Invalid status transition from ${request.status} to ${targetStatus}`);
        };
        const updatedRequest = await this.prisma.$transaction(
            async (tx) => {
                const updated = await tx.serviceRequest.update({
                    where: {id},
                    data: {
                        status: targetStatus
                    }
                });
                await tx.serviceRequestStatusHistory.create({
                    data: {
                        serviceRequestId: id,
                        fromStatus: currentStatus,
                        toStatus: targetStatus,
                        changedByUserId: handlerId
                    }
                });
                return updated;
            }
        )
        return updatedRequest;
    }
    async findByDepartment(departmentId: number | null) {
    if (departmentId === null) {
    throw new ForbiddenException('Handler is not assigned to a department',);
    }
    return this.prisma.serviceRequest.findMany({
    where: {
      departmentId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    });
   }
   async assignToHandler(requestId: number,handlerId: number,handlerDepartmentId: number | null,) {
    if (handlerDepartmentId === null) {
    throw new ForbiddenException('Handler is not assigned to a department',);
    }
    const request = await this.findOne(requestId);
    if (request.departmentId !== handlerDepartmentId) {
    throw new ForbiddenException('Handler cannot claim a request from another department',);
    }
    if (request.handlerId !== null) {
    throw new BadRequestException('Service request is already assigned',);
    }
    return this.prisma.serviceRequest.update({
    where: {
      id: requestId,
    },
    data: {
      handlerId,
    },
   });
}
}
