import React, { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, respondSurvey, type Survey, type SurveyQuestion } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader } from "@/components/ui";

type Answer = string | string[] | number;

function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function kind(type: string): "text" | "single" | "multiple" | "rating" {
  const t = type.toLowerCase();
  if (t.includes("multi") || t.includes("checkbox")) return "multiple";
  if (t.includes("rating") || t.includes("scale") || t.includes("nps")) return "rating";
  if (t.includes("single") || t.includes("radio") || t.includes("choice") || t.includes("select")) return "single";
  return "text";
}

export default function SurveyRespond() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["surveys"], queryFn: api.surveys });
  const survey = useMemo<Survey | undefined>(() => data?.data.find((s) => s.id === id), [data, id]);

  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const submit = useMutation({
    mutationFn: () => respondSurvey(id, answers),
    onSuccess: () => {
      Alert.alert("Thank you!", "Your response has been recorded.");
      goBack();
    },
    onError: (e) => Alert.alert("Couldn't submit", e instanceof Error ? e.message : "Please try again."),
  });

  if (isLoading) return <View style={styles.container}><Loader label="Loading survey…" /></View>;
  if (!survey) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", padding: spacing.xl }]}>
        <Ionicons name="clipboard-outline" size={56} color={colors.muted} />
        <Txt variant="heading" center style={{ marginTop: spacing.md }}>Survey unavailable</Txt>
        <Pressable onPress={goBack} style={styles.primaryBtn}>
          <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep }}>Go back</Txt>
        </Pressable>
      </View>
    );
  }

  const needsAuth = !survey.isAnonymous && !user;

  const onSubmit = () => {
    if (needsAuth) {
      router.push("/login");
      return;
    }
    const missing = survey.questions.filter((q) => {
      if (!q.required) return false;
      const a = answers[q.id];
      return a === undefined || a === "" || (Array.isArray(a) && a.length === 0);
    });
    if (missing.length) {
      Alert.alert("Almost done", "Please answer all required questions before submitting.");
      return;
    }
    submit.mutate();
  };

  const setAnswer = (qid: string, value: Answer) => setAnswers((s) => ({ ...s, [qid]: value }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerBar}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
          <Txt variant="label" color="rgba(255,255,255,0.8)">SURVEY</Txt>
          <View style={{ width: 38 }} />
        </View>
        <Txt variant="title" color={colors.white} style={{ marginTop: spacing.sm }}>{survey.title}</Txt>
        {survey.description ? (
          <Txt variant="body" color="rgba(255,255,255,0.75)" style={{ marginTop: 4 }}>{survey.description}</Txt>
        ) : null}
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {survey.questions.map((q, i) => (
            <QuestionCard key={q.id} index={i + 1} q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          ))}

          {needsAuth ? (
            <Txt variant="caption" color={colors.muted} center style={{ marginBottom: spacing.md }}>
              Sign in to submit your response.
            </Txt>
          ) : null}

          <Pressable style={[styles.submitBtn, submit.isPending && { opacity: 0.6 }]} onPress={onSubmit} disabled={submit.isPending}>
            {submit.isPending ? <ActivityIndicator color={colors.navyDeep} /> : (
              <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 }}>
                {needsAuth ? "Sign in to submit" : "Submit Response"}
              </Txt>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function QuestionCard({ index, q, value, onChange }: { index: number; q: SurveyQuestion; value?: Answer; onChange: (v: Answer) => void }) {
  const k = kind(q.type);
  const options = parseOptions(q.options);

  return (
    <View style={[styles.card, shadow.soft]}>
      <View style={{ flexDirection: "row" }}>
        <Txt style={{ fontFamily: fonts.bodyBold, color: colors.goldDeep, fontSize: 14 }}>{index}. </Txt>
        <Txt variant="bodyMedium" style={{ flex: 1 }}>
          {q.prompt}{q.required ? <Txt style={{ color: colors.danger }}> *</Txt> : null}
        </Txt>
      </View>

      <View style={{ marginTop: spacing.md }}>
        {k === "text" ? (
          <TextInput
            value={typeof value === "string" ? value : ""}
            onChangeText={onChange}
            placeholder="Type your answer…"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
        ) : null}

        {k === "single" ? options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable key={opt} style={styles.optionRow} onPress={() => onChange(opt)}>
              <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? colors.gold : colors.muted} />
              <Txt variant="body" color={colors.ink} style={{ marginLeft: spacing.sm, flex: 1 }}>{opt}</Txt>
            </Pressable>
          );
        }) : null}

        {k === "multiple" ? options.map((opt) => {
          const arr = Array.isArray(value) ? value : [];
          const selected = arr.includes(opt);
          return (
            <Pressable
              key={opt}
              style={styles.optionRow}
              onPress={() => onChange(selected ? arr.filter((o) => o !== opt) : [...arr, opt])}
            >
              <Ionicons name={selected ? "checkbox" : "square-outline"} size={20} color={selected ? colors.gold : colors.muted} />
              <Txt variant="body" color={colors.ink} style={{ marginLeft: spacing.sm, flex: 1 }}>{opt}</Txt>
            </Pressable>
          );
        }) : null}

        {k === "rating" ? (
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = typeof value === "number" && value >= n;
              return (
                <Pressable key={n} onPress={() => onChange(n)} hitSlop={4}>
                  <Ionicons name={active ? "star" : "star-outline"} size={30} color={active ? colors.gold : colors.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  input: { backgroundColor: colors.paperDim, borderRadius: radius.md, padding: spacing.md, minHeight: 56, fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  submitBtn: { backgroundColor: colors.goldSoft, paddingVertical: 16, borderRadius: radius.md, alignItems: "center", marginTop: spacing.sm, ...shadow.lift },
  primaryBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.pill },
});
