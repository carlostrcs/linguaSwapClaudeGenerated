export interface AuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  displayName?: string | null;
}

export interface Account {
  userId: string;
  email: string;
  displayName?: string | null;
}

export interface LibrarySummary {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  entryCount: number;
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

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface PracticeWord {
  entryId: number;
  prompt: string;
  hint: string;
  answerLength: number;
  expectedAnswer?: string | null;
}

export interface StartSessionResponse {
  sessionId: number;
  difficulty: Difficulty;
  sourceLanguage: string;
  targetLanguage: string;
  words: PracticeWord[];
}

export interface AnswerResponse {
  isCorrect: boolean;
  expectedAnswer: string;
  boxLevel: number;
  mastered: boolean;
  nextReviewAt?: string | null;
}
