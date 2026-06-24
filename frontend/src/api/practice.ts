import { api } from './client';
import type { AnswerResponse, Difficulty, StartSessionResponse } from './types';

export const startSession = (
  libraryId: number,
  sourceLanguage: string,
  targetLanguage: string,
  difficulty: Difficulty,
) =>
  api<StartSessionResponse>('/practice/sessions', {
    method: 'POST',
    body: JSON.stringify({ libraryId, sourceLanguage, targetLanguage, difficulty }),
  });

export const submitAnswer = (sessionId: number, entryId: number, answer: string) =>
  api<AnswerResponse>(`/practice/sessions/${sessionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ entryId, answer }),
  });

export const endSession = (sessionId: number) =>
  api<void>(`/practice/sessions/${sessionId}/end`, { method: 'POST' });
