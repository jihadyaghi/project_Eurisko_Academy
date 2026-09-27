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
export interface RequestDepartment {
    id: number;
    name: string;
}
export interface RequestHandler {
    id: number;
    name: string;
    email: string;
}
export interface StatusHistoryItem {
    id: number;
    fromStatus: string;
    toStatus: string;
    changedByUserId: number;
    createdAt: string;
    changedByUser: {
        id: number;
        name: string;
    };
}
export interface ServiceRequestDetails extends ServiceRequest {
    department: RequestDepartment;
    handler: RequestHandler | null;
    statusHistory: StatusHistoryItem[];
}