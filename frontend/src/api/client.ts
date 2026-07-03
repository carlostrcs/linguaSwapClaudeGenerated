const BASE = 'http://localhost:5299/api';
const TOKEN_KEY = 'linguaswap.token';
const REFRESH_KEY = 'linguaswap.refreshToken';

export class ApiError extends Error {
  status: number;
  details?: string[];
  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

// Lets AuthProvider react to an expired/invalid token from anywhere in the app.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

// Shape of the auth payload we care about when refreshing (a subset of AuthResponse).
interface RefreshedTokens {
  token: string;
  refreshToken: string;
}

// Single-flight guard: concurrent 401s share one in-flight refresh instead of stampeding
// the endpoint (and rotating the refresh token several times in a row).
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  refreshPromise ??= (async () => {
    try {
      // Raw fetch, not api(), so a failing refresh can't recurse back into another refresh.
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as RefreshedTokens;
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // The access token is missing/expired. Try a one-time silent refresh, then replay the
    // request with the new token. If that fails, the session is genuinely over → sign out.
    if (retry && path !== '/auth/refresh' && (await tryRefresh())) {
      return api<T>(path, options, false);
    }
    unauthorizedHandler?.();
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const body = (data ?? {}) as { message?: string; errors?: string[] };
    throw new ApiError(res.status, body.message ?? 'Something went wrong.', body.errors);
  }
  return data as T;
}
