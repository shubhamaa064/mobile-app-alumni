import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGalleryItem } from "@/lib/api";
import { spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { AdminScreen, FormField, ChipSelect, SubmitButton } from "@/components/admin";
import { ImageUploadField } from "@/components/ImageUploadField";

const TYPES = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
];
const CATEGORY = ["Events", "Reunions", "Campus", "Sports", "Cultural", "General"].map((c) => ({ value: c, label: c }));

export default function GalleryAdd() {
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>({ type: "photo", category: "General" });
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: () =>
      createGalleryItem({
        title: f.title.trim(),
        type: f.type || "photo",
        url: f.url.trim(),
        thumbnail: f.thumbnail?.trim() || undefined,
        description: f.description?.trim() || undefined,
        category: f.category || "General",
        isPublic: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminGallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    if (!f.title?.trim()) return Alert.alert("Missing title", "Please enter a title.");
    if (!f.url?.trim()) return Alert.alert("Missing URL", "Please paste the media URL.");
    mut.mutate();
  };

  return (
    <AdminScreen title="Add Media" admin>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
          <Txt variant="label" style={{ marginBottom: 6 }}>TYPE</Txt>
          <ChipSelect options={TYPES} value={f.type} onChange={set("type")} />

          <FormField label="Title" value={f.title || ""} onChangeText={set("title")} placeholder="Reunion 2025 group photo" />

          {f.type === "photo" ? (
            <ImageUploadField label="Photo" value={f.url} onChange={set("url")} shape="banner" hint="Upload from your device, or paste a URL below." />
          ) : null}
          <FormField
            label={f.type === "video" ? "Video URL" : "Image URL"}
            value={f.url || ""}
            onChangeText={set("url")}
            placeholder="https://…"
            autoCapitalize="none"
          />
          {f.type === "video" ? (
            <ImageUploadField label="Thumbnail" value={f.thumbnail} onChange={set("thumbnail")} shape="banner" hint="A still frame shown before the video plays." />
          ) : null}
          <FormField label="Thumbnail URL (optional)" value={f.thumbnail || ""} onChangeText={set("thumbnail")} placeholder="https://… (for videos)" autoCapitalize="none" />
          <FormField label="Description (optional)" value={f.description || ""} onChangeText={set("description")} placeholder="Caption…" multiline />

          <Txt variant="label" style={{ marginBottom: 6 }}>CATEGORY</Txt>
          <ChipSelect options={CATEGORY} value={f.category} onChange={set("category")} />

          <SubmitButton label="Add to gallery" onPress={submit} busy={mut.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
