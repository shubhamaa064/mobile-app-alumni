import React, { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createDesignation, deleteDesignation, deleteLeader, type Leader } from "@/lib/api";
import { colors, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Avatar } from "@/components/Avatar";
import { Loader, EmptyState } from "@/components/ui";
import { AdminScreen, HeaderAction, FormField, SubmitButton, adminList } from "@/components/admin";
import { initials } from "@/lib/format";

export default function LeadershipAdmin() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const list = useQuery({ queryKey: ["leadership"], queryFn: api.leadership });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["leadership"] });

  const addDesig = useMutation({
    mutationFn: () => createDesignation({ name: name.trim() }),
    onSuccess: () => { setName(""); setAdding(false); invalidate(); },
    onError: (e: Error) => Alert.alert("Failed", e.message),
  });
  const delDesig = useMutation({
    mutationFn: (id: string) => deleteDesignation(id),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });
  const delMember = useMutation({
    mutationFn: (id: string) => deleteLeader(id),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const confirmDelDesig = (d: Leader) =>
    Alert.alert("Delete designation", `Remove "${d.name}" and its members?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => delDesig.mutate(d.id) },
    ]);

  return (
    <AdminScreen title="Leadership" admin headerRight={<HeaderAction icon="add" onPress={() => setAdding((a) => !a)} />}>
      {list.isLoading ? (
        <Loader label="Loading…" />
      ) : (
        <ScrollView contentContainerStyle={adminList.body} showsVerticalScrollIndicator={false}>
          {adding ? (
            <View style={[adminList.card, { padding: spacing.lg }]}>
              <Txt variant="bodyMedium" style={{ marginBottom: spacing.sm }}>New designation</Txt>
              <FormField label="Title" value={name} onChangeText={setName} placeholder="President, Secretary…" />
              <SubmitButton label="Add designation" onPress={() => name.trim() ? addDesig.mutate() : Alert.alert("Missing name", "Enter a title.")} busy={addDesig.isPending} />
            </View>
          ) : null}

          {(list.data?.data || []).length === 0 ? (
            <EmptyState icon="people-circle-outline" title="No designations yet" subtitle="Tap + to add one." />
          ) : (
            (list.data?.data || []).map((d) => (
              <View key={d.id} style={[adminList.card, { padding: spacing.lg }]}>
                <View style={adminList.row}>
                  <Txt variant="heading" style={{ flex: 1 }}>{d.name}</Txt>
                  <Pressable onPress={() => confirmDelDesig(d)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>

                {d.members.map((m) => (
                  <View key={m.id} style={[adminList.row, { marginTop: spacing.md }]}>
                    <Avatar uri={m.profileImage} initials={initials(m.name.split(" ")[0], m.name.split(" ")[1])} size={40} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Txt variant="bodyMedium" numberOfLines={1}>{m.name}</Txt>
                      <Txt variant="caption" numberOfLines={1}>
                        {[m.batchYear ? `Batch ${m.batchYear}` : null, m.isCurrent ? "Current" : null].filter(Boolean).join(" · ") || "Member"}
                      </Txt>
                    </View>
                    <Pressable
                      onPress={() => Alert.alert("Remove member", `Remove ${m.name}?`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: () => delMember.mutate(m.id) },
                      ])}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}

                <Pressable style={addMemberBtn} onPress={() => router.push(`/admin/leader-add?designationId=${d.id}&name=${encodeURIComponent(d.name)}`)}>
                  <Ionicons name="person-add-outline" size={16} color={colors.navy} />
                  <Txt variant="caption" color={colors.navy} style={{ marginLeft: 6 }}>Add member</Txt>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </AdminScreen>
  );
}

const addMemberBtn = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginTop: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.line,
  ...shadow.soft,
};
