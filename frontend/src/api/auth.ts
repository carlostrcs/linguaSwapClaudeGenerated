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

// Confirm an email address from the link in the confirmation email.
export function confirmEmail(userId: string, token: string) {
  return api<{ confirmed: boolean }>('/auth/confirm-email', {
    method: 'POST',
    body: JSON.stringify({ userId, token }),
  });
}

// Re-send the confirmation email to the signed-in user (auth token attached automatically).
export function resendConfirmation() {
  return api<void>('/auth/resend-confirmation', { method: 'POST' });
}

// Request a password-reset link. Always resolves (204) whether or not the email is registered.
export function forgotPassword(email: string) {
  return api<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Set a new password using the token from the reset email.
export function resetPassword(userId: string, token: string, newPassword: string) {
  return api<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ userId, token, newPassword }),
  });
}
