import { api } from './client';
import type { LibrarySummary } from './types';

export const listLibraries = () => api<LibrarySummary[]>('/libraries');

export const getLibrary = (id: number) => api<LibrarySummary>(`/libraries/${id}`);

export const createLibrary = (name: string, description?: string | null) =>
  api<LibrarySummary>('/libraries', { method: 'POST', body: JSON.stringify({ name, description }) });

export const updateLibrary = (id: number, name: string, description?: string | null) =>
  api<LibrarySummary>(`/libraries/${id}`, { method: 'PUT', body: JSON.stringify({ name, description }) });

export const deleteLibrary = (id: number) => api<void>(`/libraries/${id}`, { method: 'DELETE' });
