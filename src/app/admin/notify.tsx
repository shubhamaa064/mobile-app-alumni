import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { pushSubscriberCount, sendPushBroadcast } from "@/lib/api";
import { colors, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { AdminScreen, FormField, SubmitButton } from "@/components/admin";

const DEST = [
  { value: "/", label: "Home", hint: "Open the app home" },
  { value: "/events", label: "Events", hint: "Open the events list" },
  { value: "/news", label: "News", hint: "Open news & stories" },
];

export default function NotifyAdmin() {
  const subs = useQuery({ queryKey: ["pushSubscribers"], queryFn: pushSubscriberCount });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");

  const mut = useMutation({
    mutationFn: () => sendPushBroadcast({ title: title.trim(), body: body.trim() || undefined, url }),
    onSuccess: (res) => {
      const sent = res.sent ?? 0;
      Alert.alert(
        "Notification sent",
        res.message || `Delivered to ${sent} subscriber${sent === 1 ? "" : "s"}${res.failed ? ` · ${res.failed} failed` : ""}.`,
      );
      setTitle("");
      setBody("");
    },
    onError: (e: Error) => Alert.alert("Send failed", e.message),
  });

  const submit = () => {
    if (!title.trim()) return Alert.alert("Missing title", "Please enter a notification title.");
    Alert.alert("Send to everyone?", "This pushes a notification to all subscribers right now.", [
      { text: "Cancel", style: "cancel" },
      { text: "Send", onPress: () => mut.mutate() },
    ]);
  };

  return (
    <AdminScreen title="Send Notification" admin>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
          {/* Subscriber count card */}
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.line }}>
            <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="people" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="heading">{subs.isLoading ? "…" : subs.data?.subscribers ?? 0}</Txt>
              <Txt variant="caption" color={colors.muted}>Active subscribers</Txt>
            </View>
          </View>

          {/* Live preview */}
          <Txt variant="label" color={colors.inkSoft} style={{ marginBottom: 6 }}>PREVIEW</Txt>
          <View style={{ flexDirection: "row", backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.line }}>
            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="school" size={18} color={colors.navyDeep} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="bodyMedium" numberOfLines={1}>{title.trim() || "Notification title"}</Txt>
              <Txt variant="caption" color={colors.muted} numberOfLines={2}>{body.trim() || "Your message preview appears here."}</Txt>
            </View>
          </View>

          <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Reunion 2025 is live!" />
          <FormField label="Message" value={body} onChangeText={setBody} placeholder="Tap to see the details and RSVP." multiline />

          <Txt variant="label" color={colors.inkSoft} style={{ marginBottom: 6 }}>OPENS</Txt>
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            {DEST.map((d) => {
              const active = d.value === url;
              return (
                <View
                  key={d.value}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: active ? colors.goldSoft : colors.card,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: active ? colors.gold : colors.line,
                  }}
                  onTouchEnd={() => setUrl(d.value)}
                >
                  <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={18} color={active ? colors.navyDeep : colors.muted} />
                  <View style={{ marginLeft: spacing.md }}>
                    <Txt variant="bodyMedium">{d.label}</Txt>
                    <Txt variant="caption" color={colors.muted}>{d.hint}</Txt>
                  </View>
                </View>
              );
            })}
          </View>

          <SubmitButton label="Send to all subscribers" onPress={submit} busy={mut.isPending} />
          <Txt variant="caption" color={colors.muted} center style={{ marginTop: spacing.md }}>
            Sent immediately to every device that opted in to notifications.
          </Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
