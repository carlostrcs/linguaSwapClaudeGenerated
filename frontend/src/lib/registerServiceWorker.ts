// Registers the service worker that makes the app installable and openable offline (public/sw.js).
//
// PRODUCTION ONLY. A worker on the dev server would serve yesterday's bundle from cache while you
// edit, which is a genuinely miserable thing to debug — and `public/sw.js` still has its unstamped
// placeholders in dev anyway (build/sw.ts fills them at the end of a real build).

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  // After `load`, so registering never competes with the first render for bandwidth.
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // A failed registration costs the offline story, nothing else — the app is a normal web app
      // without it. Never surface this.
    });
  });
}

/**
 * The escape hatch. If a released worker ever misbehaves, calling this from the console (or
 * temporarily from `main.tsx`) unregisters it and drops its caches; deploying a build whose
 * `main.tsx` calls this instead of `registerServiceWorker` un-sticks every installed client.
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith('linguaswap-')).map((name) => caches.delete(name)));
}
