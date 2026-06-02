import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api, type DashboardStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Avatar } from "@/components/Avatar";
import { Loader, Ornament } from "@/components/ui";
import { relativeTime, initials } from "@/lib/format";

function isStaff(role?: string): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const allowed = isStaff(user?.role);
  const stats = useQuery({ queryKey: ["dashboardStats"], queryFn: api.dashboardStats, enabled: allowed });

  if (!allowed) {
    return (
      <View style={styles.container}>
        <Hero insets={insets} role={user?.role} />
        <View style={styles.denied}>
          <Ionicons name="shield-outline" size={56} color={colors.muted} />
          <Txt variant="heading" center style={{ marginTop: spacing.md }}>Staff access only</Txt>
          <Txt variant="body" center color={colors.muted} style={{ marginTop: spacing.sm, maxWidth: 280 }}>
            This dashboard is available to administrators and moderators of the CTK Alumni Association.
          </Txt>
          <Pressable onPress={goBack} style={styles.primaryBtn}>
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep }}>Go back</Txt>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Hero insets={insets} role={user?.role} />
        {stats.isLoading ? (
          <Loader label="Crunching numbers…" />
        ) : stats.data ? (
          <Body data={stats.data} admin={user?.role === "ADMIN"} />
        ) : (
          <View style={styles.denied}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
            <Txt variant="body" color={colors.muted} center style={{ marginTop: spacing.md }}>
              Couldn't load statistics. Pull to retry.
            </Txt>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Body({ data, admin }: { data: DashboardStats; admin: boolean }) {
  const cards = [
    { icon: "people" as const, label: "Total Alumni", value: data.totalAlumni, tone: colors.navy },
    { icon: "calendar" as const, label: "Events", value: data.totalEvents, sub: `${data.upcomingEvents} upcoming`, tone: colors.gold },
    { icon: "briefcase" as const, label: "Active Jobs", value: data.totalJobs, tone: colors.maroon },
    { icon: "heart" as const, label: "Donations", value: `₹${Number(data.totalDonations).toLocaleString("en-IN")}`, tone: colors.success },
  ];
  const maxGrowth = Math.max(1, ...data.memberGrowth.map((g) => g.count));
  const maxAttend = Math.max(1, ...data.eventAttendance.map((e) => e.attendees));

  return (
    <View style={styles.body}>
      {/* Stat cards */}
      <View style={styles.statGrid}>
        {cards.map((c) => (
          <View key={c.label} style={[styles.statCard, shadow.soft]}>
            <View style={[styles.statIcon, { backgroundColor: c.tone }]}>
              <Ionicons name={c.icon} size={18} color={colors.white} />
            </View>
            <Txt style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginTop: spacing.sm }}>{c.value}</Txt>
            <Txt variant="caption">{c.label}</Txt>
            {c.sub ? <Txt variant="caption" color={colors.goldDeep} style={{ marginTop: 1 }}>{c.sub}</Txt> : null}
          </View>
        ))}
      </View>

      {/* Manage content */}
      <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>MANAGE CONTENT</Txt>
      <View style={[styles.card, shadow.soft, { paddingVertical: spacing.xs }]}>
        <ManageRow icon="people-outline" label="Members" sub="Verify, edit roles, remove" onPress={() => router.push("/admin/members")} divider />
        <ManageRow icon="calendar-outline" label="Events" sub="Create & manage events" onPress={() => router.push("/admin/events")} divider />
        <ManageRow icon="newspaper-outline" label="News & Wall of Fame" sub="Publish stories" onPress={() => router.push("/admin/news")} divider />
        <ManageRow icon="briefcase-outline" label="Jobs" sub="Career postings" onPress={() => router.push("/admin/jobs")} divider />
        <ManageRow icon="images-outline" label="Gallery" sub="Photos & videos" onPress={() => router.push("/admin/gallery")} divider />
        <ManageRow icon="albums-outline" label="Albums" sub="Organise photo collections" onPress={() => router.push("/admin/albums")} divider />
        <ManageRow icon="clipboard-outline" label="Surveys" sub="Create & view feedback" onPress={() => router.push("/admin/surveys")} divider />
        <ManageRow icon="people-circle-outline" label="Leadership" sub="Office bearers" onPress={() => router.push("/admin/leadership")} divider />
        <ManageRow icon="school-outline" label="Principals" sub="Heritage records" onPress={() => router.push("/admin/principals")} />
      </View>

      {/* Operations — ADMIN only */}
      {admin ? (
        <>
          <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>OPERATIONS</Txt>
          <View style={[styles.card, shadow.soft, { paddingVertical: spacing.xs }]}>
            <ManageRow icon="notifications-outline" label="Send Notification" sub="Broadcast a push alert" onPress={() => router.push("/admin/notify")} divider />
            <ManageRow icon="card-outline" label="Payments" sub="Revenue & records" onPress={() => router.push("/admin/payments")} divider />
            <ManageRow icon="heart-outline" label="Donations" sub="Fundraising campaigns" onPress={() => router.push("/admin/donations")} divider />
            <ManageRow icon="settings-outline" label="Site Settings" sub="Name, contact, branding" onPress={() => router.push("/admin/settings")} divider />
            <ManageRow icon="document-text-outline" label="Audit Log" sub="Recent admin activity" onPress={() => router.push("/admin/audit-logs")} />
          </View>
        </>
      ) : null}

      {/* Member growth */}
      <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>NEW MEMBERS (6 MONTHS)</Txt>
      <View style={[styles.card, shadow.soft]}>
        <View style={styles.chartRow}>
          {data.memberGrowth.map((g) => (
            <View key={g.month} style={styles.barCol}>
              <Txt variant="caption" color={colors.ink} style={{ fontFamily: fonts.bodySemi, marginBottom: 4 }}>{g.count}</Txt>
              <View style={[styles.bar, { height: 12 + (g.count / maxGrowth) * 90, backgroundColor: colors.gold }]} />
              <Txt variant="caption" style={{ marginTop: 4, fontSize: 10 }}>{g.month}</Txt>
            </View>
          ))}
        </View>
      </View>

      {/* Event attendance */}
      {data.eventAttendance.length > 0 ? (
        <>
          <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>RECENT EVENT ATTENDANCE</Txt>
          <View style={[styles.card, shadow.soft]}>
            {data.eventAttendance.map((e) => (
              <View key={e.event} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Txt variant="caption" color={colors.ink} numberOfLines={1} style={{ flex: 1, marginRight: spacing.sm }}>{e.event}</Txt>
                  <Txt variant="caption" color={colors.goldDeep} style={{ fontFamily: fonts.bodySemi }}>{e.attendees}</Txt>
                </View>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${(e.attendees / maxAttend) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Batch distribution */}
      {data.batchDistribution.length > 0 ? (
        <>
          <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>BATCH DISTRIBUTION</Txt>
          <View style={[styles.card, shadow.soft, { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }]}>
            {data.batchDistribution.map((b) => (
              <View key={b.batch} style={styles.batchPill}>
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navy, fontSize: 15 }}>{b.count}</Txt>
                <Txt variant="caption">{b.batch}</Txt>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Recent members */}
      <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>RECENT MEMBERS</Txt>
      <View style={[styles.card, shadow.soft, { paddingVertical: spacing.xs }]}>
        {data.recentMembers.length > 0 ? data.recentMembers.map((m, i) => (
          <Pressable key={m.id} style={[styles.memberRow, i < data.recentMembers.length - 1 && styles.divider]} onPress={() => router.push(`/alumni/${m.id}`)}>
            <Avatar uri={m.image} initials={initials(m.name.split(" ")[0], m.name.split(" ")[1])} size={42} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="bodyMedium" numberOfLines={1}>{m.name || m.email}</Txt>
              <Txt variant="caption" numberOfLines={1}>
                {[m.profession, m.company, m.country].filter(Boolean).join(" · ") || "New member"}
              </Txt>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        )) : <Txt variant="caption" color={colors.muted} style={{ padding: spacing.md }}>No recent members.</Txt>}
      </View>

      {/* Activity feed */}
      {data.recentActivity.length > 0 ? (
        <>
          <Txt variant="label" color={colors.goldDeep} style={styles.sectionLabel}>RECENT ACTIVITY</Txt>
          <View style={[styles.card, shadow.soft]}>
            {data.recentActivity.map((a) => (
              <View key={a.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Txt variant="caption" color={colors.ink}>{a.message}</Txt>
                  <Txt variant="caption" style={{ fontSize: 10 }}>{relativeTime(new Date(a.time).getTime())}</Txt>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Ornament style={{ marginTop: spacing.xl }} />
    </View>
  );
}

function ManageRow({ icon, label, sub, onPress, divider }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; onPress: () => void; divider?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.manageRow, divider && styles.divider]}>
      <View style={styles.manageIcon}>
        <Ionicons name={icon} size={18} color={colors.navy} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Txt variant="bodyMedium">{label}</Txt>
        <Txt variant="caption">{sub}</Txt>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function Hero({ insets, role }: { insets: { top: number }; role?: string }) {
  return (
    <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <Txt variant="heading" color={colors.white}>Dashboard</Txt>
        <View style={{ width: 38 }} />
      </View>
      {role ? (
        <View style={styles.roleChip}>
          <Ionicons name="shield-checkmark" size={13} color={colors.goldSoft} />
          <Txt variant="caption" color={colors.goldSoft} style={{ marginLeft: 5 }}>
            {role === "ADMIN" ? "Administrator" : "Moderator"}
          </Txt>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  roleChip: { flexDirection: "row", alignItems: "center", alignSelf: "center", marginTop: spacing.sm, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  body: { padding: spacing.lg },
  denied: { alignItems: "center", justifyContent: "center", padding: spacing.xxxl },
  primaryBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.pill },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { width: "47%", flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  statIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  manageRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  manageIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: "rgba(20,33,61,0.07)", alignItems: "center", justifyContent: "center" },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  chartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 140 },
  barCol: { flex: 1, alignItems: "center" },
  bar: { width: 22, borderRadius: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.paperDim, marginTop: 4, overflow: "hidden" },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: colors.navy },
  batchPill: { backgroundColor: colors.paperDim, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: "center", minWidth: 64 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  activityRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: spacing.xs, gap: spacing.sm },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginTop: 5 },
});
