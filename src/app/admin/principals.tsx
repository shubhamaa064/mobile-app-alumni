import React, { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createPrincipal, deletePrincipal, type Principal } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Avatar } from "@/components/Avatar";
import { Loader, EmptyState } from "@/components/ui";
import { AdminScreen, HeaderAction, FormField, SubmitButton, adminList } from "@/components/admin";
import { ImageUploadField } from "@/components/ImageUploadField";
import { initials } from "@/lib/format";

function tenureLabel(p: Principal): string {
  const t = p.tenures?.[0];
  if (!t) return "";
  if (t.startYear && t.endYear) return `${t.startYear} – ${t.endYear}`;
  if (t.startYear) return `${t.startYear} – present`;
  return "";
}

export default function PrincipalsAdmin() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const list = useQuery({ queryKey: ["principals"], queryFn: api.principals });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["principals"] });

  const addMut = useMutation({
    mutationFn: () =>
      createPrincipal({
        name: f.name.trim(),
        bio: f.bio?.trim() || undefined,
        profileImage: f.profileImage?.trim() || undefined,
        tenures: f.startYear
          ? [{ startYear: Number(f.startYear), endYear: f.endYear ? Number(f.endYear) : undefined, notes: f.notes?.trim() || undefined }]
          : [],
      }),
    onSuccess: () => { setF({}); setAdding(false); invalidate(); },
    onError: (e: Error) => Alert.alert("Failed", e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deletePrincipal(id),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const submit = () => {
    if (!f.name?.trim()) return Alert.alert("Missing name", "Please enter the principal's name.");
    addMut.mutate();
  };

  return (
    <AdminScreen title="Principals" admin headerRight={<HeaderAction icon="add" onPress={() => setAdding((a) => !a)} />}>
      {list.isLoading ? (
        <Loader label="Loading…" />
      ) : (
        <ScrollView contentContainerStyle={adminList.body} showsVerticalScrollIndicator={false}>
          {adding ? (
            <View style={[adminList.card, { padding: spacing.lg }]}>
              <Txt variant="bodyMedium" style={{ marginBottom: spacing.sm }}>New principal</Txt>
              <FormField label="Name" value={f.name || ""} onChangeText={set("name")} placeholder="Rev. Fr. …" />
              <FormField label="Bio (optional)" value={f.bio || ""} onChangeText={set("bio")} placeholder="Short note…" multiline />
              <ImageUploadField label="Photo (optional)" value={f.profileImage} onChange={set("profileImage")} shape="avatar" />
              <FormField label="Tenure start year" value={f.startYear || ""} onChangeText={set("startYear")} placeholder="1998" keyboardType="numeric" />
              <FormField label="Tenure end year (optional)" value={f.endYear || ""} onChangeText={set("endYear")} placeholder="2004" keyboardType="numeric" />
              <SubmitButton label="Add principal" onPress={submit} busy={addMut.isPending} />
            </View>
          ) : null}

          {(list.data || []).length === 0 ? (
            <EmptyState icon="school-outline" title="No principals yet" subtitle="Tap + to add one." />
          ) : (
            (list.data || []).map((p) => (
              <View key={p.id} style={[adminList.card, adminList.row, { padding: spacing.md }]}>
                <Avatar uri={p.profileImage} initials={initials(p.name.split(" ")[0], p.name.split(" ")[1])} size={48} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Txt variant="bodyMedium" numberOfLines={1}>{p.name}</Txt>
                  {tenureLabel(p) ? <Txt variant="caption">{tenureLabel(p)}</Txt> : null}
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => Alert.alert("Delete principal", `Remove ${p.name}?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => delMut.mutate(p.id) },
                  ])}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </AdminScreen>
  );
}
