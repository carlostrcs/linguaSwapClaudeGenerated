import { api } from './client';
import type { EntryDto, ImportEntry, ImportResult, TranslationDto } from './types';

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

export const importEntries = (libraryId: number, entries: ImportEntry[]) =>
  api<ImportResult>(`/libraries/${libraryId}/import`, { method: 'POST', body: JSON.stringify({ entries }) });
