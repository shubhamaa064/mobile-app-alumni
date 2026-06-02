import React, { useState } from "react";
import { View, FlatList, Pressable, Alert, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, deleteGalleryItem, type GalleryItem } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState } from "@/components/ui";
import { AdminScreen, HeaderAction } from "@/components/admin";

type Tab = "photo" | "video";

export default function GalleryAdmin() {
  const { width } = useWindowDimensions();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("photo");
  const size = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

  const list = useQuery({ queryKey: ["adminGallery", tab], queryFn: () => api.gallery({ type: tab, limit: 90 }) });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteGalleryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminGallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const onDelete = (g: GalleryItem) =>
    Alert.alert("Delete media", `Remove "${g.title || "this item"}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => delMut.mutate(g.id) },
    ]);

  return (
    <AdminScreen title="Gallery" admin headerRight={<HeaderAction icon="add" onPress={() => router.push("/admin/gallery-add")} />}>
      <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm }}>
        {(["photo", "video"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: active ? colors.goldSoft : colors.paperDim,
              }}
            >
              <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: active ? colors.navyDeep : colors.inkSoft }}>
                {t === "photo" ? "Photos" : "Videos"}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {list.isLoading ? (
        <Loader label="Loading media…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(g) => g.id}
          numColumns={3}
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="images-outline" title={`No ${tab}s yet`} subtitle="Tap + to add media." />}
          renderItem={({ item }) => (
            <View style={{ width: size }}>
              <Image
                source={{ uri: item.thumbnail || item.url }}
                style={{ width: size, height: size, borderRadius: radius.md, backgroundColor: colors.paperDim }}
                contentFit="cover"
              />
              {item.type === "video" ? (
                <View style={{ position: "absolute", top: 6, left: 6, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10, padding: 3 }}>
                  <Ionicons name="play" size={12} color={colors.white} />
                </View>
              ) : null}
              <Pressable
                onPress={() => onDelete(item)}
                hitSlop={6}
                style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(176,65,62,0.92)", borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="trash" size={13} color={colors.white} />
              </Pressable>
              <Txt variant="caption" numberOfLines={1} style={{ marginTop: 4 }}>{item.title || "Untitled"}</Txt>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}
