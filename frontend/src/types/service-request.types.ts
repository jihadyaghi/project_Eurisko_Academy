export type ServiceRequestStatus = 'submitted' | 'in_progress' | 'completed';
export interface ServiceRequest {
    id: number;
    employeeId: number;
    departmentId: number;
    handlerId: number | null;
    title: string;
    description: string;
    category: string | null;
    priority: string;
    status: ServiceRequestStatus;
    createdAt: string;
    updatedAt: string;
}
export interface CreateServiceRequestPayload {
    title: string;
    description: string;
    departmentId: number;
    category: string;
    priority: string;
}