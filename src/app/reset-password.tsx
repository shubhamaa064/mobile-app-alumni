import React, { useState } from "react";
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBack } from "@/lib/nav";
import { resetPassword } from "@/lib/api";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";
import { Field } from "./login";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token.trim()) {
      Alert.alert("Missing code", "Please paste the reset code from your email.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Your new password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", "Please re-enter the same password.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      Alert.alert("Password updated", "You can now sign in with your new password.", [
        { text: "Sign in", onPress: () => router.replace("/login") },
      ]);
    } catch (e) {
      Alert.alert("Couldn't reset password", e instanceof Error ? e.message : "The code may have expired. Please request a new one.");
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
              Set a new password
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.65)" center style={{ marginTop: 4, maxWidth: 280 }}>
              Paste the code from your email and choose a new password.
            </Txt>
          </View>

          <View style={styles.form}>
            <Field icon="key-outline" placeholder="Reset code" value={token} onChangeText={setToken} autoCapitalize="none" />
            <Field
              icon="lock-closed-outline"
              placeholder="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              right={
                <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
                  <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
              }
            />
            <Field icon="lock-closed-outline" placeholder="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry={!show} />

            <Pressable style={styles.submit} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.navyDeep} /> : (
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 }}>Reset password</Txt>
              )}
            </Pressable>
            <Pressable onPress={() => router.replace("/login")} style={{ alignItems: "center", marginTop: spacing.lg }}>
              <Txt style={{ fontFamily: fonts.bodySemi, color: colors.goldSoft, fontSize: 13 }}>Back to sign in</Txt>
            </Pressable>
          </View>
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
});
