import React, { useEffect } from "react";
import { View, ScrollView, StyleSheet, Pressable, RefreshControl, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ONBOARDED_KEY } from "@/app/onboarding";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";
import { SectionHeader, Ornament, Loader } from "@/components/ui";
import { Bell } from "@/components/Bell";
import { Avatar } from "@/components/Avatar";
import { EventCard, FameCard, AlbumCard, NewsRow } from "@/components/cards";
import { initials } from "@/lib/format";

const QUICK_LINKS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string; tone: string }[] = [
  { icon: "people", label: "Directory", href: "/alumni", tone: colors.navy },
  { icon: "images", label: "Memories", href: "/gallery", tone: colors.maroon },
  { icon: "ribbon", label: "Wall of Fame", href: "/news", tone: colors.goldDeep },
  { icon: "gift", label: "Birthdays", href: "/birthdays", tone: colors.navySoft },
  { icon: "briefcase", label: "Careers", href: "/jobs", tone: colors.navy },
  { icon: "calendar", label: "Events", href: "/events", tone: colors.maroon },
  { icon: "shield-checkmark", label: "Membership", href: "/membership", tone: colors.goldDeep },
  { icon: "heart", label: "Give Back", href: "/donate", tone: colors.navySoft },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  // First-launch onboarding — show the carousel once, then never again.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await SecureStore.getItemAsync(ONBOARDED_KEY).catch(() => null);
      if (!cancelled && seen !== "1") {
        // Defer so the tab navigator is mounted before we present the modal.
        setTimeout(() => router.push("/onboarding" as Href), 350);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const info = useQuery({ queryKey: ["siteInfo"], queryFn: api.siteInfo });
  const content = useQuery({ queryKey: ["siteContent"], queryFn: api.siteContent });
  const events = useQuery({ queryKey: ["events", "home"], queryFn: () => api.events({ limit: 6, status: "upcoming" }) });
  const pastEvents = useQuery({ queryKey: ["events", "past"], queryFn: () => api.events({ limit: 6, status: "past" }) });
  const fame = useQuery({ queryKey: ["news", "fame"], queryFn: () => api.news({ category: "wall_of_fame", limit: 8 }) });
  const news = useQuery({ queryKey: ["news", "latest"], queryFn: () => api.news({ limit: 8 }) });
  const albums = useQuery({ queryKey: ["albums", "home"], queryFn: () => api.albums({ limit: 6 }) });
  const birthdays = useQuery({ queryKey: ["birthdays", "home"], queryFn: api.birthdays });
  const leadership = useQuery({ queryKey: ["leadership", "home"], queryFn: api.leadership });

  const hero = content.data?.hero;
  const stats = hero?.stats || content.data?.stats || [];
  const upcoming = events.data?.data || [];
  const past = pastEvents.data?.data || [];
  const featuredEvent = upcoming[0] || past[0];
  const moreEvents = (upcoming.length ? upcoming : past).slice(1, 3);
  const latestNews = (news.data?.data || []).filter((n) => n.category !== "wall_of_fame").slice(0, 3);
  const leaders = (leadership.data?.data || [])
    .filter((g) => g.isActive !== false && g.members.length)
    .map((g) => ({ role: g.name, member: [...g.members].sort((a, b) => a.order - b.order)[0] }))
    .slice(0, 8);
  const refreshing = info.isFetching && info.isRefetching;

  const onRefresh = () => {
    [info, content, events, pastEvents, fame, news, albums, birthdays, leadership].forEach((q) => q.refetch());
  };

  if (info.isLoading && content.isLoading) {
    return (
      <View style={styles.fullCenter}>
        <Logo height={150} />
        <Loader label="Gathering memories…" />
      </View>
    );
  }

  const albumWidth = (width - spacing.lg * 2 - spacing.md) / 1.7;

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
    >
      {/* ---------------- HERO ---------------- */}
      <LinearGradient colors={gradients.hero} style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color={colors.gold} />
            <Txt style={styles.heroBadgeText}>{hero?.badge?.toUpperCase() || "TO SERVE HUMANITY"}</Txt>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Bell />
            <Pressable onPress={() => router.push("/more")} hitSlop={10}>
              <Ionicons name="person-circle-outline" size={30} color={colors.goldSoft} />
            </Pressable>
          </View>
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.lg }}>
          <Logo height={150} plate />
          <Txt style={styles.heroHand}>where every memory comes home</Txt>
          <Txt variant="body" center color="rgba(255,255,255,0.82)" style={{ marginTop: spacing.sm, maxWidth: 330 }}>
            {hero?.subheading || info.data?.tagline || "Bringing together generations of graduates."}
          </Txt>
        </View>

        {user ? (
          <View style={styles.welcomeBack}>
            <Ionicons name="hand-left" size={16} color={colors.navy} />
            <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.navy, marginLeft: 8 }}>
              Welcome back, {user.firstName || "friend"}!
            </Txt>
          </View>
        ) : (
          <View style={styles.ctaRow}>
            <Pressable style={styles.ctaPrimary} onPress={() => router.push("/register")}>
              <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 14 }}>Become a Member</Txt>
            </Pressable>
            <Pressable style={styles.ctaGhost} onPress={() => router.push("/login")}>
              <Txt style={{ fontFamily: fonts.bodySemi, color: colors.white, fontSize: 14 }}>Sign In</Txt>
            </Pressable>
          </View>
        )}

        {stats.length > 0 ? (
          <View style={styles.statsStrip}>
            {stats.slice(0, 4).map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 22, color: colors.gold }}>{s.value}</Txt>
                <Txt style={styles.statLabel}>{s.label}</Txt>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>

      {/* ---------------- QUICK LINKS ---------------- */}
      <View style={styles.section}>
        <View style={styles.quickGrid}>
          {QUICK_LINKS.map((q) => (
            <Pressable key={q.label} style={styles.quickItem} onPress={() => router.push(q.href as never)}>
              <View style={[styles.quickIcon, { backgroundColor: q.tone }]}>
                <Ionicons name={q.icon} size={20} color={colors.goldSoft} />
              </View>
              <Txt style={styles.quickLabel}>{q.label}</Txt>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ---------------- FEATURED EVENT ---------------- */}
      {featuredEvent ? (
        <View style={styles.section}>
          <SectionHeader eyebrow="Don't miss out" title="Featured Gathering" action="All events" onAction={() => router.push("/events")} />
          <EventCard event={featuredEvent} />
          {moreEvents.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </View>
      ) : null}

      {/* ---------------- WALL OF FAME ---------------- */}
      {fame.data?.data?.length ? (
        <View style={[styles.section, { paddingRight: 0 }]}>
          <View style={{ paddingRight: spacing.lg }}>
            <SectionHeader eyebrow="Pride of CTK" title="Wall of Fame" action="More" onAction={() => router.push("/news")} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.lg }}>
            {fame.data.data.map((a) => (
              <FameCard key={a.id} article={a} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* ---------------- BIRTHDAYS ---------------- */}
      {birthdays.data?.length ? (
        <View style={[styles.section, { paddingRight: 0 }]}>
          <View style={{ paddingRight: spacing.lg }}>
            <SectionHeader eyebrow="Many happy returns" title="Birthdays" action="All" onAction={() => router.push("/birthdays")} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.md }}>
            {birthdays.data.slice(0, 10).map((b) => (
              <Pressable key={b.id} style={[styles.bdayCard, shadow.soft]} onPress={() => router.push("/birthdays")}>
                <Avatar uri={b.imageUrl} initials={initials(b.name)} size={56} />
                <Txt style={styles.bdayName} numberOfLines={1}>
                  {b.name}
                </Txt>
                {b.batch ? (
                  <Txt variant="caption" numberOfLines={1}>
                    Batch {b.batch}
                  </Txt>
                ) : null}
                <View style={[styles.bdayPill, b.birthday === "today" && styles.bdayPillToday]}>
                  <Ionicons name="gift" size={11} color={b.birthday === "today" ? colors.navyDeep : colors.goldDeep} />
                  <Txt style={[styles.bdayPillText, b.birthday === "today" && { color: colors.navyDeep }]}>
                    {b.birthday === "today" ? "Today" : "This week"}
                  </Txt>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* ---------------- PHOTO MEMORIES ---------------- */}
      {albums.data?.data?.length ? (
        <View style={[styles.section, { paddingRight: 0 }]}>
          <View style={{ paddingRight: spacing.lg }}>
            <SectionHeader eyebrow="From the archives" title="Photo Memories" action="Gallery" onAction={() => router.push("/gallery")} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.md }}>
            {albums.data.data.map((al) => (
              <AlbumCard key={al.id} album={al} width={albumWidth} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* ---------------- LEADERSHIP ---------------- */}
      {leaders.length ? (
        <View style={[styles.section, { paddingRight: 0 }]}>
          <View style={{ paddingRight: spacing.lg }}>
            <SectionHeader eyebrow="At the helm" title="Office Bearers" action="All" onAction={() => router.push("/leadership")} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.md }}>
            {leaders.map((l) => (
              <Pressable key={l.member.id} style={[styles.leaderCard, shadow.soft]} onPress={() => router.push("/leadership")}>
                <Avatar uri={l.member.profileImage} initials={initials(l.member.name)} size={64} />
                <Txt style={styles.leaderName} numberOfLines={1}>
                  {l.member.name}
                </Txt>
                <Txt variant="caption" center numberOfLines={1} style={{ color: colors.goldDeep }}>
                  {l.role}
                </Txt>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* ---------------- LATEST NEWS ---------------- */}
      {latestNews.length ? (
        <View style={styles.section}>
          <SectionHeader eyebrow="Stay in the loop" title="News & Notices" action="More" onAction={() => router.push("/news")} />
          <View style={[styles.newsCard, shadow.soft]}>
            {latestNews.map((n, i) => (
              <View key={n.id}>
                {i > 0 ? <View style={styles.newsDivider} /> : null}
                <NewsRow article={n} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* ---------------- MEMBERSHIP CTA ---------------- */}
      <View style={styles.section}>
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.ctaBand, shadow.soft]}>
          <Ionicons name="shield-checkmark" size={28} color={colors.navyDeep} />
          <Txt variant="heading" center color={colors.navyDeep} style={{ marginTop: spacing.sm }}>
            Join the CTK Family
          </Txt>
          <Txt variant="caption" center color={colors.navyDeep} style={{ marginTop: 4, maxWidth: 280, opacity: 0.85 }}>
            Become a member to unlock the directory, events and a lifetime of reunions.
          </Txt>
          <Pressable style={styles.ctaBandBtn} onPress={() => router.push("/membership")}>
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.goldSoft, fontSize: 14 }}>View Membership Plans</Txt>
            <Ionicons name="arrow-forward" size={15} color={colors.goldSoft} style={{ marginLeft: 6 }} />
          </Pressable>
        </LinearGradient>
      </View>

      {/* ---------------- FOOTER ---------------- */}
      <View style={styles.footer}>
        <Logo height={84} />
        <Ornament style={{ marginVertical: spacing.md }} />
        <Txt style={{ fontFamily: fonts.displayItalic, fontSize: 18, color: colors.navy, textAlign: "center" }}>
          “Once a King, always a King.”
        </Txt>
        <Txt variant="caption" center style={{ marginTop: 6 }}>
          {info.data?.name || "Christ The King Alumni Association"} · Tundla
        </Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200,162,75,0.14)",
    borderColor: "rgba(200,162,75,0.35)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  heroBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.goldSoft, marginLeft: 5, letterSpacing: 1 },
  heroHand: { fontFamily: fonts.handBold, fontSize: 22, color: colors.goldSoft, marginTop: spacing.md },
  welcomeBack: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
  },
  ctaRow: { flexDirection: "row", justifyContent: "center", gap: spacing.md, marginTop: spacing.xl },
  ctaPrimary: { backgroundColor: colors.goldSoft, paddingHorizontal: 22, paddingVertical: 12, borderRadius: radius.pill, ...shadow.soft },
  ctaGhost: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  statsStrip: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  statItem: { alignItems: "center", flex: 1 },
  statLabel: { fontFamily: fonts.body, fontSize: 10, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 2 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.lg },
  quickItem: { width: "23%", alignItems: "center" },
  quickIcon: { width: 54, height: 54, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", ...shadow.soft },
  quickLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkSoft, marginTop: 6, textAlign: "center" },
  bdayCard: { width: 132, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, alignItems: "center" },
  bdayName: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, marginTop: spacing.sm, textAlign: "center" },
  bdayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(200,162,75,0.16)",
  },
  bdayPillToday: { backgroundColor: colors.goldSoft },
  bdayPillText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.goldDeep },
  leaderCard: { width: 130, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, alignItems: "center" },
  leaderName: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, marginTop: spacing.sm, textAlign: "center" },
  newsCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  newsDivider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.sm },
  ctaBand: { borderRadius: radius.xl, padding: spacing.xl, alignItems: "center" },
  ctaBandBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.navyDeep,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
  },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.lg, alignItems: "center" },
});
