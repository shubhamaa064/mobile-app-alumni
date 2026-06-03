import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api, parsePrivacy, type Completeness, type MyProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppLock } from "@/lib/app-lock";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Avatar } from "@/components/Avatar";
import { Chip, Loader, Ornament } from "@/components/ui";
import { initials, splitTags, formatMonthYear } from "@/lib/format";

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const profile = useQuery({ queryKey: ["myProfile"], queryFn: api.myProfile, enabled: !!user });
  const completeness = useQuery({ queryKey: ["profileCompleteness"], queryFn: api.profileCompleteness, enabled: !!user });

  // Not signed in — bounce to login.
  if (!user) {
    return (
      <View style={styles.container}>
        <Hero insets={insets} />
        <View style={styles.signedOut}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.muted} />
          <Txt variant="heading" center style={{ marginTop: spacing.md }}>Sign in required</Txt>
          <Txt variant="body" center color={colors.muted} style={{ marginTop: spacing.sm, maxWidth: 280 }}>
            Sign in to view and edit your alumni profile.
          </Txt>
          <Pressable onPress={() => router.push("/login")} style={styles.primaryBtn}>
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 15 }}>Sign In</Txt>
          </Pressable>
        </View>
      </View>
    );
  }

  if (profile.isLoading) return <View style={styles.container}><Loader label="Loading your profile…" /></View>;

  const data = profile.data;
  const p = data?.alumniProfile;
  const privacy = parsePrivacy(p?.privacySettings);
  const skills = splitTags(p?.skills);
  const work = p?.workExperiences ?? [];
  const education = p?.education ?? [];

  const onSignOut = () =>
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <Hero insets={insets}>
          <View style={{ alignItems: "center", marginTop: spacing.sm }}>
            <Avatar uri={p?.imageUrl || user.imageUrl} initials={initials(p?.firstName || user.firstName, p?.lastName || user.lastName)} size={96} />
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
              <Txt variant="title" color={colors.white}>
                {p ? `${p.firstName} ${p.lastName}`.trim() : (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email)}
              </Txt>
              {p?.isVerified ? <Ionicons name="checkmark-circle" size={20} color={colors.gold} style={{ marginLeft: 6 }} /> : null}
            </View>
            <Txt variant="caption" color="rgba(255,255,255,0.7)" style={{ marginTop: 2 }}>{data?.email}</Txt>
            <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.sm, flexWrap: "wrap", justifyContent: "center" }}>
              {p?.isVerified ? <Chip label="Verified" tone="gold" icon="checkmark-circle" /> : null}
              <Chip label={roleLabel(data?.role)} tone="ghost" />
              {p?.batchYear ? <Chip label={`Batch of ${p.batchYear}`} tone="ghost" icon="school-outline" /> : null}
            </View>
            {p?.profession ? (
              <Txt variant="subtitle" color={colors.goldSoft} center style={{ fontFamily: fonts.displayItalic, marginTop: spacing.sm }}>
                {p.profession}{p.company ? ` at ${p.company}` : ""}
              </Txt>
            ) : null}
          </View>
        </Hero>

        <View style={styles.body}>
          {/* ── Profile completeness ── */}
          {completeness.data ? <CompletenessCard c={completeness.data} /> : null}

          {/* ── Actions ── */}
          <View style={[styles.card, shadow.soft, { paddingVertical: spacing.xs }]}>
            <ActionRow icon="create-outline" label="Edit Profile" sub="Update your details & privacy" onPress={() => router.push("/profile/edit")} divider />
            <ActionRow icon="eye-outline" label="View Public Profile" sub="See what others see" onPress={() => router.push(`/alumni/${user.id}`)} divider />
            <ActionRow icon="key-outline" label="Change Password" sub="Update your password" onPress={() => router.push("/profile/edit?section=password")} divider />
            <ActionRow icon="notifications-outline" label="Notifications" sub="Reminders & alerts" onPress={() => router.push("/notify-settings")} divider />
            <ActionRow icon="log-out-outline" label="Sign Out" sub="" danger onPress={onSignOut} />
          </View>

          {/* ── Security (biometric app lock) ── */}
          <SecurityCard />

          {/* ── About ── */}
          <SectionCard title="ABOUT">
            <Txt variant="body" color={p?.bio ? colors.ink : colors.muted} style={{ fontStyle: p?.bio ? "normal" : "italic" }}>
              {p?.bio || "No bio added yet. Tap Edit Profile to introduce yourself."}
            </Txt>
          </SectionCard>

          {/* ── Quick info ── */}
          <SectionCard title="DETAILS">
            <InfoRow label="Profession" value={p?.profession} />
            <InfoRow label="Company" value={p?.company} />
            <InfoRow label="Batch Year" value={p?.batchYear ? String(p.batchYear) : null} />
            <InfoRow label="Country" value={p?.country} />
            <InfoRow label="Mobile" value={p?.mobile} />
            <InfoRow label="WhatsApp" value={p?.whatsapp} />
            <InfoRow label="Date of Birth" value={p?.dateOfBirth ? formatMonthYear(p.dateOfBirth) : null} last />
          </SectionCard>

          {/* ── Skills ── */}
          {skills.length > 0 ? (
            <SectionCard title="SKILLS">
              <View style={styles.tagRow}>
                {skills.map((s) => <Chip key={s} label={s} tone="navy" />)}
              </View>
            </SectionCard>
          ) : null}

          {/* ── Experience (read-only) ── */}
          <SectionCard title="WORK EXPERIENCE">
            {work.length > 0 ? work.map((w, i) => (
              <TimelineItem
                key={w.id}
                icon="briefcase-outline"
                title={w.title}
                subtitle={w.company}
                dates={`${formatMonthYear(w.startDate) || "—"} – ${w.isCurrent ? "Present" : formatMonthYear(w.endDate) || "—"}`}
                description={w.description}
                last={i === work.length - 1}
              />
            )) : <Muted text="No work experience added yet." />}
          </SectionCard>

          {/* ── Education (read-only) ── */}
          <SectionCard title="EDUCATION">
            {education.length > 0 ? education.map((e, i) => (
              <TimelineItem
                key={e.id}
                icon="school-outline"
                title={`${e.degree}${e.fieldOfStudy ? `, ${e.fieldOfStudy}` : ""}`}
                subtitle={e.institution}
                dates={`${formatMonthYear(e.startDate) || "—"}${e.endDate ? ` – ${formatMonthYear(e.endDate)}` : " – Present"}`}
                description={e.description}
                last={i === education.length - 1}
              />
            )) : <Muted text="No education history added yet." />}
          </SectionCard>

          {/* ── Privacy summary ── */}
          <SectionCard title="PRIVACY">
            <PrivacyRow label="Show mobile number" on={privacy.showMobile} />
            <PrivacyRow label="Show WhatsApp" on={privacy.showWhatsapp} />
            <PrivacyRow label="Show email" on={privacy.showEmail} />
            <PrivacyRow label="Show date of birth" on={privacy.showDateOfBirth} />
            <PrivacyRow label="Show current address" on={privacy.showCurrentAddress} />
            <PrivacyRow label="Show education" on={privacy.showEducation} />
            <PrivacyRow label="Show work experience" on={privacy.showWorkExperience} last />
            <Pressable onPress={() => router.push("/profile/edit?section=privacy")} style={{ marginTop: spacing.md }}>
              <Txt style={{ fontFamily: fonts.bodySemi, color: colors.goldDeep, fontSize: 12.5 }}>Manage privacy settings →</Txt>
            </Pressable>
          </SectionCard>

          <Ornament style={{ marginTop: spacing.xl }} />
          <Txt variant="caption" center style={{ marginTop: spacing.md }}>
            A proud member of the CTK family
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}

