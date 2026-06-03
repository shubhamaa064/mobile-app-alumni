import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
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
        if (!me.ok) {
          if (me.reason === "unauthorized") {
            // Genuine 401/403 — token revoked or expired. Drop the session.
            await setToken(null);
            await clearStoredUser();
            setUser(null);
          }
          // Network/server hiccup — keep the cached user signed in; we'll
          // re-validate on the next launch or refresh. "Once the OTP is given
          // for login it should not logout."
          return;
        }
        setUser(me.user);
        await persistUser(me.user);

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
    if (me.ok) {
      setUser(me.user);
      await persistUser(me.user);
    }
  }, []);

  const signOut = useCallback(async () => {
    await mobileLogout();
    await clearStoredUser();
    setUser(null);
    // On mobile, sign-out should land the user back on the home/landing screen
    // (and drop any authenticated screens from the stack), rather than leaving
    // them staring at now-empty member-only content.
    router.replace("/");
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
