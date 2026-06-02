import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { contact } from "@/lib/api";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Field } from "./login";

const CATEGORIES = ["General", "Events", "Membership", "Technical", "Donation"] as const;

export default function ContactScreen() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("General");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      Alert.alert("Missing details", "Name, email and message are required.");
      return;
    }
    setLoading(true);
    try {
      await contact({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        category,
        message: form.message.trim(),
      });
      Alert.alert("Message sent ✓", "Thank you for reaching out — the association will get back to you soon.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setCategory("General");
    } catch (e) {
      Alert.alert("Could not send", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="We'd love to hear from you" title="Contact Us" subtitle="Questions, ideas or just a hello" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Field icon="person-outline" placeholder="Your name" value={form.name} onChangeText={set("name")} />
          <Field
            icon="mail-outline"
            placeholder="Email"
            value={form.email}
            onChangeText={set("email")}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            icon="call-outline"
            placeholder="Phone (optional)"
            value={form.phone}
            onChangeText={set("phone")}
            keyboardType="phone-pad"
          />

          <Txt variant="label" color={colors.goldDeep} style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
            CATEGORY
          </Txt>
          <View style={styles.catRow}>
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.cat, active && styles.catActive]}>
                  <Txt style={[styles.catText, active && styles.catTextActive]}>{c}</Txt>
                </Pressable>
              );
            })}
          </View>

          <Field icon="pricetag-outline" placeholder="Subject (optional)" value={form.subject} onChangeText={set("subject")} />

          <View style={styles.messageWrap}>
            <TextInput
              placeholder="Your message"
              placeholderTextColor={colors.muted}
              value={form.message}
              onChangeText={set("message")}
              multiline
              textAlignVertical="top"
              style={styles.messageInput}
            />
          </View>

          <Pressable style={styles.submit} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.navyDeep} />
            ) : (
              <>
                <Ionicons name="send" size={16} color={colors.navyDeep} />
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16, marginLeft: 8 }}>Send Message</Txt>
              </>
            )}
          </Pressable>

          <Pressable style={styles.websiteRow} onPress={() => router.push("/about")}>
            <Ionicons name="information-circle-outline" size={16} color={colors.navy} />
            <Txt variant="caption" style={{ color: colors.navy, marginLeft: 6 }}>
              Learn more about the association
            </Txt>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  cat: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  catActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  catText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.inkSoft },
  catTextActive: { color: colors.goldSoft },
  messageWrap: { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  messageInput: { minHeight: 120, fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingHorizontal: 10, paddingTop: 6 },
  submit: { flexDirection: "row", backgroundColor: colors.goldSoft, paddingVertical: 16, borderRadius: radius.md, alignItems: "center", justifyContent: "center", ...shadow.lift },
  websiteRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
});
