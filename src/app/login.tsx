import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { goBack } from "@/lib/nav";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!identifier || !password) {
      Alert.alert("Almost there", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
      goBack();
    } catch (e) {
      Alert.alert("Sign in failed", e instanceof Error ? e.message : "Please try again.");
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
            <Logo height={96} plate />
            <Txt style={styles.hand}>welcome home</Txt>
            <Txt variant="title" color={colors.white} center style={{ marginTop: 2 }}>
              Sign in to CTK Alumni
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.65)" center style={{ marginTop: 4 }}>
              Reconnect with the family you grew up with
            </Txt>
          </View>

          <View style={styles.form}>
            <Field
              icon="person-outline"
              placeholder="Email address"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
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

            <Pressable style={styles.submit} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.navyDeep} />
              ) : (
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 }}>Sign In</Txt>
              )}
            </Pressable>
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
        style={fieldStyles.input}
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
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.xl },
});
