import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, Linking, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, registerEvent, unregisterEvent, eventIcsUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Chip, Loader, Ornament } from "@/components/ui";
import { formatDate, titleCase, splitTags } from "@/lib/format";
import { requestPermission, scheduleEventReminder } from "@/lib/notifications";

const FALLBACK = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1000&q=70";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: event, isLoading, isError } = useQuery({ queryKey: ["event", id], queryFn: () => api.event(id) });
  const registrations = useQuery({ queryKey: ["myRegistrations"], queryFn: api.myRegistrations, enabled: !!user });
  const [reminded, setReminded] = useState(false);

  const isRegistered = !!registrations.data?.some((r) => r.eventId === id);

  const registerMut = useMutation({
    mutationFn: () => registerEvent(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["myRegistrations"] }),
        qc.invalidateQueries({ queryKey: ["event", id] }),
      ]);
      Alert.alert("You're in! 🎉", "Your registration is confirmed. We've noted you down.");
    },
    onError: (e) => Alert.alert("Couldn't register", e instanceof Error ? e.message : "Please try again."),
  });

  const cancelMut = useMutation({
    mutationFn: () => unregisterEvent(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["myRegistrations"] }),
        qc.invalidateQueries({ queryKey: ["event", id] }),
      ]);
    },
    onError: (e) => Alert.alert("Couldn't cancel", e instanceof Error ? e.message : "Please try again."),
  });

  if (isLoading) return <View style={styles.container}><Loader label="Loading event…" /></View>;

  if (isError || !event || !event.title) {
    return (
      <View style={[styles.container, styles.center]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { top: insets.top + 8, backgroundColor: colors.navy }]} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <Ionicons name="calendar-outline" size={64} color={colors.muted} />
        <Txt variant="heading" center style={{ marginTop: spacing.md }}>
          Event unavailable
        </Txt>
        <Txt variant="body" center color={colors.muted} style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          We couldn't load this event. Please check your connection and try again.
        </Txt>
        <Pressable onPress={goBack} style={styles.emptyBtn}>
          <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 14 }}>Go back</Txt>
        </Pressable>
      </View>
    );
  }

  const past = event.status === "past";
  const free = !event.ticketPrice || event.ticketPrice === 0;

  const onRemind = async () => {
    const { granted } = await requestPermission();
    if (!granted) return;
    await scheduleEventReminder(String(event.id), event.title, event.date);
    setReminded(true);
  };

  const onRegister = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isRegistered) {
      Alert.alert("Cancel registration?", "You can register again later if you change your mind.", [
        { text: "Keep my spot", style: "cancel" },
        { text: "Cancel registration", style: "destructive", onPress: () => cancelMut.mutate() },
      ]);
    } else {
      registerMut.mutate();
    }
  };

  const onAddToCalendar = () => Linking.openURL(eventIcsUrl(String(event.id)));
  const busy = registerMut.isPending || cancelMut.isPending;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: event.imageUrl || FALLBACK }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          <LinearGradient colors={gradients.scrim} style={StyleSheet.absoluteFill} />
          <Pressable onPress={goBack} style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
          <View style={styles.heroText}>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
              <Chip label={titleCase(event.category)} tone="gold" />
              <Chip label={past ? "Memory" : "Upcoming"} tone="ghost" icon={past ? "time-outline" : "sparkles"} />
            </View>
            <Txt variant="title" color={colors.white}>
              {event.title}
            </Txt>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.infoCard, shadow.soft]}>
            <InfoRow icon="calendar" label="When" value={formatDate(event.date) + (event.endDate && event.endDate !== event.date ? ` – ${formatDate(event.endDate)}` : "")} />
            <InfoRow icon="location" label="Where" value={event.location || (event.isVirtual ? "Online event" : "Christ The King Campus")} />
            {event.organizer ? <InfoRow icon="person" label="Hosted by" value={event.organizer} /> : null}
            <InfoRow icon="pricetag" label="Entry" value={free ? "Free to attend" : `₹${event.ticketPrice}`} last />
          </View>

          <Txt variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
            About this gathering
          </Txt>
          <Txt variant="body">{event.description}</Txt>

          {splitTags(event.tags).length > 0 ? (
            <View style={styles.tagRow}>
              {splitTags(event.tags).map((t) => (
                <Chip key={t} label={titleCase(t)} tone="neutral" />
              ))}
            </View>
          ) : null}

          <Ornament style={{ marginTop: spacing.xxl }} />
        </View>
      </ScrollView>

      {!past ? (
        <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
          {isRegistered ? (
            <View style={styles.registeredBanner}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Txt style={{ fontFamily: fonts.bodySemi, color: colors.success, fontSize: 13, marginLeft: 6 }}>
                You're registered for this event
              </Txt>
            </View>
          ) : null}
          <View style={styles.ctaRow}>
            <Pressable
              style={[styles.remindBtn, (reminded || isRegistered) && styles.remindBtnDone]}
              onPress={isRegistered ? onAddToCalendar : onRemind}
              disabled={!isRegistered && reminded}
            >
              <Ionicons
                name={isRegistered ? "calendar-outline" : reminded ? "checkmark-circle" : "notifications-outline"}
                size={18}
                color={isRegistered ? colors.navy : reminded ? colors.success : colors.navy}
              />
              <Txt style={{ fontFamily: fonts.bodySemi, color: reminded && !isRegistered ? colors.success : colors.navy, fontSize: 13.5, marginLeft: 6 }}>
                {isRegistered ? "Add to calendar" : reminded ? "Reminder set" : "Remind me"}
              </Txt>
            </Pressable>
            <Pressable style={[styles.ctaBtn, isRegistered && styles.ctaCancel]} onPress={onRegister} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={isRegistered ? colors.danger : colors.navyDeep} />
              ) : (
                <>
                  <Ionicons name={isRegistered ? "close-circle" : "ticket"} size={18} color={isRegistered ? colors.danger : colors.navyDeep} />
                  <Txt style={{ fontFamily: fonts.bodyBold, color: isRegistered ? colors.danger : colors.navyDeep, fontSize: 15, marginLeft: 8 }}>
                    {isRegistered ? "Cancel" : free ? "Register" : `Register · ₹${event.ticketPrice}`}
                  </Txt>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.gold} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Txt variant="label" color={colors.muted}>
          {label.toUpperCase()}
        </Txt>
        <Txt variant="bodyMedium" style={{ marginTop: 1 }}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill },
  hero: { height: 300, justifyContent: "flex-end" },
  backBtn: {
    position: "absolute",
    left: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(12,23,48,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { padding: spacing.lg },
  body: { padding: spacing.lg, marginTop: -spacing.lg, backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  infoCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(200,162,75,0.16)", alignItems: "center", justifyContent: "center" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.lg },
  cta: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  remindBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  remindBtnDone: { borderColor: colors.success, backgroundColor: "rgba(60,122,87,0.08)" },
  ctaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, paddingVertical: 15, borderRadius: radius.md },
  ctaCancel: { backgroundColor: "rgba(176,65,62,0.12)", borderWidth: 1.5, borderColor: colors.danger },
  registeredBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingBottom: spacing.sm },
});
