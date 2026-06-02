import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api, type Address, type AlumniUser } from "@/lib/api";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Avatar } from "@/components/Avatar";
import { Chip, Loader, Ornament } from "@/components/ui";
import { initials, splitTags, formatMonthYear } from "@/lib/format";

type Tab = "overview" | "education" | "experience" | "skills" | "contact";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

function formatAddress(a?: Address | null): string {
  if (!a) return "";
  return [a.street, a.landmark, a.city, a.state, a.pincode, a.country].filter(Boolean).join(", ");
}

export default function AlumnusDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError } = useQuery({ queryKey: ["alumnus", id], queryFn: () => api.alumnus(id) });
  const [tab, setTab] = useState<Tab>("overview");
  const p = data?.alumniProfile;

  if (isLoading) return <View style={styles.container}><Loader label="Loading profile…" /></View>;

  if (isError || !p) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
        </LinearGradient>
        <View style={styles.empty}>
          <Ionicons name="person-circle-outline" size={64} color={colors.muted} />
          <Txt variant="heading" center style={{ marginTop: spacing.md }}>
            Profile unavailable
          </Txt>
          <Txt variant="body" center color={colors.muted} style={{ marginTop: spacing.sm, maxWidth: 300 }}>
            {isError
              ? "We couldn't load this profile. Please check your connection and try again."
              : "This member hasn't completed their alumni profile yet."}
          </Txt>
          <Pressable onPress={goBack} style={styles.emptyBtn}>
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 14 }}>Go back</Txt>
          </Pressable>
        </View>
      </View>
    );
  }

  const skills = splitTags(p.skills);
  const work = p.workExperiences ?? [];
  const education = p.education ?? [];
  const membership = data?.memberships?.[0] ?? null;
  const city = p.currentAddress?.city || p.currentAddress?.state || p.country;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* ── Hero ── */}
        <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
          <View style={{ alignItems: "center", marginTop: spacing.sm }}>
            <Avatar uri={p.imageUrl} initials={initials(p.firstName, p.lastName)} size={104} />
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
              <Txt variant="title" color={colors.white}>
                {p.firstName} {p.lastName}
              </Txt>
              {p.isVerified ? <Ionicons name="checkmark-circle" size={20} color={colors.gold} style={{ marginLeft: 6 }} /> : null}
            </View>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              {p.isVerified ? <Chip label="Verified" tone="gold" icon="checkmark-circle" /> : null}
              <Chip label={data?.role === "ADMIN" ? "Admin" : "Alumni"} tone="ghost" />
            </View>
            {p.profession ? (
              <Txt variant="subtitle" color={colors.goldSoft} center style={{ fontFamily: fonts.displayItalic, marginTop: 6 }}>
                {p.profession}{p.company ? ` at ${p.company}` : ""}
              </Txt>
            ) : null}
            <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.md, flexWrap: "wrap", justifyContent: "center" }}>
              {p.batchYear ? <Chip label={`Batch of ${p.batchYear}`} tone="ghost" icon="school-outline" /> : null}
              {city ? <Chip label={city} tone="ghost" icon="location-outline" /> : null}
            </View>
          </View>
        </LinearGradient>

        {/* ── Tab bar (sticky) ── */}
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
            {TABS.map((t) => (
              <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]}>
                <Txt style={{ fontFamily: tab === t.id ? fonts.bodyBold : fonts.bodyMedium, color: tab === t.id ? colors.navyDeep : colors.muted, fontSize: 13.5 }}>
                  {t.label}
                </Txt>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Tab content ── */}
        <View style={styles.body}>
          {tab === "overview" ? <Overview p={p} data={data} membership={membership} skills={skills} onSeeAll={setTab} /> : null}
          {tab === "education" ? <Timeline icon="school-outline" rows={education.map((e) => ({
            id: e.id,
            title: `${e.degree}${e.fieldOfStudy ? `, ${e.fieldOfStudy}` : ""}`,
            subtitle: e.institution,
            dates: `${formatMonthYear(e.startDate) || "—"}${e.endDate ? ` – ${formatMonthYear(e.endDate)}` : " – Present"}`,
            description: e.description,
          }))} emptyIcon="school-outline" emptyText="No education history added yet." /> : null}
          {tab === "experience" ? <Timeline icon="briefcase-outline" rows={work.map((w) => ({
            id: w.id,
            title: w.title,
            subtitle: w.company,
            dates: `${formatMonthYear(w.startDate) || "—"} – ${w.isCurrent ? "Present" : formatMonthYear(w.endDate) || "—"}`,
            description: w.description,
            current: w.isCurrent,
          }))} emptyIcon="briefcase-outline" emptyText="No work experience added yet." /> : null}
          {tab === "skills" ? (
            skills.length > 0 ? (
              <View style={[styles.card, shadow.soft]}>
                <Txt variant="label" color={colors.goldDeep}>SKILLS</Txt>
                <View style={styles.tagRow}>
                  {skills.map((s) => <Chip key={s} label={s} tone="navy" />)}
                </View>
              </View>
            ) : <EmptyBlock icon="layers-outline" text="No skills added yet." />
          ) : null}
          {tab === "contact" ? <Contact p={p} email={data?.email} /> : null}

          <Ornament style={{ marginTop: spacing.xl }} />
          <Txt variant="caption" center style={{ marginTop: spacing.md }}>
            A proud member of the CTK family
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Overview tab ── */
function Overview({ p, data, membership, skills, onSeeAll }: {
  p: NonNullable<AlumniUser["alumniProfile"]>;
  data?: AlumniUser;
  membership: { status: string; expiresAt: string | null; plan: { name: string } } | null;
  skills: string[];
  onSeeAll: (t: Tab) => void;
}) {
  const current = p.workExperiences?.[0];
  const memberSince = data?.createdAt ? new Date(data.createdAt).getFullYear() : null;
  const quickInfo: { label: string; value: string }[] = [
    { label: "Batch Year", value: p.batchYear ? String(p.batchYear) : "—" },
    { label: "Profession", value: p.profession || "—" },
    { label: "Company", value: p.company || "—" },
    { label: "City", value: p.currentAddress?.city || p.country || "—" },
    { label: "State", value: p.currentAddress?.state || "—" },
    { label: "Country", value: p.currentAddress?.country || p.country || "—" },
    { label: "Member Since", value: memberSince ? String(memberSince) : "—" },
    { label: "Status", value: p.isVerified ? "Verified" : "Member" },
  ];

  return (
    <View>
      {/* About */}
      <View style={[styles.card, shadow.soft]}>
        <Txt variant="label" color={colors.goldDeep}>ABOUT</Txt>
        <Txt variant="body" color={p.bio ? colors.ink : colors.muted} style={{ marginTop: 6, fontStyle: p.bio ? "normal" : "italic" }}>
          {p.bio || "No bio added yet."}
        </Txt>
      </View>

      {/* Current position */}
      {current ? (
        <View style={[styles.card, shadow.soft]}>
          <Txt variant="label" color={colors.goldDeep}>CURRENT POSITION</Txt>
          <View style={[styles.timelineRow, { marginTop: spacing.md }]}>
            <View style={styles.iconBox}>
              <Ionicons name="business-outline" size={18} color={colors.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="bodyMedium">{current.title}</Txt>
              <Txt variant="caption" color={colors.goldDeep}>{current.company}</Txt>
              <Txt variant="caption" style={{ marginTop: 1 }}>
                {formatMonthYear(current.startDate) || "—"} – {current.isCurrent ? "Present" : formatMonthYear(current.endDate) || "—"}
              </Txt>
              {current.description ? <Txt variant="caption" style={{ marginTop: 4 }}>{current.description}</Txt> : null}
            </View>
          </View>
          {(p.workExperiences?.length ?? 0) > 1 ? (
            <Pressable onPress={() => onSeeAll("experience")} style={{ marginTop: spacing.sm }}>
              <Txt style={{ fontFamily: fonts.bodySemi, color: colors.goldDeep, fontSize: 12.5 }}>
                View all {p.workExperiences!.length} positions →
              </Txt>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Address */}
      {(formatAddress(p.currentAddress) || formatAddress(p.permanentAddress)) ? (
        <View style={[styles.card, shadow.soft]}>
          <Txt variant="label" color={colors.goldDeep}>ADDRESS</Txt>
          <AddressBlock label="Current address" addr={p.currentAddress} />
          {!p.sameAddress ? <AddressBlock label="Permanent address" addr={p.permanentAddress} /> : null}
        </View>
      ) : null}

      {/* Quick info */}
      <View style={[styles.card, shadow.soft]}>
        <Txt variant="label" color={colors.goldDeep}>QUICK INFO</Txt>
        <View style={{ marginTop: spacing.sm }}>
          {quickInfo.map((q, i) => (
            <View key={q.label} style={[styles.infoRow, i < quickInfo.length - 1 && styles.infoDivider]}>
              <Txt variant="caption" color={colors.muted}>{q.label}</Txt>
              <Txt variant="caption" color={q.label === "Status" && p.isVerified ? colors.gold : colors.ink} style={{ fontFamily: fonts.bodySemi, flexShrink: 1, textAlign: "right" }}>
                {q.value}
              </Txt>
            </View>
          ))}
        </View>
      </View>

      {/* Membership */}
      {membership ? (
        <View style={[styles.card, shadow.soft]}>
          <Txt variant="label" color={colors.goldDeep}>MEMBERSHIP</Txt>
          <Txt variant="bodyMedium" style={{ marginTop: 6 }}>{membership.plan.name}</Txt>
          <View style={{ flexDirection: "row", marginTop: 6 }}>
            <Chip label={membership.status} tone={membership.status === "ACTIVE" ? "gold" : "neutral"} />
          </View>
          {membership.expiresAt ? (
            <Txt variant="caption" style={{ marginTop: 6 }}>Expires {formatMonthYear(membership.expiresAt)}</Txt>
          ) : null}
        </View>
      ) : null}

      {/* Membership ID */}
      {data?.membershipId ? (
        <View style={[styles.card, shadow.soft]}>
          <Txt variant="label" color={colors.goldDeep}>MEMBERSHIP ID</Txt>
          <Txt variant="bodyMedium" style={{ marginTop: 6, fontFamily: fonts.bodySemi }}>{data.membershipId}</Txt>
        </View>
      ) : null}

      {/* Skills preview */}
      {skills.length > 0 ? (
        <View style={[styles.card, shadow.soft]}>
          <Txt variant="label" color={colors.goldDeep}>SKILLS</Txt>
          <View style={styles.tagRow}>
            {skills.slice(0, 8).map((s) => <Chip key={s} label={s} tone="navy" />)}
            {skills.length > 8 ? (
              <Pressable onPress={() => onSeeAll("skills")}>
                <Txt variant="caption" color={colors.goldDeep} style={{ paddingVertical: 6 }}>+{skills.length - 8} more</Txt>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ── Reusable timeline used by education + experience ── */
function Timeline({ icon, rows, emptyIcon, emptyText }: {
  icon: keyof typeof Ionicons.glyphMap;
  rows: { id: string; title: string; subtitle: string; dates: string; description: string | null; current?: boolean }[];
  emptyIcon: keyof typeof Ionicons.glyphMap;
  emptyText: string;
}) {
  if (rows.length === 0) return <EmptyBlock icon={emptyIcon} text={emptyText} />;
  return (
    <View style={[styles.card, shadow.soft]}>
      {rows.map((r, i) => (
        <View key={r.id} style={[styles.timelineRow, i < rows.length - 1 && { marginBottom: spacing.lg }]}>
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={18} color={colors.gold} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Txt variant="bodyMedium">{r.title}</Txt>
            <Txt variant="caption" color={colors.goldDeep}>{r.subtitle}</Txt>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 }}>
              <Txt variant="caption">{r.dates}</Txt>
              {r.current ? <Chip label="Current" tone="gold" /> : null}
            </View>
            {r.description ? <Txt variant="caption" style={{ marginTop: 4 }}>{r.description}</Txt> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ── Contact tab ── */
function Contact({ p, email }: { p: NonNullable<AlumniUser["alumniProfile"]>; email?: string }) {
  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress?: () => void }[] = [];
  if (email) rows.push({ icon: "mail-outline", label: "Email", value: email, onPress: () => Linking.openURL(`mailto:${email}`) });
  if (p.mobile) rows.push({ icon: "call-outline", label: "Mobile", value: p.mobile, onPress: () => Linking.openURL(`tel:${p.mobile!.replace(/\s/g, "")}`) });
  if (p.whatsapp) rows.push({ icon: "logo-whatsapp", label: "WhatsApp", value: p.whatsapp, onPress: () => Linking.openURL(`https://wa.me/${p.whatsapp!.replace(/[^\d]/g, "")}`) });
  if (p.linkedinUrl) rows.push({ icon: "logo-linkedin", label: "LinkedIn", value: "View profile", onPress: () => Linking.openURL(p.linkedinUrl!) });
  if (p.twitterUrl) rows.push({ icon: "logo-twitter", label: "Twitter / X", value: "View profile", onPress: () => Linking.openURL(p.twitterUrl!) });
  if (p.websiteUrl) rows.push({ icon: "globe-outline", label: "Website", value: "Visit website", onPress: () => Linking.openURL(p.websiteUrl!) });

  if (rows.length === 0) return <EmptyBlock icon="mail-outline" text="No contact details shared." />;
  return (
    <View style={[styles.card, shadow.soft]}>
      <Txt variant="label" color={colors.goldDeep}>CONTACT INFORMATION</Txt>
      <View style={{ marginTop: spacing.sm }}>
        {rows.map((r, i) => (
          <Pressable key={r.label} onPress={r.onPress} style={[styles.contactRow, i < rows.length - 1 && styles.infoDivider]}>
            <View style={styles.iconBox}>
              <Ionicons name={r.icon} size={16} color={colors.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="caption" color={colors.muted}>{r.label}</Txt>
              <Txt variant="bodyMedium" color={r.onPress ? colors.goldDeep : colors.ink} style={{ marginTop: 1 }}>{r.value}</Txt>
            </View>
            {r.onPress ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AddressBlock({ label, addr }: { label: string; addr?: Address | null }) {
  if (!addr || !formatAddress(addr)) return null;
  return (
    <View style={[styles.timelineRow, { marginTop: spacing.md }]}>
      <View style={styles.iconBox}>
        <Ionicons name="home-outline" size={16} color={colors.gold} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Txt variant="caption" color={colors.muted}>{label}</Txt>
        {addr.street ? <Txt variant="bodyMedium">{addr.street}</Txt> : null}
        {addr.landmark ? <Txt variant="caption">{addr.landmark}</Txt> : null}
        <Txt variant="bodyMedium">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}</Txt>
        {addr.country ? <Txt variant="caption">{addr.country}</Txt> : null}
      </View>
    </View>
  );
}

function EmptyBlock({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={[styles.card, shadow.soft, { alignItems: "center", paddingVertical: spacing.xxl }]}>
      <View style={[styles.iconBox, { width: 52, height: 52, borderRadius: 26 }]}>
        <Ionicons name={icon} size={24} color={colors.muted} />
      </View>
      <Txt variant="body" color={colors.muted} style={{ marginTop: spacing.md }}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  tabBar: { backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.xs, borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.goldSoft },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, marginTop: -spacing.xxxl },
  emptyBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill },
  body: { padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.md, alignItems: "center" },
  timelineRow: { flexDirection: "row" },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(200,162,75,0.16)", alignItems: "center", justifyContent: "center" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, gap: spacing.md },
  contactRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
});
