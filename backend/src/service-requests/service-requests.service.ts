import {BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {Service_Requests} from './service-requests.data';
import {ServiceRequestStatus} from './enum/service-request-status.enum';

@Injectable()
export class ServiceRequestsService {
    findAll() {
        return Service_Requests;
    }
    findOne(id: number) {
        const request = Service_Requests.find((item) => item.id === id);
        if (!request){
            throw new NotFoundException(`Service request with id ${id} not found`);
        }
        return request;
    }
    transitionStatus(id: number, targetStatus: ServiceRequestStatus) {
        const request = this.findOne(id);
        const validTransitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
            [ServiceRequestStatus.SUBMITTED]: [ServiceRequestStatus.IN_PROGRESS],
            [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.COMPLETED],
            [ServiceRequestStatus.COMPLETED]: []
        };
        const allowedNestStatuses = validTransitions[request.status];
        if (!allowedNestStatuses.includes(targetStatus)) {
            throw new BadRequestException(`Invalid status transition from ${request.status} to ${targetStatus}`);
        };
        request.status = targetStatus;
        return request;
    }
}
