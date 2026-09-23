export type UserRole = 'EMPLOYEE' | 'HANDLER';
export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    departmentId: number | null;
    department?: string | null;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}