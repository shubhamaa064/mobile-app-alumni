import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, updateSettings } from "@/lib/api";
import { spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader } from "@/components/ui";
import { AdminScreen, FormField, SubmitButton } from "@/components/admin";
import { ImageUploadField } from "@/components/ImageUploadField";

const FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "name", label: "Association name", placeholder: "CTK Alumni Association" },
  { key: "tagline", label: "Tagline", placeholder: "Christ The King, Tundla" },
  { key: "contactEmail", label: "Contact email", placeholder: "alumni@ctk.edu" },
  { key: "phone", label: "Contact phone", placeholder: "+91…" },
  { key: "address", label: "Address", placeholder: "School address", multiline: true },
];

export default function SettingsAdmin() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["siteSettings"], queryFn: api.siteSettings });

  const [f, setF] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  if (settings.data && !hydrated) {
    const s = settings.data.settings || {};
    const init: Record<string, string> = {};
    for (const { key } of FIELDS) init[key] = s[key] != null ? String(s[key]) : "";
    init.logoUrl = s.logoUrl != null ? String(s.logoUrl) : "";
    setF(init);
    setHydrated(true);
  }

  const mut = useMutation({
    mutationFn: () => {
      const data: Record<string, unknown> = {};
      for (const { key } of FIELDS) data[key] = f[key]?.trim() ?? "";
      data.logoUrl = f.logoUrl?.trim() ?? "";
      return updateSettings("general", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siteSettings"] });
      qc.invalidateQueries({ queryKey: ["siteInfo"] });
      Alert.alert("Saved", "Site settings updated.");
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  return (
    <AdminScreen title="Site Settings" admin>
      {settings.isLoading ? (
        <Loader label="Loading settings…" />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
            <Txt variant="caption" color={undefined} style={{ marginBottom: spacing.md }}>
              These appear across the app and public website.
            </Txt>
            <ImageUploadField
              label="Logo"
              value={f.logoUrl}
              onChange={(url) => setF((p) => ({ ...p, logoUrl: url }))}
              shape="banner"
              hint="Shown on the public website header."
            />
            {FIELDS.map((field) => (
              <FormField
                key={field.key}
                label={field.label}
                value={f[field.key] || ""}
                onChangeText={set(field.key)}
                placeholder={field.placeholder}
                multiline={field.multiline}
                autoCapitalize={field.key === "contactEmail" || field.key === "logoUrl" ? "none" : "sentences"}
              />
            ))}
            <SubmitButton label="Save settings" onPress={() => mut.mutate()} busy={mut.isPending} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </AdminScreen>
  );
}
