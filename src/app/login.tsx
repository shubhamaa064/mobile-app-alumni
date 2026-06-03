import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { goBack } from "@/lib/nav";
import { otpRequest, otpVerify, oauthLogin, googleNativeLogin, type OAuthProvider } from "@/lib/api";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";

type Mode = "otp" | "password";
type Step = "enter" | "verify";

const RESEND_SECONDS = 30;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, applySession } = useAuth();

  const [mode, setMode] = useState<Mode>("otp");
  const [step, setStep] = useState<Step>("enter");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP delivery context shown on the verify screen.
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startResendTimer = () => {
    setResendIn(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  // ── Step 1: request a code ─────────────────────────────────────────────────
  const requestCode = async (isResend = false) => {
    const id = identifier.trim();
    setError(null);
    if (!id) {
      setError("Enter your registered mobile number or email.");
      return;
    }
    setLoading(true);
    try {
      const res = await otpRequest(id);
      setChannel(res.channel);
      setMaskedTarget(res.maskedTarget);
      setStep("verify");
      setCode("");
      startResendTimer();
      if (!res.delivered && !isResend) {
        // Delivery gateway not configured — code still exists (master/testing).
        // Don't reveal anything; just keep the verify screen open.
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify the code ────────────────────────────────────────────────
  const verifyCode = async () => {
    const clean = code.replace(/\D/g, "");
    setError(null);
    if (clean.length < 4) {
      setError("Type the code we sent you.");
      return;
    }
    setLoading(true);
    try {
      const session = await otpVerify(identifier.trim(), clean);
      await applySession(session);
      goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't work. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Password fallback ──────────────────────────────────────────────────────
  const submitPassword = async () => {
    setError(null);
    if (!identifier || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
      goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // ── Social sign-in (Google / LinkedIn) ─────────────────────────────────────
  const oauth = async (provider: OAuthProvider) => {
    setError(null);
    setLoading(true);
    try {
      // Google → native account chooser (no browser); LinkedIn → in-app browser
      // OAuth (LinkedIn offers no native mobile sign-in).
      const session =
        provider === "google" ? await googleNativeLogin() : await oauthLogin(provider);
      if (!session) return; // user cancelled
      await applySession(session);
      goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isVerify = mode === "otp" && step === "verify";

  return (
    <LinearGradient colors={gradients.hero} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable
          onPress={() => (isVerify ? (setStep("enter"), setCode(""), setError(null)) : goBack())}
          style={[styles.close, { top: insets.top + 8 }]}
          hitSlop={10}
        >
          <Ionicons name={isVerify ? "arrow-back" : "close"} size={24} color={colors.white} />
        </Pressable>

        <View style={styles.content}>
          <View style={{ alignItems: "center" }}>
            <Logo height={96} plate />
            <Txt style={styles.hand}>welcome home</Txt>
            <Txt variant="title" color={colors.white} center style={{ marginTop: 2 }}>
              {isVerify ? "Enter your code" : "Sign in to CTK Alumni"}
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.65)" center style={{ marginTop: 4 }}>
              {isVerify
                ? `We sent a code to ${maskedTarget}`
                : "Reconnect with the family you grew up with"}
            </Txt>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.white} />
                <Txt style={styles.errorTxt}>{error}</Txt>
              </View>
            ) : null}

            {/* ── OTP: enter identifier ── */}
            {mode === "otp" && step === "enter" && (
              <>
                <Field
                  icon="person-outline"
                  placeholder="Mobile number or email"
                  value={identifier}
                  onChangeText={(t) => { setIdentifier(t); if (error) setError(null); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="send"
                  onSubmitEditing={() => requestCode()}
                />
                <Pressable style={styles.submit} onPress={() => requestCode()} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={colors.navyDeep} />
                  ) : (
                    <Txt style={styles.submitTxt}>Send code</Txt>
                  )}
                </Pressable>
                <Pressable onPress={() => { setMode("password"); setError(null); }} style={styles.linkRow} hitSlop={8}>
                  <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Txt style={styles.linkTxt}>  Sign in with password instead</Txt>
                </Pressable>
              </>
            )}

            {/* ── OTP: verify code ── */}
            {isVerify && (
              <>
                <Field
                  icon="keypad-outline"
                  placeholder="6-digit code"
                  value={code}
                  onChangeText={(t) => { setCode(t.replace(/\D/g, "").slice(0, 8)); if (error) setError(null); }}
                  keyboardType="number-pad"
                  autoFocus
                  maxLength={8}
                  style={{ letterSpacing: 6 }}
                  returnKeyType="done"
                  onSubmitEditing={verifyCode}
                />
                <Pressable style={styles.submit} onPress={verifyCode} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={colors.navyDeep} />
                  ) : (
                    <Txt style={styles.submitTxt}>Verify & sign in</Txt>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => resendIn === 0 && requestCode(true)}
                  disabled={resendIn > 0 || loading}
                  style={styles.linkRow}
                  hitSlop={8}
                >
                  <Txt style={[styles.linkTxt, resendIn > 0 && { opacity: 0.5 }]}>
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : "Didn't get it? Resend code"}
                  </Txt>
                </Pressable>
              </>
            )}

            {/* ── Password fallback ── */}
            {mode === "password" && (
              <>
                <Field
                  icon="person-outline"
                  placeholder="Email address"
                  value={identifier}
                  onChangeText={(t) => { setIdentifier(t); if (error) setError(null); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Field
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
                  secureTextEntry={!show}
                  right={
                    <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
                      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                    </Pressable>
                  }
                />
                <Pressable onPress={() => router.push("/forgot-password")} style={{ alignSelf: "flex-end", marginBottom: spacing.sm }} hitSlop={8}>
                  <Txt style={{ fontFamily: fonts.bodySemi, color: "rgba(255,255,255,0.7)", fontSize: 12.5 }}>Forgot password?</Txt>
                </Pressable>
                <Pressable style={styles.submit} onPress={submitPassword} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={colors.navyDeep} />
                  ) : (
                    <Txt style={styles.submitTxt}>Sign In</Txt>
                  )}
                </Pressable>
                <Pressable onPress={() => { setMode("otp"); setError(null); }} style={styles.linkRow} hitSlop={8}>
                  <Ionicons name="chatbox-ellipses-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Txt style={styles.linkTxt}>  Sign in with a one-time code</Txt>
                </Pressable>
              </>
            )}

            {/* ── Social sign-in (hidden on the code-verify step) ── */}
            {!isVerify && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Txt style={styles.dividerTxt}>or continue with</Txt>
                  <View style={styles.dividerLine} />
                </View>
                <View style={styles.social}>
                  <Pressable style={styles.socialBtn} onPress={() => oauth("google")} disabled={loading}>
                    <Ionicons name="logo-google" size={18} color={colors.navyDeep} />
                    <Txt style={styles.socialTxt}>Google</Txt>
                  </Pressable>
                  <Pressable style={styles.socialBtn} onPress={() => oauth("linkedin")} disabled={loading}>
                    <Ionicons name="logo-linkedin" size={18} color={colors.navyDeep} />
                    <Txt style={styles.socialTxt}>LinkedIn</Txt>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Txt variant="caption" color="rgba(255,255,255,0.6)">
              New to the family?{" "}
            </Txt>
            <Pressable onPress={() => router.replace("/register")}>
              <Txt style={{ fontFamily: fonts.bodyBold, color: colors.goldSoft, fontSize: 13 }}>Create an account</Txt>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

export function Field({
  icon,
  right,
  style,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={fieldStyles.wrap}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[fieldStyles.input, style]}
      />
      {right}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  close: { position: "absolute", right: spacing.lg, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  hand: { fontFamily: fonts.handBold, fontSize: 20, color: colors.goldSoft, marginTop: 10 },
  form: { marginTop: spacing.xxl },
  submit: { backgroundColor: colors.goldSoft, paddingVertical: 16, borderRadius: radius.md, alignItems: "center", marginTop: spacing.sm, ...shadow.lift },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(178,34,52,0.92)",
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  errorTxt: { flex: 1, fontFamily: fonts.bodySemi, color: colors.white, fontSize: 13 },
  submitTxt: { fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 },
  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.lg },
  linkTxt: { fontFamily: fonts.bodySemi, color: "rgba(255,255,255,0.8)", fontSize: 13 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.xl, marginBottom: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.18)" },
  dividerTxt: { fontFamily: fonts.bodySemi, color: "rgba(255,255,255,0.55)", fontSize: 12 },
  social: { flexDirection: "row", gap: spacing.md },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 13,
    borderRadius: radius.md,
    ...shadow.soft,
  },
  socialTxt: { fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 14.5 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.xl },
});
