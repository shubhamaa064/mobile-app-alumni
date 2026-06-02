import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, subscribeMembership, setLanguage, type MembershipPlan, type Payment, type EventRegistration } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Chip, Loader, Ornament } from "@/components/ui";
import { formatDate } from "@/lib/format";

const LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ml", label: "മലയാളം" },
];

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user } = useAuth();

  const membership = useQuery({ queryKey: ["myMembership"], queryFn: api.myMembership, enabled: !!user });
  const payments = useQuery({ queryKey: ["myPayments"], queryFn: () => api.myPayments({ limit: 20 }), enabled: !!user });
  const registrations = useQuery({ queryKey: ["myRegistrations"], queryFn: api.myRegistrations, enabled: !!user });
  const language = useQuery({ queryKey: ["myLanguage"], queryFn: api.myLanguage, enabled: !!user });

  const subscribe = useMutation({
    mutationFn: (planId: string) => subscribeMembership(planId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["myMembership"] }),
        qc.invalidateQueries({ queryKey: ["myPayments"] }),
      ]);
      Alert.alert("Welcome aboard! 🎉", "Your membership is now active.");
    },
    onError: (e) => Alert.alert("Couldn't subscribe", e instanceof Error ? e.message : "Please try again."),
  });

  const langMut = useMutation({
    mutationFn: (code: string) => setLanguage(code),
    onSuccess: (_d, code) => {
      qc.setQueryData(["myLanguage"], { language: code });
    },
    onError: (e) => Alert.alert("Couldn't update", e instanceof Error ? e.message : "Please try again."),
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <Hero insets={insets} />
        <View style={styles.signedOut}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.muted} />
          <Txt variant="heading" center style={{ marginTop: spacing.md }}>Sign in required</Txt>
          <Txt variant="body" center color={colors.muted} style={{ marginTop: spacing.sm, maxWidth: 280 }}>
            Sign in to manage your membership, payments and registrations.
          </Txt>
          <Pressable onPress={() => router.push("/login")} style={styles.primaryBtn}>
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 15 }}>Sign In</Txt>
          </Pressable>
        </View>
      </View>
    );
  }

  const m = membership.data?.membership ?? null;
  const plans = membership.data?.plans ?? [];
  const isExpired = membership.data?.isExpired ?? false;
  const isMember = !!m && !isExpired;
  const summary = payments.data?.summary ?? [];
  const totalSpent = summary.reduce((acc, s) => acc + (s._sum.amount ?? 0), 0);
  const currentLang = language.data?.language ?? "en";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Hero insets={insets} />

        <View style={styles.body}>
          {/* ── Membership ── */}
          <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>MEMBERSHIP</Txt>
          {membership.isLoading ? (
            <Loader />
          ) : isMember && m ? (
            <View style={[styles.card, shadow.soft]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Txt variant="heading">{m.plan.name}</Txt>
                <Chip label="Active" tone="gold" icon="checkmark-circle" />
              </View>
              <Txt variant="caption" style={{ marginTop: 4 }}>
                {m.plan.isLifetime ? "Lifetime membership" : m.expiresAt ? `Valid until ${formatDate(m.expiresAt)}` : "Active"}
              </Txt>
            </View>
          ) : (
            <View>
              {isExpired ? (
                <View style={[styles.card, shadow.soft, { borderWidth: 1, borderColor: "rgba(176,65,62,0.3)" }]}>
                  <Txt variant="bodyMedium" color={colors.danger}>Your membership has expired</Txt>
                  <Txt variant="caption" style={{ marginTop: 2 }}>Renew below to keep your member benefits.</Txt>
                </View>
              ) : (
                <View style={[styles.card, shadow.soft]}>
                  <Txt variant="bodyMedium">You're not a member yet</Txt>
                  <Txt variant="caption" style={{ marginTop: 2 }}>Join to unlock member-only events and benefits.</Txt>
                </View>
              )}
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} busy={subscribe.isPending} onSubscribe={() => confirmSubscribe(p, subscribe.mutate)} />
              ))}
            </View>
          )}

          {/* ── Registrations ── */}
          <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>MY EVENT REGISTRATIONS</Txt>
          {registrations.isLoading ? (
            <Loader />
          ) : (registrations.data?.length ?? 0) > 0 ? (
            <View style={[styles.card, shadow.soft, { paddingVertical: spacing.xs }]}>
              {registrations.data!.map((r, i) => (
                <RegRow key={r.id} reg={r} last={i === registrations.data!.length - 1} />
              ))}
            </View>
          ) : (
            <EmptyRow icon="calendar-outline" text="You haven't registered for any events yet." />
          )}

          {/* ── Payments ── */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: spacing.xl, marginBottom: spacing.sm }}>
            <Txt variant="label" color={colors.goldDeep}>PAYMENT HISTORY</Txt>
            {totalSpent > 0 ? <Txt variant="caption">Total ₹{totalSpent.toLocaleString("en-IN")}</Txt> : null}
          </View>
          {payments.isLoading ? (
            <Loader />
          ) : (payments.data?.data.length ?? 0) > 0 ? (
            <View style={[styles.card, shadow.soft, { paddingVertical: spacing.xs }]}>
              {payments.data!.data.map((pay, i) => (
                <PayRow key={pay.id} pay={pay} last={i === payments.data!.data.length - 1} />
              ))}
            </View>
          ) : (
            <EmptyRow icon="receipt-outline" text="No payments yet." />
          )}

          {/* ── Language ── */}
          <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>PREFERRED LANGUAGE</Txt>
          <View style={[styles.card, shadow.soft]}>
            {LANGS.map((l, i) => {
              const active = currentLang === l.code;
              return (
                <Pressable key={l.code} style={[styles.langRow, i < LANGS.length - 1 && styles.divider]} onPress={() => langMut.mutate(l.code)} disabled={langMut.isPending}>
                  <Txt variant="bodyMedium" color={active ? colors.goldDeep : colors.ink}>{l.label}</Txt>
                  {active ? <Ionicons name="checkmark-circle" size={20} color={colors.gold} /> : <Ionicons name="ellipse-outline" size={20} color={colors.line} />}
                </Pressable>
              );
            })}
          </View>

          <Ornament style={{ marginTop: spacing.xl }} />
        </View>
      </ScrollView>
    </View>
  );
}

