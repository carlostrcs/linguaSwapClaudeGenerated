import type { EntryDto } from '../api/types';

/**
 * Normalise text for searching: lowercase + strip diacritics so the filter is
 * case-insensitive *and* accent-insensitive (typing "camion" still finds "camión").
 * This is deliberately more lenient than AnswerChecker — a search box should be forgiving.
 */
export function normalizeForSearch(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Filter entries to those whose any translation text — or notes — contains the query.
 * An empty/whitespace query returns every entry unchanged.
 */
export function filterEntries(entries: EntryDto[], query: string): EntryDto[] {
  const q = normalizeForSearch(query.trim());
  if (!q) return entries;
  return entries.filter(
    (entry) =>
      entry.translations.some((tr) => normalizeForSearch(tr.text).includes(q)) ||
      (entry.notes ? normalizeForSearch(entry.notes).includes(q) : false),
  );
}
