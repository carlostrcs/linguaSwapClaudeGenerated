// Client-side mirror of PracticeController.Answer: grade an answer and work out the resulting
// Leitner box. Real practice and the no-account demo both grade through this, so both stay
// identical to the server.
//
// Real practice used to await POST /practice/sessions/{id}/answer before it could colour the card,
// which cost a round trip per word and made fast drilling impossible. The verdict is now computed
// here from PracticeWord.acceptedAnswer (sent up-front by Start) and the answer is POSTed in the
// background. The server still re-checks and owns the durable Attempt/LearningState row — this is
// the display path, not the record of truth.
//
// Keep in sync with Services/AnswerChecker.cs + Services/LeitnerService.cs, same mirror discipline
// as demoEngine (whose primitives this builds on).
import { applyLeitner, isCorrect, isMastered, primaryAnswer } from './demo/demoEngine';
import { isCaseSensitiveLang } from './languages';

export interface LocalCheck {
  isCorrect: boolean;
  /** The answer to show the user — the primary, not the raw comma-separated list. */
  expectedAnswer: string;
  mastered: boolean;
  /** The word's box after this answer; unchanged for practice-only modes (Cram/Journey). */
  nextBox: number;
}

/**
 * Grade `answer` against `acceptedAnswer` (the full expected text, comma-separated alternatives
 * included) and compute the resulting box. Pass `reschedules` from `modeReschedules(mode)` —
 * practice-only modes leave the box where it was, mirroring PracticeController.Answer, which skips
 * LeitnerService.ApplyAnswer when the selector doesn't reschedule.
 */
export function checkLocally(
  acceptedAnswer: string,
  answer: string,
  targetLanguage: string,
  currentBox: number,
  reschedules: boolean,
): LocalCheck {
  const correct = isCorrect(acceptedAnswer, answer, isCaseSensitiveLang(targetLanguage));
  const nextBox = reschedules ? applyLeitner(currentBox, correct) : currentBox;
  return {
    isCorrect: correct,
    expectedAnswer: primaryAnswer(acceptedAnswer),
    mastered: isMastered(nextBox),
    nextBox,
  };
}
