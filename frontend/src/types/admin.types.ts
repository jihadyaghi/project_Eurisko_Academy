export type ManagedUserRole = 'EMPLOYEE' | 'HANDLER';
export interface ManagedDepartment {
    id: number,
    name: string
}
export interface ManagedUser {
    id: number;
    name: string;
    email: string;
    role: 'EMPLOYEE' | 'HANDLER' | 'ADMIN';
    departmentId: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    department?: ManagedDepartment | null;
}
export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: ManagedUserRole;
    departmentId?: number;
}