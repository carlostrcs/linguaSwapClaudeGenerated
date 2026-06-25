import type { ImportEntry } from '../api/types';

/**
 * Reads a JSON file and returns its entries. Accepts either a bare array or a
 * `{ "entries": [...] }` wrapper. Throws if the file isn't valid JSON in that shape.
 */
export async function parseImportFile(file: File): Promise<ImportEntry[]> {
  const parsed: unknown = JSON.parse(await file.text());
  const entries = Array.isArray(parsed) ? parsed : (parsed as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) throw new Error('invalid-import-format');
  return entries as ImportEntry[];
}
