import React, { useState } from "react";
import { View, ScrollView, FlatList, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createAlbum, deleteAlbum, type Album } from "@/lib/api";
import { colors, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState } from "@/components/ui";
import { AdminScreen, HeaderAction, FormField, ChipSelect, ToggleField, SubmitButton } from "@/components/admin";
import { ImageUploadField, resolveMedia } from "@/components/ImageUploadField";

const CATEGORY = ["general", "events", "reunions", "campus", "sports", "cultural"].map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}));

export default function AlbumsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({ queryKey: ["adminAlbums"], queryFn: () => api.albums({ limit: 100 }) });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAlbum(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminAlbums"] });
      qc.invalidateQueries({ queryKey: ["albums"] });
    },
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const onDelete = (a: Album) =>
    Alert.alert("Delete album", `Remove "${a.name}"? Photos inside will be unlinked, not deleted.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => delMut.mutate(a.id) },
    ]);

  return (
    <AdminScreen title="Albums" admin headerRight={<HeaderAction icon={open ? "close" : "add"} onPress={() => setOpen((o) => !o)} />}>
      {open ? (
        <NewAlbumForm
          onDone={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["adminAlbums"] });
          }}
        />
      ) : list.isLoading ? (
        <Loader label="Loading albums…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="albums-outline" title="No albums yet" subtitle="Tap + to create your first album." />}
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm }}>
              <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.paperDim, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                {item.coverUrl ? (
                  <Image source={{ uri: resolveMedia(item.coverUrl) }} style={{ width: 56, height: 56 }} contentFit="cover" />
                ) : (
                  <Ionicons name="images-outline" size={22} color={colors.muted} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Txt variant="bodyMedium" numberOfLines={1}>{item.name}</Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {(item._count?.photos ?? 0)} photos · {item.category || "general"}
                  {item.isPublic === false ? " · private" : ""}
                </Txt>
              </View>
              <Pressable
                onPress={() => onDelete(item)}
                hitSlop={8}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(176,65,62,0.1)", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="trash-outline" size={17} color={colors.maroon} />
              </Pressable>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}

function NewAlbumForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState<Record<string, string>>({ category: "general" });
  const [coverUrl, setCoverUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requiresMembership, setRequiresMembership] = useState(false);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: () =>
      createAlbum({
        name: f.name.trim(),
        description: f.description?.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        category: f.category || "general",
        tags: f.tags?.trim() || undefined,
        isPublic,
        requiresMembership,
      }),
    onSuccess: onDone,
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    if (!f.name?.trim()) return Alert.alert("Missing name", "Please enter an album name.");
    mut.mutate();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Txt variant="heading" style={{ marginBottom: spacing.md }}>New album</Txt>
        <ImageUploadField label="Cover photo" value={coverUrl} onChange={setCoverUrl} shape="banner" />
        <FormField label="Album name" value={f.name || ""} onChangeText={set("name")} placeholder="Reunion 2025" />
        <FormField label="Description (optional)" value={f.description || ""} onChangeText={set("description")} placeholder="A short description…" multiline />
        <Txt variant="label" color={colors.inkSoft} style={{ marginBottom: 6 }}>CATEGORY</Txt>
        <ChipSelect options={CATEGORY} value={f.category} onChange={set("category")} />
        <FormField label="Tags (comma-separated, optional)" value={f.tags || ""} onChangeText={set("tags")} placeholder="alumni, 2025" autoCapitalize="none" />
        <ToggleField label="Public album" value={isPublic} onValueChange={setIsPublic} />
        <ToggleField label="Requires membership" value={requiresMembership} onValueChange={setRequiresMembership} />
        <SubmitButton label="Create album" onPress={submit} busy={mut.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
