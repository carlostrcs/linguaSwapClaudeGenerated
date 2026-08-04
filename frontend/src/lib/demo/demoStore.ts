// localStorage-backed state for the no-account demo. It mirrors the real Libraries/Entries API
// (create/rename/delete libraries, add/edit/delete words) entirely in the browser, seeded with an
// example library on first visit, plus a small Leitner box map so spaced-repetition progress feels
// real across sessions. Nothing here is sent to the server; it lives only in the visitor's browser
// until they create a real account.
import type { EntryDto, JourneyState, LibrarySummary, TranslationDto } from '../../api/types';
import {
  DEMO_FEATURED,
  EXAMPLE_ENTRIES,
  EXAMPLE_LIBRARY_DESCRIPTION,
  EXAMPLE_LIBRARY_DESCRIPTION_I18N,
  EXAMPLE_LIBRARY_NAME,
  EXAMPLE_LIBRARY_NAME_I18N,
} from './demoData';
import type { DemoEntry } from './demoData';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../../i18n/translations';

const STORAGE_KEY = 'linguaswap.demo.v2';

// The current UI language, read from the same localStorage key I18nProvider writes (mirrors
// api/client.ts). The real app localizes featured titles + notes server-side via the X-UI-Language
// header; the demo has no server, so it resolves them here. Reads are re-run when the language
// changes (the demo pages depend on `lang`), so a switch re-localizes.
function currentLang(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/** The value for the current UI language from a {lang: text} map, else the (English) fallback. */
function localize(fallback: string | null | undefined, map?: Record<string, string>): string | null {
  const lang = currentLang();
  const value = lang === 'en' ? undefined : map?.[lang];
  return value && value.trim() ? value : fallback ?? null;
}

interface StoredLibrary {
  id: number;
  name: string;
  description: string | null;
  // Translated title/description, carried on copies of a featured library (like the real app's
  // Library.NameI18nJson). Cleared when the user renames the library — their text wins.
  nameI18n?: Record<string, string>;
  descriptionI18n?: Record<string, string>;
  createdAt: string;
  entries: DemoEntry[];
}

interface DemoState {
  libraries: StoredLibrary[];
  nextLibraryId: number;
  nextEntryId: number;
  boxes: Record<string, number>;
  journeys: Record<string, JourneyState>;
}

// The state a first-time visitor gets: one editable copy of the example library.
function seedState(): DemoState {
  return {
    libraries: [
      {
        id: 1,
        name: EXAMPLE_LIBRARY_NAME,
        description: EXAMPLE_LIBRARY_DESCRIPTION,
        nameI18n: EXAMPLE_LIBRARY_NAME_I18N,
        descriptionI18n: EXAMPLE_LIBRARY_DESCRIPTION_I18N,
        createdAt: new Date().toISOString(),
        entries: EXAMPLE_ENTRIES.map((e) => ({ ...e, translations: e.translations.map((tr) => ({ ...tr })) })),
      },
    ],
    nextLibraryId: 2,
    nextEntryId: EXAMPLE_ENTRIES.length + 1,
    boxes: {},
    journeys: {},
  };
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    return { ...seedState(), ...(JSON.parse(raw) as DemoState) };
  } catch {
    return seedState();
  }
}

function save(state: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function summary(lib: StoredLibrary): LibrarySummary {
  return {
    id: lib.id,
    name: localize(lib.name, lib.nameI18n) ?? lib.name,
    description: localize(lib.description, lib.descriptionI18n),
    createdAt: lib.createdAt,
    entryCount: lib.entries.length,
    hiddenEntryCount: 0, // the demo showcase is always fully unlocked
  };
}

// ---------- Libraries ----------
export function listDemoLibraries(): LibrarySummary[] {
  return load().libraries.map(summary);
}

export function getDemoLibrary(id: number): LibrarySummary | null {
  const lib = load().libraries.find((l) => l.id === id);
  return lib ? summary(lib) : null;
}

export function createDemoLibrary(name: string, description: string | null): LibrarySummary {
  const state = load();
  const lib: StoredLibrary = {
    id: state.nextLibraryId,
    name: name.trim(),
    description: description?.trim() || null,
    createdAt: new Date().toISOString(),
    entries: [],
  };
  save({ ...state, libraries: [...state.libraries, lib], nextLibraryId: state.nextLibraryId + 1 });
  return summary(lib);
}

export function renameDemoLibrary(id: number, name: string) {
  const state = load();
  // The user's name is authoritative now — drop the translated title so it isn't overridden.
  save({
    ...state,
    libraries: state.libraries.map((l) => (l.id === id ? { ...l, name: name.trim(), nameI18n: undefined } : l)),
  });
}

export function deleteDemoLibrary(id: number) {
  const state = load();
  save({ ...state, libraries: state.libraries.filter((l) => l.id !== id) });
}

// ---------- Featured (curated) libraries ----------
// Mirrors the backend's default-library shelf. The demo is a fully-unlocked showcase, so any set the
// visitor hasn't added yet is offered; adding clones it into the local store like the real "add".
export interface DemoFeaturedSummary {
  /** The stable English name — identity for add/dedup, never shown. */
  key: string;
  /** Display title, resolved to the UI language. */
  name: string;
  description: string;
  wordCount: number;
  sampleWords: string[];
}

// A short "en · es"-style teaser: up to two translations, English first (mirrors LibrariesController.Teaser).
function teaser(translations: Record<string, string>): string {
  return Object.entries(translations)
    .sort(([a], [b]) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)))
    .slice(0, 2)
    .map(([, text]) => text)
    .join(' · ');
}

