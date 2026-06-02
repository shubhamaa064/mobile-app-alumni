import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, createEvent, updateEvent, type EventInput } from "@/lib/api";
import { spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader } from "@/components/ui";
import { AdminScreen, FormField, ChipSelect, ToggleField, SubmitButton } from "@/components/admin";
import { ImageUploadField } from "@/components/ImageUploadField";

const STATUS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];
const CATEGORY = ["Reunion", "Workshop", "Cultural", "Sports", "Networking", "Fundraiser", "General"].map((c) => ({ value: c, label: c }));

/** Trim an ISO date down to YYYY-MM-DD for the text field. */
function dateField(iso?: string | null): string {
  return iso ? String(iso).slice(0, 10) : "";
}
/** Turn a YYYY-MM-DD field back into an ISO string the backend accepts. */
function toIso(field: string): string | null {
  if (!field.trim()) return null;
  const d = new Date(field.trim());
  return isNaN(d.getTime()) ? field.trim() : d.toISOString();
}

export default function EventEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const qc = useQueryClient();

  const existing = useQuery({ queryKey: ["event", id], queryFn: () => api.event(id!), enabled: editing });

  const [f, setF] = useState<Record<string, string>>({});
  const [isVirtual, setIsVirtual] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Prefill once the existing event loads.
  if (editing && existing.data && !hydrated) {
    const e = existing.data;
    setF({
      title: e.title ?? "",
      description: e.description ?? "",
      date: dateField(e.date),
      location: e.location ?? "",
      category: e.category ?? "General",
      status: e.status ?? "UPCOMING",
      ticketPrice: e.ticketPrice != null ? String(e.ticketPrice) : "",
      maxAttendees: e.maxAttendees != null ? String(e.maxAttendees) : "",
      imageUrl: e.imageUrl ?? "",
      organizer: e.organizer ?? "",
      registrationDeadline: dateField(e.registrationDeadline),
      tags: e.tags ?? "",
    });
    setIsVirtual(!!e.isVirtual);
    setIsPaid(e.ticketPrice != null && e.ticketPrice > 0);
    setHydrated(true);
  }

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: (body: EventInput) => (editing ? updateEvent(id!, body) : createEvent(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      if (editing) qc.invalidateQueries({ queryKey: ["event", id] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    if (!f.title?.trim()) return Alert.alert("Missing title", "Please enter an event title.");
    if (!f.date?.trim()) return Alert.alert("Missing date", "Please enter the event date (YYYY-MM-DD).");
    const price = isPaid ? Number(f.ticketPrice || 0) : 0;
    const body: EventInput = {
      title: f.title.trim(),
      description: f.description?.trim() || "",
      date: toIso(f.date) || f.date,
      location: f.location?.trim() || "",
      category: f.category || "General",
      status: f.status || "UPCOMING",
      isVirtual,
      isPaid,
      ticketPrice: isPaid ? price : null,
      maxAttendees: f.maxAttendees ? Number(f.maxAttendees) : null,
      imageUrl: f.imageUrl?.trim() || "",
      organizer: f.organizer?.trim() || "",
      registrationDeadline: toIso(f.registrationDeadline || ""),
      tags: f.tags?.trim() || "",
    };
    mut.mutate(body);
  };

  return (
    <AdminScreen title={editing ? "Edit Event" : "New Event"} admin>
      {editing && existing.isLoading ? (
        <Loader label="Loading…" />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
            <FormField label="Title" value={f.title || ""} onChangeText={set("title")} placeholder="Annual Reunion 2026" />
            <FormField label="Description" value={f.description || ""} onChangeText={set("description")} placeholder="What's the event about?" multiline />
            <FormField label="Date" value={f.date || ""} onChangeText={set("date")} placeholder="2026-06-15" autoCapitalize="none" />
            <FormField label="Location" value={f.location || ""} onChangeText={set("location")} placeholder="CTK School, Tundla" />

            <Txt variant="label" style={{ marginBottom: 6 }}>STATUS</Txt>
            <ChipSelect options={STATUS} value={f.status || "UPCOMING"} onChange={set("status")} />
            <Txt variant="label" style={{ marginBottom: 6 }}>CATEGORY</Txt>
            <ChipSelect options={CATEGORY} value={f.category || "General"} onChange={set("category")} />

            <ToggleField label="Virtual event" value={isVirtual} onValueChange={setIsVirtual} />
            <ToggleField label="Paid (requires a ticket)" value={isPaid} onValueChange={setIsPaid} />
            {isPaid ? (
              <FormField label="Ticket price (₹)" value={f.ticketPrice || ""} onChangeText={set("ticketPrice")} placeholder="500" keyboardType="numeric" />
            ) : null}

            <FormField label="Max attendees (optional)" value={f.maxAttendees || ""} onChangeText={set("maxAttendees")} placeholder="Leave blank for unlimited" keyboardType="numeric" />
            <FormField label="Registration deadline (optional)" value={f.registrationDeadline || ""} onChangeText={set("registrationDeadline")} placeholder="2026-06-10" autoCapitalize="none" />
            <FormField label="Organizer (optional)" value={f.organizer || ""} onChangeText={set("organizer")} placeholder="CTK Alumni Association" />
            <ImageUploadField label="Event image (optional)" value={f.imageUrl} onChange={set("imageUrl")} shape="banner" />
            <FormField label="Tags (comma separated)" value={f.tags || ""} onChangeText={set("tags")} placeholder="reunion, 2026" autoCapitalize="none" />

            <SubmitButton label={editing ? "Save changes" : "Create event"} onPress={submit} busy={mut.isPending} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </AdminScreen>
  );
}
