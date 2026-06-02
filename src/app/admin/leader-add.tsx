import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLeader } from "@/lib/api";
import { spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { AdminScreen, FormField, ToggleField, SubmitButton } from "@/components/admin";
import { ImageUploadField } from "@/components/ImageUploadField";

export default function LeaderAdd() {
  const { designationId, name: desigName } = useLocalSearchParams<{ designationId?: string; name?: string }>();
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>({});
  const [isCurrent, setIsCurrent] = useState(true);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: () =>
      createLeader({
        designationId: designationId!,
        name: f.name.trim(),
        bio: f.bio?.trim() || undefined,
        batchYear: f.batchYear ? Number(f.batchYear) : undefined,
        email: f.email?.trim() || undefined,
        phone: f.phone?.trim() || undefined,
        linkedinUrl: f.linkedinUrl?.trim() || undefined,
        startYear: f.startYear ? Number(f.startYear) : undefined,
        endYear: f.endYear ? Number(f.endYear) : undefined,
        isCurrent,
        profileImage: f.profileImage?.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leadership"] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    if (!designationId) return Alert.alert("Missing designation", "Open this from a designation.");
    if (!f.name?.trim()) return Alert.alert("Missing name", "Please enter the member's name.");
    mut.mutate();
  };

  return (
    <AdminScreen title="Add Member" admin>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
          {desigName ? (
            <Txt variant="caption" style={{ marginBottom: spacing.md }}>
              Adding to <Txt variant="bodyMedium">{desigName}</Txt>
            </Txt>
          ) : null}
          <FormField label="Name" value={f.name || ""} onChangeText={set("name")} placeholder="Full name" />
          <FormField label="Batch year (optional)" value={f.batchYear || ""} onChangeText={set("batchYear")} placeholder="2005" keyboardType="numeric" />
          <FormField label="Bio (optional)" value={f.bio || ""} onChangeText={set("bio")} placeholder="Short bio…" multiline />
          <FormField label="Email (optional)" value={f.email || ""} onChangeText={set("email")} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" />
          <FormField label="Phone (optional)" value={f.phone || ""} onChangeText={set("phone")} placeholder="+91…" keyboardType="phone-pad" />
          <FormField label="LinkedIn URL (optional)" value={f.linkedinUrl || ""} onChangeText={set("linkedinUrl")} placeholder="https://linkedin.com/in/…" autoCapitalize="none" />
          <FormField label="Term start year (optional)" value={f.startYear || ""} onChangeText={set("startYear")} placeholder="2022" keyboardType="numeric" />
          <FormField label="Term end year (optional)" value={f.endYear || ""} onChangeText={set("endYear")} placeholder="2024" keyboardType="numeric" />
          <ImageUploadField label="Photo (optional)" value={f.profileImage} onChange={set("profileImage")} shape="avatar" />
          <ToggleField label="Currently serving" value={isCurrent} onValueChange={setIsCurrent} />

          <SubmitButton label="Add member" onPress={submit} busy={mut.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
