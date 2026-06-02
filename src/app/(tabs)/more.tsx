import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Bell } from "@/components/Bell";
import { Avatar } from "@/components/Avatar";
import { Ornament } from "@/components/ui";
import { initials } from "@/lib/format";

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; onPress: () => void };

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  const info = useQuery({ queryKey: ["siteInfo"], queryFn: api.siteInfo });

  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const sections: { title: string; items: Item[] }[] = [
    {
      title: "Explore",
      items: [
        { icon: "ribbon", label: "Wall of Fame", sub: "Celebrated alumni", onPress: () => router.push("/news") },
        { icon: "star", label: "Featured Alumni", sub: "Verified members", onPress: () => router.push("/featured-alumni") },
        { icon: "briefcase", label: "Careers", sub: "Jobs from the network", onPress: () => router.push("/jobs") },
        { icon: "school-outline", label: "Scholarships", sub: "Grants & support", onPress: () => router.push("/scholarships") },
        { icon: "clipboard", label: "Surveys", sub: "Share your voice", onPress: () => router.push("/surveys") },
        { icon: "people-circle", label: "Leadership", sub: "Office bearers", onPress: () => router.push("/leadership") },
        { icon: "school", label: "Our Principals", sub: "Heritage of CTK", onPress: () => router.push("/principals") },
        { icon: "gift", label: "Birthdays", sub: "Celebrate the family", onPress: () => router.push("/birthdays") },
        { icon: "mail", label: "Contact Us", sub: "Reach the association", onPress: () => router.push("/contact") },
        { icon: "information-circle", label: "About CTK", sub: "Our story & legacy", onPress: () => router.push("/about") },
      ],
    },
    {
      title: "Get Involved",
      items: [
        { icon: "heart", label: "Give Back", sub: "Support a cause", onPress: () => router.push("/donate") },
        { icon: "shield-checkmark", label: "Membership", sub: "Become a member", onPress: () => router.push("/membership") },
        {
          icon: "globe-outline",
          label: "Visit Website",
          sub: "alum-app-tau.vercel.app",
          onPress: () => Linking.openURL("https://alum-app-tau.vercel.app"),
        },
      ],
    },
    ...(user
      ? [
          {
            title: "My CTK",
            items: [
              { icon: "person-circle" as const, label: "My Profile", sub: "View & edit your profile", onPress: () => router.push("/profile") },
              { icon: "card" as const, label: "My Account", sub: "Membership, payments & more", onPress: () => router.push("/account") },
              { icon: "notifications" as const, label: "Notifications", sub: "Reminders & alerts", onPress: () => router.push("/notify-settings") },
            ],
          },
        ]
      : []),
    ...(isStaff
      ? [
          {
            title: "Administration",
            items: [
              { icon: "speedometer" as const, label: "Dashboard", sub: "Stats & management", onPress: () => router.push("/admin") },
            ],
          },
        ]
      : []),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <PageHeader eyebrow={info.data?.name || "CTK Alumni"} title="More" right={<Bell />} />

      {/* Account card */}
      <View style={styles.accountWrap}>
        {user ? (
          <Pressable style={[styles.accountCard, shadow.soft]} onPress={() => router.push("/profile")}>
            <Avatar uri={user.imageUrl} initials={initials(user.firstName, user.lastName)} size={56} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="heading" numberOfLines={1}>
                {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email}
              </Txt>
              <Txt variant="caption" numberOfLines={1}>
                View & edit your profile
              </Txt>
            </View>
            <Pressable onPress={signOut} hitSlop={8} style={styles.signOut}>
              <Ionicons name="log-out-outline" size={20} color={colors.maroon} />
            </Pressable>
          </Pressable>
        ) : (
          <View style={[styles.accountCard, shadow.soft]}>
            <View style={styles.guestIcon}>
              <Ionicons name="person" size={24} color={colors.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="heading">Join the CTK family</Txt>
              <Txt variant="caption">Sign in to connect & stay updated</Txt>
            </View>
            <Pressable style={styles.signInBtn} onPress={() => router.push("/login")}>
              <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 13 }}>Sign In</Txt>
            </Pressable>
          </View>
        )}
      </View>

      {sections.map((sec) => (
        <View key={sec.title} style={styles.section}>
          <Txt variant="label" color={colors.goldDeep} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>
            {sec.title.toUpperCase()}
          </Txt>
          <View style={[styles.menuCard, shadow.soft]}>
            {sec.items.map((it, i) => (
              <Pressable
                key={it.label}
                style={[styles.menuRow, i < sec.items.length - 1 && styles.menuDivider]}
                onPress={it.onPress}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={it.icon} size={18} color={colors.navy} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Txt variant="bodyMedium">{it.label}</Txt>
                  <Txt variant="caption">{it.sub}</Txt>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={{ alignItems: "center", marginTop: spacing.xxl }}>
        <Ornament style={{ marginBottom: spacing.sm }} />
        <Txt variant="caption" center>
          Made with ♥ for the CTK community
        </Txt>
        <Txt variant="caption" center style={{ marginTop: 2 }}>
          v1.0.0
        </Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  accountWrap: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  guestIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  signInBtn: { backgroundColor: colors.goldSoft, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill },
  signOut: { padding: 8 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  menuCard: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(200,162,75,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
});
