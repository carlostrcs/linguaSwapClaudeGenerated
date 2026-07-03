import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getRefreshToken, getToken, setRefreshToken, setToken, setUnauthorizedHandler } from '../api/client';
import { logout } from '../api/auth';
import type { AuthResponse } from '../api/types';

interface AuthUser {
  userId: string;
  email: string;
  displayName?: string | null;
  /** Effective premium (paid OR active trial). */
  isPremium: boolean;
  /** Raw paid-subscription flag (distinguishes trial from paid). */
  subscriptionActive?: boolean;
  /** When the free trial ends (ISO), or null/undefined if never started. */
  trialEndsAt?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
  updateUser: (user: AuthUser) => void;
}

const USER_KEY = 'linguaswap.user';
const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => (getToken() ? loadUser() : null));

  const signIn = useCallback((auth: AuthResponse) => {
    setToken(auth.token);
    setRefreshToken(auth.refreshToken);
    const u: AuthUser = {
      userId: auth.userId,
      email: auth.email,
      displayName: auth.displayName,
      isPremium: auth.isPremium,
      subscriptionActive: auth.subscriptionActive,
      trialEndsAt: auth.trialEndsAt,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUserState(u);
  }, []);

  const signOut = useCallback(() => {
    // Revoke the refresh token server-side (fire-and-forget) before clearing local state.
    const refreshToken = getRefreshToken();
    if (refreshToken) logout(refreshToken).catch(() => {});
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem(USER_KEY);
    setUserState(null);
  }, []);

  const updateUser = useCallback((u: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUserState(u);
  }, []);

  // Sign out automatically if the API ever reports the token is invalid/expired.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, signIn, signOut, updateUser }),
    [user, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
