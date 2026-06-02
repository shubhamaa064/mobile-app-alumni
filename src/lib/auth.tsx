import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  login as apiLogin,
  loadToken,
  mobileLogout,
  mobileMe,
  mobileRefresh,
  setToken,
  type AuthSession,
  type AuthUser,
} from "./api";

const USER_KEY = "ctk_user";
const EXP_KEY = "ctk_token_exp";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Apply a session obtained elsewhere (e.g. straight after registration). */
  applySession: (session: AuthSession) => Promise<void>;
  /** Re-fetch the user from the backend (e.g. after a profile edit). */
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function persistUser(user: AuthUser, expiresAt?: string) {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    if (expiresAt) await SecureStore.setItemAsync(EXP_KEY, expiresAt);
  } catch {
    // ignore on web / unavailable secure store
  }
}

async function clearStoredUser() {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(EXP_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (session: AuthSession) => {
    await setToken(session.token);
    await persistUser(session.user, session.expiresAt);
    setUser(session.user);
  }, []);

  // On launch: hydrate the cached user, then validate the token against the
  // backend (mobile-me) and refresh it in the background when near expiry.
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(USER_KEY).catch(() => null);
        if (raw) setUser(JSON.parse(raw) as AuthUser);

        const token = await loadToken();
        if (!token) return;

        const me = await mobileMe();
        if (!me) {
          // 401 / invalid token — drop the stale session.
          await setToken(null);
          await clearStoredUser();
          setUser(null);
          return;
        }
        setUser(me);
        await persistUser(me);

        const expRaw = await SecureStore.getItemAsync(EXP_KEY).catch(() => null);
        if (expRaw && new Date(expRaw).getTime() - Date.now() < SEVEN_DAYS_MS) {
          const refreshed = await mobileRefresh();
          if (refreshed) await applySession(refreshed);
        }
      } catch {
        // ignore corrupt store / offline launch — cached user (if any) stands
      } finally {
        setLoading(false);
      }
    })();
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await apiLogin(email, password);
      await applySession(session);
    },
    [applySession],
  );

  const refreshUser = useCallback(async () => {
    const me = await mobileMe();
    if (me) {
      setUser(me);
      await persistUser(me);
    }
  }, []);

  const signOut = useCallback(async () => {
    await mobileLogout();
    await clearStoredUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, applySession, refreshUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
