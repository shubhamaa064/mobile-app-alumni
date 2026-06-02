import React from "react";
import { View, FlatList, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, deleteJob, type JobPost } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState, Chip } from "@/components/ui";
import { AdminScreen, HeaderAction, adminList } from "@/components/admin";

export default function JobsAdmin() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["adminJobs"], queryFn: () => api.adminJobs({ limit: 50 }) });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminJobs"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const onDelete = (j: JobPost) =>
    Alert.alert("Delete posting", `Remove "${j.title}" at ${j.company}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => delMut.mutate(j.id) },
    ]);

  return (
    <AdminScreen title="Job Board" admin headerRight={<HeaderAction icon="add" onPress={() => router.push("/admin/job-edit")} />}>
      {list.isLoading ? (
        <Loader label="Loading jobs…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(j) => j.id}
          contentContainerStyle={adminList.body}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No postings yet" subtitle="Tap + to add a job." />}
          renderItem={({ item }) => (
            <View style={adminList.card}>
              <View style={adminList.row}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyMedium" numberOfLines={1}>{item.title}</Txt>
                  <Txt variant="caption" numberOfLines={1}>{item.company} · {item.location}</Txt>
                </View>
                <Chip label={item.type || "—"} tone="navy" />
              </View>
              <View style={{ flexDirection: "row", marginTop: 6, gap: spacing.md }}>
                {item.salaryRange ? <Txt variant="caption" color={colors.muted}>{item.salaryRange}</Txt> : null}
                <Txt variant="caption" color={item.isActive ? colors.success : colors.muted}>{item.isActive ? "Active" : "Closed"}</Txt>
              </View>
              <View style={adminList.actions}>
                <Pressable style={adminList.actionBtn} onPress={() => router.push(`/admin/job-edit?id=${item.id}`)}>
                  <Ionicons name="create-outline" size={15} color={colors.navy} />
                  <Txt variant="caption" color={colors.navy}>Edit</Txt>
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
