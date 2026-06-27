// To add a new palette: add an entry here and a matching [data-theme="id"] block in index.css.
export interface ThemeOption {
  id: string;
  /** i18n key for the display name (see translations.ts). */
  labelKey: string;
  /** Premium-only palettes are locked for free users (cosmetic, client-side gate). */
  premium?: boolean;
}

export const THEMES: ThemeOption[] = [
  { id: 'light', labelKey: 'theme.light' },
  { id: 'dark', labelKey: 'theme.dark' },
  { id: 'ocean', labelKey: 'theme.ocean', premium: true },
  { id: 'forest', labelKey: 'theme.forest', premium: true },
];

export const DEFAULT_THEME = 'light';
export const THEME_STORAGE_KEY = 'linguaswap.theme';

/** Whether a theme id is premium-only. */
export const isPremiumTheme = (id: string): boolean =>
  THEMES.find((t) => t.id === id)?.premium ?? false;
