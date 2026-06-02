import React from "react";
import { View, FlatList, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, deleteNews, type NewsArticle } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState, Chip } from "@/components/ui";
import { AdminScreen, HeaderAction, adminList } from "@/components/admin";
import { formatDate } from "@/lib/format";

export default function NewsAdmin() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["adminNews"], queryFn: () => api.adminNews({ limit: 50 }) });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNews"] });
      qc.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const onDelete = (n: NewsArticle) =>
    Alert.alert("Delete article", `Remove "${n.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => delMut.mutate(n.id) },
    ]);

  return (
    <AdminScreen title="News & Stories" admin headerRight={<HeaderAction icon="add" onPress={() => router.push("/admin/news-edit")} />}>
      {list.isLoading ? (
        <Loader label="Loading articles…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={adminList.body}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="newspaper-outline" title="No articles yet" subtitle="Tap + to publish a story." />}
          renderItem={({ item }) => (
            <View style={adminList.card}>
              <View style={adminList.row}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyMedium" numberOfLines={2}>{item.title}</Txt>
                  <Txt variant="caption" numberOfLines={1}>
                    {item.author || "—"} · {formatDate(item.publishedAt)} · {item.views ?? 0} views
                  </Txt>
                </View>
                {item.featured ? <Chip label="Featured" tone="gold" icon="star" /> : null}
              </View>
              <View style={adminList.actions}>
                <Pressable style={adminList.actionBtn} onPress={() => router.push(`/admin/news-edit?id=${item.id}`)}>
                  <Ionicons name="create-outline" size={15} color={colors.navy} />
                  <Txt variant="caption" color={colors.navy}>Edit</Txt>
                </Pressable>
                <Pressable style={adminList.actionBtn} onPress={() => router.push(`/news/${item.id}`)}>
                  <Ionicons name="eye-outline" size={15} color={colors.navy} />
                  <Txt variant="caption" color={colors.navy}>View</Txt>
                </Pressable>
                <Pressable style={[adminList.actionBtn, adminList.actionDanger]} onPress={() => onDelete(item)}>
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  <Txt variant="caption" color={colors.danger}>Delete</Txt>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}
