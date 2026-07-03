// localStorage-backed state for the no-account demo. It mirrors the real Libraries/Entries API
// (create/rename/delete libraries, add/edit/delete words) entirely in the browser, seeded with an
// example library on first visit, plus a small Leitner box map so spaced-repetition progress feels
// real across sessions. Nothing here is sent to the server; it lives only in the visitor's browser
// until they create a real account.
import type { EntryDto, JourneyState, LibrarySummary, TranslationDto } from '../../api/types';
import { EXAMPLE_ENTRIES, EXAMPLE_LIBRARY_DESCRIPTION, EXAMPLE_LIBRARY_NAME } from './demoData';
import { applyLeitner, isMastered } from './demoEngine';

const STORAGE_KEY = 'linguaswap.demo.v2';

interface StoredLibrary {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  entries: EntryDto[];
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
    name: lib.name,
    description: lib.description,
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
  save({ ...state, libraries: state.libraries.map((l) => (l.id === id ? { ...l, name: name.trim() } : l)) });
}

export function deleteDemoLibrary(id: number) {
  const state = load();
  save({ ...state, libraries: state.libraries.filter((l) => l.id !== id) });
}

// ---------- Entries ----------
function mutateEntries(state: DemoState, libraryId: number, fn: (entries: EntryDto[]) => EntryDto[]): DemoState {
  return {
    ...state,
    libraries: state.libraries.map((l) => (l.id === libraryId ? { ...l, entries: fn(l.entries) } : l)),
  };
}

export function listDemoEntries(libraryId: number): EntryDto[] {
  return load().libraries.find((l) => l.id === libraryId)?.entries ?? [];
}

export function addDemoEntry(libraryId: number, translations: TranslationDto[], notes: string | null): EntryDto {
  const state = load();
  const entry: EntryDto = { id: state.nextEntryId, notes, createdAt: new Date().toISOString(), translations };
  save({ ...mutateEntries(state, libraryId, (entries) => [...entries, entry]), nextEntryId: state.nextEntryId + 1 });
  return entry;
}

export function updateDemoEntry(libraryId: number, entryId: number, translations: TranslationDto[], notes: string | null) {
  const state = load();
  save(mutateEntries(state, libraryId, (entries) => entries.map((e) => (e.id === entryId ? { ...e, translations, notes } : e))));
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

export function recordAnswer(
  libraryId: number,
  entryId: number,
  source: string,
  target: string,
  correct: boolean,
): { box: number; mastered: boolean } {
  const state = load();
  const key = boxKey(libraryId, entryId, source, target);
  const box = applyLeitner(state.boxes[key] ?? 1, correct);
  save({ ...state, boxes: { ...state.boxes, [key]: box } });
  return { box, mastered: isMastered(box) };
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
