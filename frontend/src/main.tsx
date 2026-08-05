import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import LocaleQuerySync from './components/LocaleQuerySync';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { I18nProvider } from './i18n/I18nProvider';
import { registerServiceWorker } from './lib/registerServiceWorker';
import { startSync } from './lib/offlineQueue';

// Windows browsers don't render country-flag emoji natively. This injects an @font-face for the
// flag-only 'Twemoji Country Flags' web font (first in the --sans stack) so flags show everywhere.
polyfillCountryFlagEmojis();

// Both are app-lifetime side effects rather than component concerns: the worker outlives any route,
// and practice answers parked offline must drain on reconnect whatever screen the user is on.
registerServiceWorker();
startSync();

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <LocaleQuerySync />
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