export function listDemoFeatured(): DemoFeaturedSummary[] {
  // Dedup by the canonical (English) name — a copy stores that as its `name`, so an added set drops
  // off the shelf regardless of the UI language.
  const existing = new Set(load().libraries.map((l) => l.name));
  return DEMO_FEATURED.filter((f) => !existing.has(f.name)).map((f) => ({
    key: f.name,
    name: localize(f.name, f.nameI18n) ?? f.name,
    description: localize(f.description, f.descriptionI18n) ?? f.description,
    wordCount: f.entries.length,
    sampleWords: f.entries.slice(0, 4).map((e) => teaser(e.translations)),
  }));
}

export function addDemoFeatured(key: string): LibrarySummary | null {
  const state = load();
  const seed = DEMO_FEATURED.find((f) => f.name === key);
  if (!seed) return null;
  let nextEntryId = state.nextEntryId;
  // The copy keeps the English name as identity and carries the translated title/description +
  // per-entry notes, so it stays localized like the real "add featured" flow.
  const entries: DemoEntry[] = seed.entries.map((e) => ({
    id: nextEntryId++,
    notes: e.notes ?? null,
    notesI18n: e.notesI18n,
    createdAt: new Date().toISOString(),
    translations: Object.entries(e.translations).map(([languageCode, text]) => ({ languageCode, text })),
  }));
  const lib: StoredLibrary = {
    id: state.nextLibraryId,
    name: seed.name,
    description: seed.description,
    nameI18n: seed.nameI18n,
    descriptionI18n: seed.descriptionI18n,
    createdAt: new Date().toISOString(),
    entries,
  };
  save({ ...state, libraries: [...state.libraries, lib], nextLibraryId: state.nextLibraryId + 1, nextEntryId });
  return summary(lib);
}

// ---------- Entries ----------
function mutateEntries(state: DemoState, libraryId: number, fn: (entries: DemoEntry[]) => DemoEntry[]): DemoState {
  return {
    ...state,
    libraries: state.libraries.map((l) => (l.id === libraryId ? { ...l, entries: fn(l.entries) } : l)),
  };
}

export function listDemoEntries(libraryId: number): EntryDto[] {
  const entries = load().libraries.find((l) => l.id === libraryId)?.entries ?? [];
  // Resolve each note to the UI language for display (practice card + editor); the store keeps the
  // English `notes` + `notesI18n` map so a language switch re-resolves.
  return entries.map(({ notesI18n, ...entry }) => ({ ...entry, notes: localize(entry.notes, notesI18n) }));
}

export function addDemoEntry(libraryId: number, translations: TranslationDto[], notes: string | null): EntryDto {
  const state = load();
  const entry: EntryDto = { id: state.nextEntryId, notes, createdAt: new Date().toISOString(), translations };
  save({ ...mutateEntries(state, libraryId, (entries) => [...entries, entry]), nextEntryId: state.nextEntryId + 1 });
  return entry;
}

export function updateDemoEntry(libraryId: number, entryId: number, translations: TranslationDto[], notes: string | null) {
  const state = load();
  // The user edited the word — their note is canonical now, so drop the translated map.
  save(mutateEntries(state, libraryId, (entries) =>
    entries.map((e) => (e.id === entryId ? { ...e, translations, notes, notesI18n: undefined } : e))));
}

export function deleteDemoEntry(libraryId: number, entryId: number) {
  const state = load();
  save(mutateEntries(state, libraryId, (entries) => entries.filter((e) => e.id !== entryId)));
}

// ---------- Learning state ----------
function boxKey(libraryId: number, entryId: number, source: string, target: string): string {
  return `${libraryId}:${entryId}:${source}>${target}`;
}

// entryId -> current box for a direction (absent = never practised). Feeds buildDemoWords so the
// demo's Learn New / Weak modes can tell new words from seen ones.
export function listDemoBoxes(libraryId: number, source: string, target: string): Record<number, number> {
  const { boxes } = load();
  const prefix = `${libraryId}:`;
  const suffix = `:${source}>${target}`;
  const out: Record<number, number> = {};
  for (const [key, box] of Object.entries(boxes)) {
    if (key.startsWith(prefix) && key.endsWith(suffix)) {
      const entryId = Number(key.slice(prefix.length, key.length - suffix.length));
      if (Number.isFinite(entryId)) out[entryId] = box;
    }
  }
  return out;
}

// Persist a word's box after an answer — the demo's analogue of the background POST that real
// practice makes. The box itself comes from lib/practiceCheck, so what the card shows and what the
// store keeps can never disagree.
export function saveDemoBox(libraryId: number, entryId: number, source: string, target: string, box: number) {
  const state = load();
  save({ ...state, boxes: { ...state.boxes, [boxKey(libraryId, entryId, source, target)]: box } });
}

// ---------- Journey progress ----------
// Mirrors the server's JourneyState store, but per browser: one saved position per library+direction
// so the no-account demo also resumes where the visitor left off.
function journeyKey(libraryId: number, source: string, target: string): string {
  return `${libraryId}:${source}>${target}`;
}

export function getDemoJourney(libraryId: number, source: string, target: string): JourneyState | null {
  return load().journeys[journeyKey(libraryId, source, target)] ?? null;
}

export function saveDemoJourney(libraryId: number, source: string, target: string, journey: JourneyState) {
  const state = load();
  save({ ...state, journeys: { ...state.journeys, [journeyKey(libraryId, source, target)]: journey } });
}
