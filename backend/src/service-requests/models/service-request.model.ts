import {ServiceRequestStatus} from '../enum/service-request-status.enum';
export interface ServiceRequest {
    id: number;
    employeeId: number;
    departmentId: number;
    title: string;
    description: string;
    status: ServiceRequestStatus;
}