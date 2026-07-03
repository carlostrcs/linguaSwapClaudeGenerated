// Client-side mirror of the backend account-creation rules (Program.cs Identity password
// options + the RegisterRequest [EmailAddress] check). These only drive friendly inline
// feedback — the API re-validates and is authoritative. Keep in sync with the backend.

export function isValidEmail(email: string): boolean {
  // Pragmatic format check: something@something.tld with no spaces.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const PASSWORD_MIN_LENGTH = 8;

// Returns the i18n key for the first unmet password rule, or null when the password is strong
// enough. Order matches how the rules read to a user (length first, then character classes).
export function passwordIssueKey(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'auth.passwordTooShort';
  if (!/[a-z]/.test(password)) return 'auth.passwordNeedsLower';
  if (!/[A-Z]/.test(password)) return 'auth.passwordNeedsUpper';
  if (!/[0-9]/.test(password)) return 'auth.passwordNeedsDigit';
  return null;
}
