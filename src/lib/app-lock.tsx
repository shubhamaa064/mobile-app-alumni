/**
 * Biometric app lock (Face ID / Touch ID / fingerprint).
 *
 * When the member enables the lock, the app requires a biometric (or device
 * passcode fallback) check on cold launch and whenever it returns from the
 * background. This is a *local* gate layered on top of the persistent JWT
 * session — it never logs the user out, it just hides the UI until they prove
 * presence. ("Once the OTP is given for login it should not logout.")
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";

const LOCK_KEY = "ctk_biometric_lock";

type BiometryKind = "face" | "fingerprint" | "iris" | "generic";

type AppLockState = {
  /** Device has biometric hardware AND the user has enrolled at least one. */
  available: boolean;
  /** The kind of biometry, used for labels/icons. */
  kind: BiometryKind;
  /** Human label, e.g. "Face ID", "Touch ID", "Fingerprint". */
  label: string;
  /** Whether the member has turned the lock on. */
  enabled: boolean;
  /** Whether the app is currently locked (overlay shown). */
  locked: boolean;
  /** Turn the lock on/off; enabling requires a successful auth. Returns success. */
  setEnabled: (on: boolean) => Promise<boolean>;
  /** Run a biometric prompt; returns whether it succeeded. */
  authenticate: () => Promise<boolean>;
};

const AppLockContext = createContext<AppLockState | undefined>(undefined);

function labelFor(kind: BiometryKind): string {
  switch (kind) {
    case "face": return "Face ID";
    case "fingerprint": return "Touch ID";
    case "iris": return "Iris unlock";
    default: return "Biometric unlock";
  }
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [available, setAvailable] = useState(false);
  const [kind, setKind] = useState<BiometryKind>("generic");
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [authing, setAuthing] = useState(false);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const initialized = useRef(false);

  // Detect hardware + enrollment + biometry kind once.
  useEffect(() => {
    (async () => {
      try {
        const [hasHw, enrolled, types] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);
        const ok = hasHw && enrolled;
        setAvailable(ok);
        let k: BiometryKind = "generic";
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) k = "face";
        else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) k = "fingerprint";
        else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) k = "iris";
        setKind(k);

        const saved = await SecureStore.getItemAsync(LOCK_KEY).catch(() => null);
        const on = saved === "1" && ok;
        setEnabledState(on);
        // Lock on cold launch if enabled and a user is signed in.
        if (on) setLocked(true);
      } catch {
        setAvailable(false);
      } finally {
        initialized.current = true;
      }
    })();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (authing) return false;
    setAuthing(true);
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock CTK Alumni",
        cancelLabel: "Cancel",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });
      return res.success;
    } catch {
      return false;
    } finally {
      setAuthing(false);
    }
  }, [authing]);

  const setEnabled = useCallback(
    async (on: boolean): Promise<boolean> => {
      if (on) {
        if (!available) return false;
        const ok = await authenticate();
        if (!ok) return false;
        await SecureStore.setItemAsync(LOCK_KEY, "1").catch(() => {});
        setEnabledState(true);
        return true;
      }
      await SecureStore.deleteItemAsync(LOCK_KEY).catch(() => {});
      setEnabledState(false);
      setLocked(false);
      return true;
    },
    [available, authenticate],
  );

  const tryUnlock = useCallback(async () => {
    const ok = await authenticate();
    if (ok) setLocked(false);
  }, [authenticate]);

  // Lock when leaving the foreground; auto-prompt when returning.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;
      if (!enabled || !user) return;
      if ((prev === "active") && (next === "background" || next === "inactive")) {
        setLocked(true);
      } else if (prev !== "active" && next === "active" && locked) {
        void tryUnlock();
      }
    });
    return () => sub.remove();
  }, [enabled, user, locked, tryUnlock]);

  // Auto-prompt on first render when locked at cold launch.
  useEffect(() => {
    if (locked && user && enabled) void tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked && user && enabled]);

  // If the user signs out, clear the lock state.
  useEffect(() => {
    if (!user && locked) setLocked(false);
  }, [user, locked]);

  const showOverlay = locked && !!user && enabled;

  return (
    <AppLockContext.Provider value={{ available, kind, label: labelFor(kind), enabled, locked, setEnabled, authenticate }}>
      {children}
      {showOverlay && (
        <LinearGradient colors={gradients.hero} style={styles.overlay}>
          <View style={styles.center}>
            <Logo height={88} plate />
            <Txt style={styles.hand}>welcome back</Txt>
            <Txt variant="title" color={colors.white} center style={{ marginTop: 4 }}>
              CTK Alumni is locked
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.65)" center style={{ marginTop: 6 }}>
              Unlock with {labelFor(kind)} to continue
            </Txt>

            <Pressable style={styles.unlock} onPress={tryUnlock} disabled={authing}>
              {authing ? (
                <ActivityIndicator color={colors.navyDeep} />
              ) : (
                <>
                  <Ionicons
                    name={kind === "face" ? "scan-outline" : "finger-print-outline"}
                    size={20}
                    color={colors.navyDeep}
                  />
                  <Txt style={styles.unlockTxt}>  Unlock</Txt>
                </>
              )}
            </Pressable>
          </View>
        </LinearGradient>
      )}
    </AppLockContext.Provider>
  );
}

export function useAppLock(): AppLockState {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLock must be used within AppLockProvider");
  return ctx;
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  center: { alignItems: "center" },
  hand: { fontFamily: fonts.handBold, fontSize: 20, color: colors.goldSoft, marginTop: 10 },
  unlock: { flexDirection: "row", alignItems: "center", backgroundColor: colors.goldSoft, paddingVertical: 15, paddingHorizontal: 32, borderRadius: radius.pill, marginTop: spacing.xxl, ...shadow.lift },
  unlockTxt: { fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 },
});
