import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSurvey, type SurveyQuestionInput } from "@/lib/api";
import { colors, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { AdminScreen, FormField, ChipSelect, ToggleField, SubmitButton } from "@/components/admin";

type Draft = { prompt: string; type: string; options: string };
const QTYPES = [
  { value: "text", label: "Text" },
  { value: "single", label: "Single choice" },
  { value: "multiple", label: "Multiple choice" },
  { value: "rating", label: "Rating" },
];
const hasOptions = (t: string) => t === "single" || t === "multiple";

export default function SurveyCreate() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [questions, setQuestions] = useState<Draft[]>([{ prompt: "", type: "text", options: "" }]);

  const setQ = (i: number, patch: Partial<Draft>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const addQ = () => setQuestions((qs) => [...qs, { prompt: "", type: "text", options: "" }]);
  const removeQ = (i: number) => setQuestions((qs) => (qs.length > 1 ? qs.filter((_, idx) => idx !== i) : qs));

  const mut = useMutation({
    mutationFn: () => {
      const qInput: SurveyQuestionInput[] = questions.map((q) => ({
        prompt: q.prompt.trim(),
        type: q.type,
        required: true,
        options: hasOptions(q.type)
          ? q.options.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined,
      }));
      return createSurvey({
        title: title.trim(),
        description: description.trim() || undefined,
        isAnonymous: anonymous,
        closesAt: closesAt.trim() ? new Date(closesAt.trim()).toISOString() : undefined,
        questions: qInput,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveys"] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    if (!title.trim()) return Alert.alert("Missing title", "Please name the survey.");
    const empty = questions.findIndex((q) => !q.prompt.trim());
    if (empty >= 0) return Alert.alert("Incomplete question", `Question ${empty + 1} needs a prompt.`);
    const badOpts = questions.findIndex((q) => hasOptions(q.type) && q.options.split(",").map((o) => o.trim()).filter(Boolean).length < 2);
    if (badOpts >= 0) return Alert.alert("Add options", `Question ${badOpts + 1} needs at least two comma-separated options.`);
    mut.mutate();
  };

  return (
    <AdminScreen title="New Survey" admin>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
          <FormField label="Survey title" value={title} onChangeText={setTitle} placeholder="Alumni satisfaction 2026" />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} placeholder="What is this for?" multiline />
          <FormField label="Closes on (optional)" value={closesAt} onChangeText={setClosesAt} placeholder="2026-12-31" autoCapitalize="none" />
          <ToggleField label="Anonymous responses" value={anonymous} onValueChange={setAnonymous} />

          <Txt variant="label" color={colors.goldDeep} style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>QUESTIONS</Txt>
          {questions.map((q, i) => (
            <View key={i} style={qStyle}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
                <Txt variant="bodyMedium" style={{ flex: 1 }}>Question {i + 1}</Txt>
                {questions.length > 1 ? (
                  <Pressable onPress={() => removeQ(i)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
              <FormField label="Prompt" value={q.prompt} onChangeText={(v) => setQ(i, { prompt: v })} placeholder="How would you rate…" />
              <Txt variant="label" style={{ marginBottom: 6 }}>TYPE</Txt>
              <ChipSelect options={QTYPES} value={q.type} onChange={(v) => setQ(i, { type: v })} />
              {hasOptions(q.type) ? (
                <FormField label="Options (comma separated)" value={q.options} onChangeText={(v) => setQ(i, { options: v })} placeholder="Excellent, Good, Poor" />
              ) : null}
            </View>
          ))}

          <Pressable onPress={addQ} style={addBtn}>
            <Ionicons name="add-circle-outline" size={18} color={colors.navy} />
            <Txt variant="bodyMedium" color={colors.navy} style={{ marginLeft: 6 }}>Add question</Txt>
          </Pressable>

          <SubmitButton label="Create survey" onPress={submit} busy={mut.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}

const qStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.line,
} as const;

const addBtn = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  paddingVertical: spacing.md,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.gold,
  borderStyle: "dashed" as const,
  marginBottom: spacing.lg,
};
