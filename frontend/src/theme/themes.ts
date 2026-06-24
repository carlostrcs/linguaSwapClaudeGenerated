// To add a new palette: add an entry here and a matching [data-theme="id"] block in index.css.
export interface ThemeOption {
  id: string;
  /** i18n key for the display name (see translations.ts). */
  labelKey: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'light', labelKey: 'theme.light' },
  { id: 'dark', labelKey: 'theme.dark' },
  { id: 'ocean', labelKey: 'theme.ocean' },
  { id: 'forest', labelKey: 'theme.forest' },
];

export const DEFAULT_THEME = 'light';
export const THEME_STORAGE_KEY = 'linguaswap.theme';
