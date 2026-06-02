import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, type MembershipPlan } from "@/lib/api";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Loader, Ornament } from "@/components/ui";

const PERKS = ["Alumni directory access", "Event invitations", "Wall of Fame eligibility", "Networking & mentorship"];

export default function MembershipScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["plans"], queryFn: api.membershipPlans });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <PageHeader back eyebrow="Belong forever" title="Membership" subtitle="Stay connected to your roots" />

      <View style={styles.body}>
        {isLoading ? (
          <Loader />
        ) : (
          (data?.data || []).map((plan: MembershipPlan, idx) => {
            const featured = idx === 0;
            return (
              <View key={plan.id} style={[styles.planCard, featured && styles.planFeatured, shadow.soft]}>
                {featured ? (
                  <View style={styles.popular}>
                    <Txt style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.navyDeep, letterSpacing: 1 }}>RECOMMENDED</Txt>
                  </View>
                ) : null}
                <Txt variant="heading" color={featured ? colors.white : colors.ink}>
                  {plan.name}
                </Txt>
                <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
                  <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 32, color: featured ? colors.goldSoft : colors.navy }}>
                    ₹{plan.price}
                  </Txt>
                  <Txt variant="caption" color={featured ? "rgba(255,255,255,0.7)" : colors.muted} style={{ marginBottom: 6, marginLeft: 4 }}>
                    {plan.isLifetime ? "/ lifetime" : `/ ${plan.validity} days`}
                  </Txt>
                </View>
                {plan.description ? (
                  <Txt variant="caption" color={featured ? "rgba(255,255,255,0.78)" : colors.inkSoft} style={{ marginTop: 6 }}>
                    {plan.description}
                  </Txt>
                ) : null}
                <View style={{ marginTop: spacing.md }}>
                  {PERKS.map((perk) => (
                    <View key={perk} style={styles.perkRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.gold} />
                      <Txt variant="caption" color={featured ? "rgba(255,255,255,0.85)" : colors.inkSoft} style={{ marginLeft: 8 }}>
                        {perk}
                      </Txt>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={[styles.joinBtn, featured ? styles.joinFeatured : styles.joinPlain]}
                  onPress={() => Linking.openURL("https://alum-app-tau.vercel.app/membership")}
                >
                  <Txt style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: featured ? colors.navyDeep : colors.white }}>
                    Choose {plan.name}
                  </Txt>
                </Pressable>
              </View>
            );
          })
        )}
        <Ornament style={{ marginTop: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  body: { padding: spacing.lg },
  planCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.line },
  planFeatured: { backgroundColor: colors.navy, borderColor: colors.gold },
  popular: { alignSelf: "flex-start", backgroundColor: colors.goldSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginBottom: spacing.md },
  perkRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  joinBtn: { marginTop: spacing.lg, paddingVertical: 13, borderRadius: radius.md, alignItems: "center" },
  joinFeatured: { backgroundColor: colors.goldSoft },
  joinPlain: { backgroundColor: colors.navy },
});