function roleLabel(role?: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "MODERATOR") return "Moderator";
  return "Alumni";
}

function Hero({ insets, children }: { insets: { top: number }; children?: React.ReactNode }) {
  return (
    <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <Txt variant="label" color="rgba(255,255,255,0.8)">MY PROFILE</Txt>
        <Pressable onPress={() => router.push("/profile/edit")} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="create-outline" size={20} color={colors.white} />
        </Pressable>
      </View>
      {children}
    </LinearGradient>
  );
}

function CompletenessCard({ c }: { c: Completeness }) {
  const pct = Math.max(0, Math.min(100, Math.round(c.percent)));
  const nudges = (c.topNudges?.length ? c.topNudges : c.missing) ?? [];
  return (
    <View style={[styles.card, shadow.soft]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Txt variant="label" color={colors.goldDeep}>PROFILE COMPLETENESS</Txt>
        <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navy, fontSize: 16 }}>{pct}%</Txt>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      {pct < 100 && nudges.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <Txt variant="caption" color={colors.muted} style={{ marginBottom: 6 }}>Complete these to stand out:</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {nudges.slice(0, 5).map((n) => <Chip key={n.key} label={n.label} tone="gold" icon="add-circle-outline" />)}
          </View>
          <Pressable onPress={() => router.push("/profile/edit")} style={{ marginTop: spacing.md }}>
            <Txt style={{ fontFamily: fonts.bodySemi, color: colors.goldDeep, fontSize: 12.5 }}>Complete your profile →</Txt>
          </Pressable>
        </View>
      ) : pct >= 100 ? (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: 6 }}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Txt variant="caption" color={colors.success}>Your profile is complete. Well done!</Txt>
        </View>
      ) : null}
    </View>
  );
}

