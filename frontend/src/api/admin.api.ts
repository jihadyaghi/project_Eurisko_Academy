import type { CreateUserPayload, ManagedUser } from "../types/admin.types";
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export async function getUsers(token: string): Promise<ManagedUser[]> {
    const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    if (!response.ok){
        const error = await response.json();
        throw new Error(error.message || 'Failed to load users')
    }
    return response.json();
}
export async function createUser(body: CreateUserPayload, token: string): Promise<ManagedUser>{
    const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
    });
    if (!response.ok){
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
    }
    return response.json();
}
export async function updateUserStatus(userId: number, isActive: boolean, token: string): Promise<ManagedUser> {
    const response = await fetch(`${API_URL}/admin/users/${userId}/status`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({isActive})
        }
    );
    if (!response.ok){
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user status')
    }
    return response.json();
}