import { api } from './client';
import type { AuthResponse } from './types';

export function register(email: string, password: string, displayName?: string) {
  return api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

export function login(email: string, password: string) {
  return api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Best-effort server-side revocation of the refresh token on sign-out.
export function logout(refreshToken: string) {
  return api<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}
