// Free-tier limits. These mirror the server-side constants in
// backend/LinguaSwap.Api/Services/PremiumService.cs — the API is authoritative; these
// are only for showing counters and disabling controls before the request is made.
export const FREE_LIBRARY_LIMIT = 5;
export const FREE_WORDS_PER_LIBRARY = 500;

/** Length of the one-time free trial, in days. Mirrors PremiumService.TrialDays. */
export const TRIAL_DAYS = 14;

/** Whole days remaining until an ISO timestamp (0 if absent or already past). */
export function trialDaysLeft(iso?: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}
