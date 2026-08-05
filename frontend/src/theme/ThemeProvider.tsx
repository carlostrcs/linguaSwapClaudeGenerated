import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from './themes';

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME);

  // Apply the theme by setting <html data-theme="...">; CSS variables do the rest.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    // Keep the browser chrome (Android status bar, installed-PWA title bar) on the theme's own
    // background instead of the light default baked into index.html — a dark-theme user in a
    // standalone window would otherwise get a white bar above a dark app. Read the value from the
    // computed CSS variable rather than listing hex codes here, so index.css stays the single
    // source of truth for a palette (adding one is still "one CSS block + one list entry").
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bg) {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta) meta.content = bg;
    }
  }, [theme]);

  const setTheme = useCallback((next: string) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
