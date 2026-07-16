export interface AuthResponse {
  token: string;
  expiresAt: string;
  refreshToken: string;
  userId: string;
  email: string;
  displayName?: string | null;
  /** Effective premium (paid subscription OR active trial) — gates all premium UI. */
  isPremium: boolean;
  /** The raw paid-subscription flag, so the UI can tell a trial apart from a paid plan. */
  subscriptionActive: boolean;
  /** When the free trial ends (ISO), or null if never started. */
  trialEndsAt?: string | null;
  /** Whether the email address has been confirmed (drives the soft "confirm your email" banner). */
  emailConfirmed: boolean;
}

export interface Account {
  userId: string;
  email: string;
  displayName?: string | null;
  isPremium: boolean;
  subscriptionActive: boolean;
  trialEndsAt?: string | null;
  /** How many of the user's libraries are hidden by the free-tier cap (0 for premium). */
  hiddenLibraries: number;
  /** Whether the email address has been confirmed. */
  emailConfirmed: boolean;
}

export interface LibrarySummary {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  /** Visible word count (capped at the free limit for free users). */
  entryCount: number;
  /** Words hidden by the free-tier cap (0 for premium). */
  hiddenEntryCount: number;
}

/** A curated "default" library shown on the featured shelf. Premium users can add it (a copy is
 *  cloned into their account); free users only see the card with a blurred teaser. */
export interface FeaturedLibrarySummary {
  id: number;
  name: string;
  description?: string | null;
  /** Full size of the set (never capped — it's a preview, not owned content). */
  wordCount: number;
  /** A few sample words as a teaser (blurred/greyed for free users). */
  sampleWords: string[];
}

export interface TranslationDto {
  languageCode: string;
  text: string;
}

export interface EntryDto {
  id: number;
  notes?: string | null;
  createdAt: string;
  translations: TranslationDto[];
}

export interface ImportEntry {
  translations: Record<string, string>;
  notes?: string | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

export interface LibraryImportResult {
  library: LibrarySummary;
  imported: number;
  skipped: number;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** Which practice *system* a session runs. SmartReview is free; the rest are premium. */
export type PracticeMode = 'SmartReview' | 'LearnNew' | 'Journey' | 'Cram' | 'Weak';

export interface PracticeWord {
  entryId: number;
  prompt: string;
  hint: string;
  answerLength: number;
  /** The full expected text, comma-separated alternatives included — grade with lib/practiceCheck. */
  acceptedAnswer: string;
  /** Leitner box at session start (0 = never seen in this direction). */
  boxLevel: number;
  notes?: string | null;
}

/** Persisted per-word Journey progress (mirrors the backend JourneyWordDto). */
export interface JourneyWord {
  entryId: number;
  attempts: number;
  correct: number;
  streak: number;
}

/** A saved Journey position for one library+direction: how many words are active + their progress. */
export interface JourneyState {
  activeCount: number;
  words: JourneyWord[];
}

export interface StartSessionResponse {
  sessionId: number;
  difficulty: Difficulty;
  mode: PracticeMode;
  sourceLanguage: string;
  targetLanguage: string;
  words: PracticeWord[];
  /** Present only for Journey mode: the saved progress to resume from (null if none yet). */
  journey?: JourneyState | null;
}

export interface AnswerResponse {
  isCorrect: boolean;
  expectedAnswer: string;
  boxLevel: number;
  mastered: boolean;
  nextReviewAt?: string | null;
}

export interface BoxCount {
  box: number;
  count: number;
}

/** Practice volume for a single UTC day. `date` is "yyyy-MM-dd". */
export interface DailyActivity {
  date: string;
  total: number;
  correct: number;
}

export interface LibraryStats {
  libraryId: number;
  name: string;
  words: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  mastered: number;
  dueNow: number;
  unseen: number;
  boxDistribution: BoxCount[];
}

export interface OverviewStats {
  libraries: number;
  words: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  mastered: number;
  dueNow: number;
  studyStreakDays: number;
  perLibrary: LibraryStats[];
  /** Daily practice volume (last ~year, days with attempts only, ascending). Feeds the heatmap + trend. */
  activity: DailyActivity[];
}
