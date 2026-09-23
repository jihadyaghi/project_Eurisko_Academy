import type {LoginRequest,LoginResponse,} from '../types/auth.types';
const API_URL = 'http://localhost:3000';
export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed',);
  }
  return data;
}

export async function getCurrentUser(token: string,) {
  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to load current user',
    );
  }
  return data;
}