// Shared metadata for the practice systems. Mirrors the backend: which modes are premium
// (PracticeController's gate) and which reinforce misses in-session (PracticeSelectors +
// PracticeRunner requeue). Keep this in sync with Services/PracticeSelectors.cs.
import type { PracticeMode } from '../api/types';

export const PRACTICE_MODES: PracticeMode[] = ['SmartReview', 'LearnNew', 'Journey', 'Cram', 'Weak'];

/** Smart Review is free; the other systems are premium (mirrors the server-side 403 gate). */
export const isPremiumMode = (mode: PracticeMode): boolean => mode !== 'SmartReview';

/** Modes that repeat a missed word later in the same finite session (Cram). */
export const isReinforcingMode = (mode: PracticeMode): boolean => mode === 'Cram';

/** The endless, self-paced mode — it runs in JourneyRunner instead of the finite PracticeRunner. */
export const isJourneyMode = (mode: PracticeMode): boolean => mode === 'Journey';

/** Learn New — its own endless, self-paced runner (LearnNewRunner): preview pass, then drill to learn. */
export const isLearnNewMode = (mode: PracticeMode): boolean => mode === 'LearnNew';

/** Whether answers move Leitner boxes. Cram and Journey are practice-only (mirror the selectors). */
export const modeReschedules = (mode: PracticeMode): boolean => mode !== 'Cram' && mode !== 'Journey';

/** i18n keys for each mode's name + its "recommended for" description, shown in the picker. */
export const MODE_NAME_KEY: Record<PracticeMode, string> = {
  SmartReview: 'practice.modeSmartReview',
  LearnNew: 'practice.modeLearnNew',
  Journey: 'practice.modeJourney',
  Cram: 'practice.modeCram',
  Weak: 'practice.modeWeak',
};

export const MODE_DESC_KEY: Record<PracticeMode, string> = {
  SmartReview: 'practice.modeSmartReviewDesc',
  LearnNew: 'practice.modeLearnNewDesc',
  Journey: 'practice.modeJourneyDesc',
  Cram: 'practice.modeCramDesc',
  Weak: 'practice.modeWeakDesc',
};
