import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { goBack } from "@/lib/nav";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";
import { Field } from "./login";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { applySession } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", batchYear: "", profession: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert("Missing details", "Name, email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const session = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        batchYear: form.batchYear ? parseInt(form.batchYear) : undefined,
        profession: form.profession || undefined,
      });
      // mobile-register returns a session — sign in immediately.
      await applySession(session);
      Alert.alert("Welcome to the family! 🎓", "Your account is ready.");
      goBack();
    } catch (e) {
      Alert.alert("Registration failed", e instanceof Error ? e.message : "Please try again.");
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

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", paddingTop: insets.top + spacing.xl }}>
            <Logo height={84} plate />
            <Txt style={styles.hand}>begin your story</Txt>
            <Txt variant="title" color={colors.white} center style={{ marginTop: 2 }}>
              Join CTK Alumni
            </Txt>
          </View>

          <View style={styles.form}>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field icon="person-outline" placeholder="First name" value={form.firstName} onChangeText={set("firstName")} />
              </View>
              <View style={{ flex: 1 }}>
                <Field icon="person-outline" placeholder="Last name" value={form.lastName} onChangeText={set("lastName")} />
              </View>
            </View>
            <Field icon="mail-outline" placeholder="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
            <Field
              icon="lock-closed-outline"
              placeholder="Password (8+ chars, A-z, 0-9)"
              value={form.password}
              onChangeText={set("password")}
              secureTextEntry={!show}
              right={
                <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
                  <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
              }
            />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field icon="school-outline" placeholder="Batch year" value={form.batchYear} onChangeText={set("batchYear")} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1.4 }}>
                <Field icon="briefcase-outline" placeholder="Profession" value={form.profession} onChangeText={set("profession")} />
              </View>
            </View>

            <Pressable style={styles.submit} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.navyDeep} />
              ) : (
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 }}>Create Account</Txt>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Txt variant="caption" color="rgba(255,255,255,0.6)">
              Already a member?{" "}
            </Txt>
            <Pressable onPress={() => router.replace("/login")}>
              <Txt style={{ fontFamily: fonts.bodyBold, color: colors.goldSoft, fontSize: 13 }}>Sign in</Txt>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  close: { position: "absolute", right: spacing.lg, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  hand: { fontFamily: fonts.handBold, fontSize: 20, color: colors.goldSoft, marginTop: 10 },
  form: { marginTop: spacing.xl },
  submit: { backgroundColor: colors.goldSoft, paddingVertical: 16, borderRadius: radius.md, alignItems: "center", marginTop: spacing.sm, ...shadow.lift },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.xl },
});
