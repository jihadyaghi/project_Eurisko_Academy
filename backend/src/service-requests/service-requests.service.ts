import {BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {Service_Requests} from './service-requests.data';
import {ServiceRequestStatus} from './enum/service-request-status.enum';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class ServiceRequestsService {
    constructor(private readonly prisma: PrismaService) {}
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
        const updatedRequest = await this.prisma.serviceRequest.update({
            where: {id},
            data: {status: targetStatus}
        });
        return updatedRequest;
    }
}