function confirmSubscribe(plan: MembershipPlan, mutate: (id: string) => void) {
  Alert.alert(
    `Join ${plan.name}?`,
    `${plan.price > 0 ? `₹${plan.price}` : "Free"}${plan.isLifetime ? " · Lifetime" : ""}\n\nThis is a demo subscription (no real payment is processed).`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => mutate(plan.id) },
    ],
  );
}

function PlanCard({ plan, busy, onSubscribe }: { plan: MembershipPlan; busy: boolean; onSubscribe: () => void }) {
  return (
    <View style={[styles.planCard, shadow.soft]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Txt variant="bodyMedium">{plan.name}</Txt>
          {plan.description ? <Txt variant="caption" style={{ marginTop: 2 }}>{plan.description}</Txt> : null}
          <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.sm }}>
            {plan.isLifetime ? <Chip label="Lifetime" tone="gold" /> : <Chip label="Annual" tone="neutral" />}
            {plan.maxAge ? <Chip label={`Up to ${plan.maxAge} yrs`} tone="navy" /> : null}
          </View>
        </View>
        <Txt style={{ fontFamily: fonts.display, color: colors.goldDeep, fontSize: 22 }}>{plan.price > 0 ? `₹${plan.price}` : "Free"}</Txt>
      </View>
      <Pressable style={styles.joinBtn} onPress={onSubscribe} disabled={busy}>
        {busy ? <ActivityIndicator color={colors.navyDeep} /> : (
          <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 14 }}>Join this plan</Txt>
        )}
      </Pressable>
    </View>
  );
}

function RegRow({ reg, last }: { reg: EventRegistration; last?: boolean }) {
  return (
    <Pressable style={[styles.itemRow, !last && styles.divider]} onPress={() => router.push(`/event/${reg.eventId}`)}>
      <View style={styles.itemIcon}>
        <Ionicons name="ticket-outline" size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Txt variant="bodyMedium" numberOfLines={1}>{reg.event.title}</Txt>
        <Txt variant="caption">{formatDate(reg.event.date)}{reg.event.location ? ` · ${reg.event.location}` : ""}</Txt>
      </View>
      <Chip label={reg.status} tone={reg.status === "CONFIRMED" ? "gold" : "neutral"} />
    </Pressable>
  );
}

function PayRow({ pay, last }: { pay: Payment; last?: boolean }) {
  return (
    <View style={[styles.itemRow, !last && styles.divider]}>
      <View style={styles.itemIcon}>
        <Ionicons name="card-outline" size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Txt variant="bodyMedium" numberOfLines={1}>{pay.paidFor || pay.type}</Txt>
        <Txt variant="caption">{formatDate(pay.createdAt)} · {pay.type}</Txt>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Txt variant="bodyMedium">₹{pay.amount.toLocaleString("en-IN")}</Txt>
        <Txt variant="caption" color={pay.status === "SUCCESS" ? colors.success : colors.muted}>{pay.status}</Txt>
      </View>
    </View>
  );
}

function EmptyRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={[styles.card, shadow.soft, { flexDirection: "row", alignItems: "center" }]}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <Txt variant="caption" style={{ marginLeft: spacing.sm, flex: 1 }}>{text}</Txt>
    </View>
  );
}

function Hero({ insets }: { insets: { top: number } }) {
  return (
    <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <Txt variant="heading" color={colors.white}>My Account</Txt>
        <View style={{ width: 38 }} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xl, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  planCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  joinBtn: { marginTop: spacing.md, backgroundColor: colors.goldSoft, paddingVertical: 12, borderRadius: radius.md, alignItems: "center" },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  itemIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: "rgba(200,162,75,0.16)", alignItems: "center", justifyContent: "center" },
  langRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  signedOut: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  primaryBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.pill, ...shadow.lift },
});