function ActionRow({ icon, label, sub, onPress, danger, divider }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
  danger?: boolean;
  divider?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.actionRow, divider && styles.divider]}>
      <View style={[styles.actionIcon, danger && { backgroundColor: "rgba(176,65,62,0.12)" }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.navy} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Txt variant="bodyMedium" color={danger ? colors.danger : colors.ink}>{label}</Txt>
        {sub ? <Txt variant="caption">{sub}</Txt> : null}
      </View>
      {!danger ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

function SecurityCard() {
  const { available, label, enabled, setEnabled, kind } = useAppLock();
  const [busy, setBusy] = React.useState(false);

  const onToggle = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await setEnabled(next);
      if (next && !ok) {
        Alert.alert(`Couldn't enable ${label}`, "We couldn't verify your biometrics. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, shadow.soft]}>
      <Txt variant="label" color={colors.goldDeep} style={{ marginBottom: spacing.sm }}>SECURITY</Txt>
      <View style={styles.lockRow}>
        <View style={styles.actionIcon}>
          <Ionicons name={kind === "face" ? "scan-outline" : "finger-print-outline"} size={18} color={colors.navy} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Txt variant="bodyMedium" color={colors.ink}>{available ? `${label} lock` : "Biometric lock"}</Txt>
          <Txt variant="caption">
            {available
              ? `Require ${label} each time you open the app`
              : "Set up Face ID or a fingerprint on your device to enable"}
          </Txt>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={!available || busy}
          trackColor={{ true: colors.gold, false: colors.line }}
          thumbColor={colors.white}
        />
      </View>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, shadow.soft]}>
      <Txt variant="label" color={colors.goldDeep} style={{ marginBottom: spacing.sm }}>{title}</Txt>
      {children}
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.divider]}>
      <Txt variant="caption" color={colors.muted}>{label}</Txt>
      <Txt variant="caption" color={value ? colors.ink : colors.muted} style={{ fontFamily: fonts.bodySemi, flexShrink: 1, textAlign: "right" }}>
        {value || "—"}
      </Txt>
    </View>
  );
}

function PrivacyRow({ label, on, last }: { label: string; on: boolean; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.divider]}>
      <Txt variant="caption" color={colors.inkSoft}>{label}</Txt>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Ionicons name={on ? "eye-outline" : "eye-off-outline"} size={14} color={on ? colors.success : colors.muted} />
        <Txt variant="caption" color={on ? colors.success : colors.muted} style={{ fontFamily: fonts.bodySemi }}>
          {on ? "Visible" : "Hidden"}
        </Txt>
      </View>
    </View>
  );
}

function TimelineItem({ icon, title, subtitle, dates, description, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  dates: string;
  description?: string | null;
  last?: boolean;
}) {
  return (
    <View style={[styles.timelineRow, !last && { marginBottom: spacing.lg }]}>
      <View style={styles.timelineIcon}>
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Txt variant="bodyMedium">{title}</Txt>
        <Txt variant="caption" color={colors.goldDeep}>{subtitle}</Txt>
        <Txt variant="caption" style={{ marginTop: 1 }}>{dates}</Txt>
        {description ? <Txt variant="caption" style={{ marginTop: 4 }}>{description}</Txt> : null}
      </View>
    </View>
  );
}

function Muted({ text }: { text: string }) {
  return <Txt variant="body" color={colors.muted} style={{ fontStyle: "italic" }}>{text}</Txt>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  signedOut: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  primaryBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.pill, ...shadow.lift },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.paperDim, marginTop: spacing.md, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.gold },
  actionRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  lockRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs },
  actionIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: "rgba(20,33,61,0.07)", alignItems: "center", justifyContent: "center" },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, gap: spacing.md },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  timelineRow: { flexDirection: "row" },
  timelineIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(200,162,75,0.16)", alignItems: "center", justifyContent: "center" },
});
