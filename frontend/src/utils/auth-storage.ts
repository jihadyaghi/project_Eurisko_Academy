import type {AuthUser,} from '../types/auth.types';
const TOKEN_KEY = 'operations_hub_token';
const USER_KEY = 'operations_hub_user';
export function saveAuth(
  token: string,
  user: AuthUser,
) {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY,);
}

export function getStoredUser(): AuthUser | null {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY,);
  localStorage.removeItem(USER_KEY,);
}