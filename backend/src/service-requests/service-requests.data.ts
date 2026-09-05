import {ServiceRequest} from './models/service-request.model';
import {ServiceRequestStatus} from './enum/service-request-status.enum';
export const Service_Requests: ServiceRequest[] = [
    {
        id: 1,
        employeeId: 101,
        departmentId: 1,
        title: 'Laptop Issue',
        description: 'My laptop is not turning on.',
        status: ServiceRequestStatus.SUBMITTED
    },
    {
        id: 2,
        employeeId: 102,
        departmentId: 2,
        title: 'Employment letter',
        description: 'I need an employment letter.',
        status: ServiceRequestStatus.IN_PROGRESS
    }
]