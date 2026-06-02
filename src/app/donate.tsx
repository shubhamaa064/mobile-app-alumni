import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Ornament } from "@/components/ui";

const CAUSES = [
  { icon: "school", title: "Student Scholarships", desc: "Help bright students continue their education at CTK." },
  { icon: "construct", title: "Campus Development", desc: "Support new facilities and infrastructure upgrades." },
  { icon: "people", title: "Community Sewa", desc: "Fund alumni-led service drives across Tundla." },
] as const;

export default function DonateScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <PageHeader back eyebrow="Give back" title="Support CTK" subtitle="Every contribution leaves a legacy" />

      <View style={styles.body}>
        <View style={[styles.heartCard, shadow.lift]}>
          <Ionicons name="heart" size={32} color={colors.maroon} />
          <Txt variant="heading" center style={{ marginTop: spacing.md }}>
            Pay it forward
          </Txt>
          <Txt variant="body" center style={{ marginTop: 6, maxWidth: 280 }}>
            The school shaped who we are. Your gift helps the next generation of Kings dream bigger.
          </Txt>
          <Pressable style={styles.donateBtn} onPress={() => Linking.openURL("https://alum-app-tau.vercel.app/donate")}>
            <Ionicons name="gift" size={18} color={colors.navyDeep} />
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 15, marginLeft: 8 }}>Donate Now</Txt>
          </Pressable>
        </View>

        <Txt variant="label" color={colors.goldDeep} style={{ marginTop: spacing.xxl, marginBottom: spacing.md, marginLeft: 4 }}>
          WHERE YOUR GIFT GOES
        </Txt>
        {CAUSES.map((c) => (
          <View key={c.title} style={[styles.causeCard, shadow.soft]}>
            <View style={styles.causeIcon}>
              <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="bodyMedium">{c.title}</Txt>
              <Txt variant="caption" style={{ marginTop: 2 }}>
                {c.desc}
              </Txt>
            </View>
          </View>
        ))}

        <Ornament style={{ marginTop: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  body: { padding: spacing.lg },
  heartCard: { backgroundColor: colors.cardWarm, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", marginTop: spacing.sm },
  donateBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.goldSoft, paddingHorizontal: 26, paddingVertical: 13, borderRadius: radius.pill, marginTop: spacing.lg },
  causeCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  causeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
});
