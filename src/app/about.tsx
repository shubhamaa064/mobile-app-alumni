import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBack } from "@/lib/nav";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";
import { Ornament } from "@/components/ui";

const PILLARS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "people", title: "Connect", body: "Find batchmates, mentors and friends across every generation of CTK." },
  { icon: "calendar", title: "Reunite", body: "Gatherings, reunions and celebrations that bring the family back home." },
  { icon: "ribbon", title: "Celebrate", body: "Honour the achievements of our alumni on the Wall of Fame." },
  { icon: "heart", title: "Give Back", body: "Support scholarships, causes and the students who follow in our steps." },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const info = useQuery({ queryKey: ["siteInfo"], queryFn: api.siteInfo });
  const content = useQuery({ queryKey: ["siteContent"], queryFn: api.siteContent });
  const stats = content.data?.hero?.stats || content.data?.stats || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={gradients.hero} style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <View style={{ alignItems: "center", marginTop: spacing.sm }}>
          <Logo height={120} plate />
          <Txt style={styles.hand}>our story</Txt>
          <Txt variant="title" center color={colors.white} style={{ marginTop: 2 }}>
            {info.data?.name || "Christ The King Alumni"}
          </Txt>
          <Txt variant="caption" center color="rgba(255,255,255,0.75)" style={{ marginTop: 6, maxWidth: 300 }}>
            {info.data?.tagline || "Bringing together generations of graduates from Tundla."}
          </Txt>
        </View>

        {stats.length > 0 ? (
          <View style={styles.statsStrip}>
            {stats.slice(0, 4).map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 22, color: colors.gold }}>{s.value}</Txt>
                <Txt style={{ fontFamily: fonts.body, fontSize: 10, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 2 }}>
                  {s.label}
                </Txt>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <Txt variant="body" style={{ marginBottom: spacing.lg }}>
          The Christ The King Alumni Association unites the graduates of CTK, Tundla — a community bound by shared
          classrooms, lifelong friendships and the values our school instilled in us. From the youngest batch to the
          eldest, we carry the same crest and the same promise: once a King, always a King.
        </Txt>

        <Ornament style={{ marginVertical: spacing.lg }} />

        {PILLARS.map((p) => (
          <View key={p.title} style={[styles.card, shadow.soft]}>
            <View style={styles.icon}>
              <Ionicons name={p.icon} size={20} color={colors.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="heading">{p.title}</Txt>
              <Txt variant="caption" style={{ marginTop: 3 }}>
                {p.body}
              </Txt>
            </View>
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={() => router.push("/contact")}>
            <Ionicons name="mail" size={16} color={colors.navyDeep} />
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 14, marginLeft: 8 }}>Contact the Association</Txt>
          </Pressable>
          <Pressable style={styles.ghost} onPress={() => router.push("/principals")}>
            <Txt style={{ fontFamily: fonts.bodySemi, color: colors.navy, fontSize: 14 }}>Meet our Principals</Txt>
          </Pressable>
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.xxl }}>
          <Ornament style={{ marginBottom: spacing.md }} />
          <Txt style={{ fontFamily: fonts.displayItalic, fontSize: 17, color: colors.navy, textAlign: "center" }}>
            “Once a King, always a King.”
          </Txt>
          <Txt variant="caption" center style={{ marginTop: 6 }}>
            Christ The King Alumni Association · Tundla
          </Txt>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  hand: { fontFamily: fonts.handBold, fontSize: 20, color: colors.goldSoft, marginTop: 10 },
  statsStrip: { flexDirection: "row", justifyContent: "space-around", marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
  statItem: { alignItems: "center", flex: 1 },
  body: { padding: spacing.lg },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  primary: { flexDirection: "row", backgroundColor: colors.goldSoft, paddingVertical: 15, borderRadius: radius.md, alignItems: "center", justifyContent: "center", ...shadow.soft },
  ghost: { paddingVertical: 15, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.line },
});
