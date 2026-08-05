import { useEffect, useState } from 'react';
import { onPendingChange, pendingCount } from '../lib/offlineQueue';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Tells the user their practice still counts while the network is gone.
 *
 * Without this the offline queue is invisible: answers appear to be graded normally (they are —
 * grading is client-side) and the user has no way to know whether any of it reached their stats.
 * Sits with the other app-wide banners in Layout, so every screen gets it from one place.
 */
export default function OfflineBanner() {
  const { t } = useI18n();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(() => pendingCount());

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // The queue drains itself on reconnect (lib/offlineQueue startSync); this just follows its depth.
  useEffect(() => onPendingChange(setPending), []);

  if (online && pending === 0) return null;

  return (
    <div className="offline-banner" role="status">
      {online ? t('offline.syncing', { count: pending }) : t('offline.title')}
    </div>
  );
}
