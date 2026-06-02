import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createNews, updateNews, type NewsInput } from "@/lib/api";
import { spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader } from "@/components/ui";
import { AdminScreen, FormField, ChipSelect, ToggleField, SubmitButton } from "@/components/admin";
import { ImageUploadField } from "@/components/ImageUploadField";

const CATEGORY = ["Achievement", "Announcement", "Event", "Obituary", "General"].map((c) => ({ value: c, label: c }));

export default function NewsEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const qc = useQueryClient();

  const existing = useQuery({ queryKey: ["news", id], queryFn: () => api.newsItem(id!), enabled: editing });

  const [f, setF] = useState<Record<string, string>>({});
  const [featured, setFeatured] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  if (editing && existing.data && !hydrated) {
    const n = existing.data;
    setF({
      title: n.title ?? "",
      excerpt: n.excerpt ?? "",
      content: n.content ?? "",
      author: n.author ?? "",
      category: n.category ?? "General",
      imageUrl: n.imageUrl ?? "",
      tags: n.tags ?? "",
    });
    setFeatured(!!n.featured);
    setHydrated(true);
  }

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: (body: NewsInput) => (editing ? updateNews(id!, body) : createNews(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNews"] });
      qc.invalidateQueries({ queryKey: ["news"] });
      if (editing) qc.invalidateQueries({ queryKey: ["news", id] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    if (!f.title?.trim()) return Alert.alert("Missing title", "Please enter a headline.");
    if (!f.content?.trim()) return Alert.alert("Missing content", "Please write the article body.");
    const body: NewsInput = {
      title: f.title.trim(),
      excerpt: f.excerpt?.trim() || f.content.trim().slice(0, 160),
      content: f.content.trim(),
      author: f.author?.trim() || "CTK Alumni",
      category: f.category || "General",
      imageUrl: f.imageUrl?.trim() || "",
      tags: f.tags?.trim() || "",
      featured,
    };
    mut.mutate(body);
  };

  return (
    <AdminScreen title={editing ? "Edit Article" : "New Article"} admin>
      {editing && existing.isLoading ? (
        <Loader label="Loading…" />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
            <FormField label="Headline" value={f.title || ""} onChangeText={set("title")} placeholder="Alumna wins national award" />
            <FormField label="Excerpt" value={f.excerpt || ""} onChangeText={set("excerpt")} placeholder="Short summary (optional)" multiline />
            <FormField label="Content" value={f.content || ""} onChangeText={set("content")} placeholder="Full story…" multiline />
            <FormField label="Author" value={f.author || ""} onChangeText={set("author")} placeholder="CTK Alumni" />

            <Txt variant="label" style={{ marginBottom: 6 }}>CATEGORY</Txt>
            <ChipSelect options={CATEGORY} value={f.category || "General"} onChange={set("category")} />

            <ImageUploadField label="Cover image (optional)" value={f.imageUrl} onChange={set("imageUrl")} shape="banner" />
            <FormField label="Tags (comma separated)" value={f.tags || ""} onChangeText={set("tags")} placeholder="award, 2026" autoCapitalize="none" />
            <ToggleField label="Feature on Wall of Fame" value={featured} onValueChange={setFeatured} />

            <SubmitButton label={editing ? "Save changes" : "Publish article"} onPress={submit} busy={mut.isPending} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </AdminScreen>
  );
}
