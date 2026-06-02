import React, { useState } from "react";
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBack } from "@/lib/nav";
import { forgotPassword } from "@/lib/api";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";
import { Field } from "./login";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert("Almost there", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      Alert.alert("Couldn't send reset link", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.hero} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable onPress={goBack} style={[styles.close, { top: insets.top + 8 }]} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.white} />
        </Pressable>

        <View style={styles.content}>
          <View style={{ alignItems: "center" }}>
            <Logo height={84} plate />
            <Txt variant="title" color={colors.white} center style={{ marginTop: spacing.md }}>
              Reset your password
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.65)" center style={{ marginTop: 4, maxWidth: 280 }}>
              {sent
                ? "If an account exists for that email, we've sent a reset link with a code."
                : "Enter your email and we'll send you a link to set a new password."}
            </Txt>
          </View>

          {sent ? (
            <View style={styles.form}>
              <View style={styles.successBox}>
                <Ionicons name="mail-open-outline" size={32} color={colors.goldSoft} />
                <Txt variant="body" color={colors.white} center style={{ marginTop: spacing.sm }}>
                  Check your inbox for the reset email.
                </Txt>
              </View>
              <Pressable style={styles.submit} onPress={() => router.replace("/reset-password")}>
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 }}>I have a code</Txt>
              </Pressable>
              <Pressable onPress={() => router.replace("/login")} style={{ alignItems: "center", marginTop: spacing.lg }}>
                <Txt style={{ fontFamily: fonts.bodySemi, color: colors.goldSoft, fontSize: 13 }}>Back to sign in</Txt>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Field
                icon="mail-outline"
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable style={styles.submit} onPress={submit} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.navyDeep} /> : (
                  <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 }}>Send reset link</Txt>
                )}
              </Pressable>
              <Pressable onPress={() => router.replace("/reset-password")} style={{ alignItems: "center", marginTop: spacing.lg }}>
                <Txt style={{ fontFamily: fonts.bodySemi, color: colors.goldSoft, fontSize: 13 }}>I already have a code</Txt>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  close: { position: "absolute", right: spacing.lg, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  form: { marginTop: spacing.xxl },
  submit: { backgroundColor: colors.goldSoft, paddingVertical: 16, borderRadius: radius.md, alignItems: "center", marginTop: spacing.sm, ...shadow.lift },
  successBox: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg },
});
