import { api } from './client';
import type { Account } from './types';

export const getAccount = () => api<Account>('/account');

export const updateAccount = (email: string, displayName?: string | null) =>
  api<Account>('/account', { method: 'PUT', body: JSON.stringify({ email, displayName }) });

export const changePassword = (currentPassword: string, newPassword: string) =>
  api<void>('/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });

export const deleteAccount = () => api<void>('/account', { method: 'DELETE' });
