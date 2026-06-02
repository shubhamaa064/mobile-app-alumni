import React, { useState } from "react";
import { View, FlatList, Pressable, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, updateMember, deleteMember, type AlumniUser, type Role } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Avatar } from "@/components/Avatar";
import { Loader, EmptyState, Chip } from "@/components/ui";
import { AdminScreen, adminList, isAdmin } from "@/components/admin";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

const ROLES: Role[] = ["ALUMNI", "MODERATOR", "ADMIN"];

export default function MembersAdmin() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const list = useQuery({
    queryKey: ["adminMembers", q],
    queryFn: () => api.adminMembers({ search: q, limit: 50 }),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) => updateMember(id, { isVerified }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminMembers"] }),
    onError: (e: Error) => Alert.alert("Update failed", e.message),
  });
  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateMember(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminMembers"] }),
    onError: (e: Error) => Alert.alert("Update failed", e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminMembers"] }),
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const onRole = (m: AlumniUser) => {
    const current = (m.role as Role) || "ALUMNI";
    const next = ROLES.filter((r) => r !== current);
    Alert.alert("Change role", `Currently ${current}. Set to:`, [
      ...next.map((r) => ({ text: r, onPress: () => roleMut.mutate({ id: m.id, role: r }) })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };
  const onDelete = (m: AlumniUser) => {
    const name = m.alumniProfile ? `${m.alumniProfile.firstName} ${m.alumniProfile.lastName}`.trim() : m.email;
    Alert.alert("Delete member", `Permanently remove ${name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => delMut.mutate(m.id) },
    ]);
  };

  return (
    <AdminScreen title="Members">
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <View style={adminList.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setQ(search.trim())}
            placeholder="Search name, email, batch…"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            autoCapitalize="none"
            style={adminList.searchInput}
          />
          {search ? (
            <Pressable onPress={() => { setSearch(""); setQ(""); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {list.isLoading ? (
        <Loader label="Loading members…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            list.data ? (
              <Txt variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
                {list.data.total} member{list.data.total === 1 ? "" : "s"}
              </Txt>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="people-outline" title="No members found" />}
          renderItem={({ item }) => {
            const p = item.alumniProfile;
            const name = p ? `${p.firstName} ${p.lastName}`.trim() : item.email;
            return (
              <View style={adminList.card}>
                <Pressable style={adminList.row} onPress={() => router.push(`/alumni/${item.id}`)}>
                  <Avatar uri={p?.imageUrl} initials={initials(p?.firstName, p?.lastName)} size={44} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Txt variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>{name}</Txt>
                      {p?.isVerified ? <Ionicons name="checkmark-circle" size={14} color={colors.success} /> : null}
                    </View>
                    <Txt variant="caption" numberOfLines={1}>{item.email}</Txt>
                  </View>
                  <Chip label={item.role || "ALUMNI"} tone={item.role === "ADMIN" ? "navy" : item.role === "MODERATOR" ? "gold" : "ghost"} />
                </Pressable>

                <View style={adminList.actions}>
                  <Pressable
                    style={adminList.actionBtn}
                    onPress={() => verifyMut.mutate({ id: item.id, isVerified: !p?.isVerified })}
                  >
                    <Ionicons name={p?.isVerified ? "close-circle-outline" : "checkmark-circle-outline"} size={15} color={colors.navy} />
                    <Txt variant="caption" color={colors.navy}>{p?.isVerified ? "Unverify" : "Verify"}</Txt>
                  </Pressable>
                  {admin ? (
                    <>
                      <Pressable style={adminList.actionBtn} onPress={() => onRole(item)}>
                        <Ionicons name="swap-horizontal" size={15} color={colors.navy} />
                        <Txt variant="caption" color={colors.navy}>Role</Txt>
                      </Pressable>
                      <Pressable style={[adminList.actionBtn, adminList.actionDanger]} onPress={() => onDelete(item)}>
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                        <Txt variant="caption" color={colors.danger}>Delete</Txt>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </AdminScreen>
  );
}
