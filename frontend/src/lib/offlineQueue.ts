// Practice writes that survive losing the network.
//
// Grading is already client-side (`lib/practiceCheck`), so a session in progress keeps working with
// no connection — the only thing the server is needed for is the durable Attempt/LearningState row.
// Those POSTs used to be fire-and-forget with the failure swallowed, which is fine for a blip and
// wrong for a tunnel: a whole session's stats vanished. This parks them in localStorage instead and
// replays them, in order, when the network returns.
//
// It is a queue of *writes*, never of reads: nothing here caches an API response.

import { ApiError } from '../api/client';
import { endSession, submitAnswer } from '../api/practice';

const STORAGE_KEY = 'linguaswap.pendingPractice';

// Bounds what one long offline stretch can put in localStorage (each item is a few dozen bytes, so
// this is thousands of words of practice). Past it the OLDEST are dropped: if something has to be
// lost it should be the work the user has already moved on from.
const MAX_ITEMS = 1000;

export type PendingWrite =
  | { kind: 'answer'; sessionId: number; entryId: number; answer: string }
  | { kind: 'end'; sessionId: number };

type Listener = (pending: number) => void;

const listeners = new Set<Listener>();

/**
 * One global chain for every send and every replay. Ordering is load-bearing twice over: repeats of
 * a word (Learn New drills the same batch) must not race each other into the LearningStates unique
 * index, and `end` must never overtake the answers — the API rejects an answer once the session is
 * closed, so an out-of-order replay would throw away exactly what the queue exists to save.
 */
let chain: Promise<void> = Promise.resolve();

function read(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingWrite[]) : [];
  } catch {
    return [];
  }
}

function write(items: PendingWrite[]): void {
  try {
    if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Quota or a locked-down browser. Nothing to do but let this write go unrecorded.
  }
  for (const listener of listeners) listener(Math.min(items.length, MAX_ITEMS));
}

/** Number of writes waiting to reach the server. */
export function pendingCount(): number {
  return read().length;
}

/** Subscribe to queue-depth changes (drives the offline banner). Returns an unsubscribe. */
export function onPendingChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function send(item: PendingWrite): Promise<unknown> {
  return item.kind === 'answer'
    ? submitAnswer(item.sessionId, item.entryId, item.answer)
    : endSession(item.sessionId);
}

/**
 * A rejection the network caused, rather than the server.
 *
 * `api()` throws ApiError only once a response came back, so anything else (a `fetch` TypeError) is
 * offline/DNS/CORS. The distinction decides retry vs discard: the server having *seen* a write and
 * refused it — a closed session, a 401 after sign-out — is final, and retrying it forever would
 * wedge the queue behind an item that can never succeed.
 */
function isNetworkFailure(error: unknown): boolean {
  return !(error instanceof ApiError);
}

/**
 * Send a practice write, or park it if the network is gone.
 *
 * Never throws and never blocks the UI: the caller records the answer and moves on to the next card.
 */
export function recordWrite(item: PendingWrite): Promise<void> {
  chain = chain.then(async () => {
    // Anything already queued means we are offline (or were, and haven't drained yet). Going
    // straight to the network here would land this write ahead of older ones.
    const queued = read();
    if (queued.length > 0) {
      write([...queued, item]);
      return;
    }
    try {
      await send(item);
    } catch (error) {
      if (isNetworkFailure(error)) write([item]);
      // A server rejection is final — drop it. One lost row of stats, as before.
    }
  });
  return chain;
}

/**
 * Replay everything queued, oldest first. Stops at the first network failure and keeps the rest, so
 * a half-drained queue never loses its ordering; a server rejection discards just that item.
 */
export function flush(): Promise<void> {
  chain = chain.then(async () => {
    while (true) {
      const items = read();
      if (items.length === 0) return;

      const [next, ...rest] = items;
      try {
        await send(next);
      } catch (error) {
        if (isNetworkFailure(error)) return; // still offline — try again on the next `online` event
      }
      // Safe to write `rest` wholesale: every other mutation goes through the same chain, so
      // nothing can have appended to the queue while this send was in flight.
      write(rest);
    }
  });
  return chain;
}

/**
 * Drop everything queued. Called on sign-out: the queued writes belong to sessions owned by the
 * account that is leaving, and replaying them under the next user's token would post one person's
 * practice with another's credentials. The server would reject it, but not sending it is better.
 */
export function clearQueue(): void {
  // Chained like everything else, so it cannot be undone by a flush that is mid-send.
  chain = chain.then(() => write([]));
}

/** Flush now and whenever the browser says the network is back. Returns an unsubscribe. */
export function startSync(): () => void {
  const onOnline = () => void flush();
  window.addEventListener('online', onOnline);
  if (navigator.onLine) void flush();
  return () => window.removeEventListener('online', onOnline);
}
