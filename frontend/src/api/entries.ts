import { api } from './client';
import type { EntryDto, TranslationDto } from './types';

export const listEntries = (libraryId: number) =>
  api<EntryDto[]>(`/libraries/${libraryId}/entries`);

export const createEntry = (libraryId: number, translations: TranslationDto[], notes?: string | null) =>
  api<EntryDto>(`/libraries/${libraryId}/entries`, {
    method: 'POST',
    body: JSON.stringify({ notes, translations }),
  });

export const updateEntry = (id: number, translations: TranslationDto[], notes?: string | null) =>
  api<EntryDto>(`/entries/${id}`, { method: 'PUT', body: JSON.stringify({ notes, translations }) });

export const deleteEntry = (id: number) => api<void>(`/entries/${id}`, { method: 'DELETE' });
