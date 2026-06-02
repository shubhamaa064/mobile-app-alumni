import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createJob, updateJob, type JobInput } from "@/lib/api";
import { spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader } from "@/components/ui";
import { AdminScreen, FormField, ChipSelect, ToggleField, SubmitButton } from "@/components/admin";

const TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"].map((t) => ({ value: t, label: t }));
const CATEGORY = ["Technology", "Finance", "Education", "Healthcare", "Marketing", "Other"].map((c) => ({ value: c, label: c }));

function dateField(iso?: string | null): string {
  return iso ? String(iso).slice(0, 10) : "";
}
function toIso(field: string): string | null {
  if (!field.trim()) return null;
  const d = new Date(field.trim());
  return isNaN(d.getTime()) ? field.trim() : d.toISOString();
}

export default function JobEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const qc = useQueryClient();

  const existing = useQuery({ queryKey: ["job", id], queryFn: () => api.jobItem(id!), enabled: editing });

  const [f, setF] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  if (editing && existing.data && !hydrated) {
    const j = existing.data;
    setF({
      title: j.title ?? "",
      company: j.company ?? "",
      location: j.location ?? "",
      type: j.type ?? "Full-time",
      category: j.category ?? "Other",
      description: j.description ?? "",
      salaryRange: j.salaryRange ?? "",
      link: j.link ?? "",
      requirements: j.requirements ?? "",
      benefits: j.benefits ?? "",
      deadline: dateField(j.deadline),
    });
    setIsActive(j.isActive);
    setHydrated(true);
  }

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: (body: JobInput) => (editing ? updateJob(id!, body) : createJob(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminJobs"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      if (editing) qc.invalidateQueries({ queryKey: ["job", id] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    if (!f.title?.trim() || !f.company?.trim() || !f.location?.trim())
      return Alert.alert("Missing details", "Title, company and location are required.");
    const body: JobInput = {
      title: f.title.trim(),
      company: f.company.trim(),
      location: f.location.trim(),
      type: f.type || "Full-time",
      category: f.category || "Other",
      description: f.description?.trim() || "",
      salaryRange: f.salaryRange?.trim() || "",
      link: f.link?.trim() || "",
      requirements: f.requirements?.trim() || "",
      benefits: f.benefits?.trim() || "",
      deadline: toIso(f.deadline || ""),
      isActive,
    };
    mut.mutate(body);
  };

  return (
    <AdminScreen title={editing ? "Edit Job" : "New Job"} admin>
      {editing && existing.isLoading ? (
        <Loader label="Loading…" />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
            <FormField label="Job title" value={f.title || ""} onChangeText={set("title")} placeholder="Software Engineer" />
            <FormField label="Company" value={f.company || ""} onChangeText={set("company")} placeholder="Acme Corp" />
            <FormField label="Location" value={f.location || ""} onChangeText={set("location")} placeholder="Bengaluru / Remote" />

            <Txt variant="label" style={{ marginBottom: 6 }}>TYPE</Txt>
            <ChipSelect options={TYPES} value={f.type || "Full-time"} onChange={set("type")} />
            <Txt variant="label" style={{ marginBottom: 6 }}>CATEGORY</Txt>
            <ChipSelect options={CATEGORY} value={f.category || "Other"} onChange={set("category")} />

            <FormField label="Description" value={f.description || ""} onChangeText={set("description")} placeholder="Role overview…" multiline />
            <FormField label="Requirements (optional)" value={f.requirements || ""} onChangeText={set("requirements")} placeholder="Skills, experience…" multiline />
            <FormField label="Benefits (optional)" value={f.benefits || ""} onChangeText={set("benefits")} placeholder="Perks…" multiline />
            <FormField label="Salary range (optional)" value={f.salaryRange || ""} onChangeText={set("salaryRange")} placeholder="₹8–12 LPA" />
            <FormField label="Apply link (optional)" value={f.link || ""} onChangeText={set("link")} placeholder="https://…" autoCapitalize="none" />
            <FormField label="Deadline (optional)" value={f.deadline || ""} onChangeText={set("deadline")} placeholder="2026-07-01" autoCapitalize="none" />
            <ToggleField label="Active (visible on job board)" value={isActive} onValueChange={setIsActive} />

            <SubmitButton label={editing ? "Save changes" : "Post job"} onPress={submit} busy={mut.isPending} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </AdminScreen>
  );
}
