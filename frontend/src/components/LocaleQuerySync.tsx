import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Refetches server data when the UI language changes. The API resolves entry notes and curated
 * library name/description to the caller's language (from the X-UI-Language header), so a query
 * cached under the old language would keep showing it until invalidated. Skips the initial mount —
 * that data was already fetched in the current language — and renders nothing.
 *
 * Lives inside QueryClientProvider (which is nested inside I18nProvider); see main.tsx.
 */
export default function LocaleQuerySync() {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    void queryClient.invalidateQueries();
  }, [lang, queryClient]);

  return null;
}
