import { api } from './client';
import type { LibraryStats, OverviewStats } from './types';

export const getOverview = () => api<OverviewStats>('/stats/overview');

export const getLibraryStats = (id: number) => api<LibraryStats>(`/stats/libraries/${id}`);
