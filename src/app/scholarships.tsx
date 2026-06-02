import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Chip, Ornament } from "@/components/ui";

type Category = "All" | "Merit" | "Need-based" | "Sports" | "Arts" | "International";
type Status = "Open" | "Closed" | "Coming Soon";

type Scholarship = {
  id: number;
  title: string;
  category: Exclude<Category, "All">;
  amount: string;
  amountNote: string;
  eligibility: string[];
  deadline: string;
  status: Status;
  sponsor: string;
  sponsorInitials: string;
  description: string;
};

const STATS = [
  { label: "Scholarships Awarded", value: "45", icon: "ribbon-outline" as const },
  { label: "Total Disbursed", value: "₹28L", icon: "cash-outline" as const },
  { label: "Active Programs", value: "12", icon: "book-outline" as const },
  { label: "Completion Rate", value: "94%", icon: "trophy-outline" as const },
];

const SCHOLARSHIPS: Scholarship[] = [
  { id: 1, title: "CK Excellence Scholarship", category: "Merit", amount: "₹50,000", amountNote: "per year", eligibility: ["Minimum 90% aggregate in Class X", "Current student in Class XI or XII at CK", "Active participation in school activities"], deadline: "July 31, 2026", status: "Open", sponsor: "Thomas Mathew Foundation", sponsorInitials: "TM", description: "Recognizing outstanding academic achievement among current CK students." },
  { id: 2, title: "Alumni Merit Award", category: "Merit", amount: "₹30,000", amountNote: "one-time", eligibility: ["CK alumni pursuing undergraduate degree", "Minimum 85% in Class XII board exams", "Enrolled in a recognized university"], deadline: "August 15, 2026", status: "Open", sponsor: "CK Alumni Association", sponsorInitials: "CK", description: "Supporting academically brilliant CK alumni in their higher education journey." },
  { id: 3, title: "Sports Achievement Grant", category: "Sports", amount: "₹25,000", amountNote: "per year", eligibility: ["State-level or national representation in any sport", "Current or former CK student", "Maintaining minimum 70% academic score"], deadline: "Closed", status: "Closed", sponsor: "CK Sports Alumni Circle", sponsorInitials: "SA", description: "Celebrating and supporting CK athletes who excel on the field and in the classroom." },
  { id: 4, title: "Arts & Culture Award", category: "Arts", amount: "₹20,000", amountNote: "one-time", eligibility: ["Award in state or national arts/cultural competition", "Pursuing arts, music, dance, or theatre professionally", "Letter of recommendation from a faculty member"], deadline: "September 30, 2026", status: "Open", sponsor: "CK Cultural Alumni Forum", sponsorInitials: "CA", description: "Nurturing the creative spirit that has always been part of CK's heritage." },
  { id: 5, title: "Need-Based Support Fund", category: "Need-based", amount: "₹15,000", amountNote: "per semester", eligibility: ["Family annual income below ₹2.5L", "Enrolled in full-time education", "Submission of income certificate and academic records"], deadline: "Rolling Admissions", status: "Open", sponsor: "CK Alumni Welfare Trust", sponsorInitials: "WT", description: "Ensuring no CK student's potential is limited by financial constraints." },
  { id: 6, title: "International Alumni Scholarship", category: "International", amount: "₹1,00,000", amountNote: "one-time", eligibility: ["Admission to a top-100 global university", "CK alumni with at least 5 years since graduation", "Essay submission on community contribution goals"], deadline: "Coming Soon", status: "Coming Soon", sponsor: "CK Global Alumni Network", sponsorInitials: "GA", description: "Empowering CK alumni to pursue world-class education across borders." },
];

const STEPS = [
  { icon: "search-outline" as const, title: "Find Your Match", description: "Browse scholarships and check the eligibility criteria that fit you best." },
  { icon: "document-text-outline" as const, title: "Prepare Documents", description: "Gather academic records, certificates and recommendation letters." },
  { icon: "clipboard-outline" as const, title: "Submit Application", description: "Apply before the deadline through the alumni office or online." },
  { icon: "people-outline" as const, title: "Review & Award", description: "A committee reviews applications and awards deserving candidates." },
];

const FILTERS: Category[] = ["All", "Merit", "Need-based", "Sports", "Arts", "International"];

function statusTone(s: Status): "gold" | "neutral" | "navy" {
  if (s === "Open") return "gold";
  if (s === "Coming Soon") return "navy";
  return "neutral";
}

export default function ScholarshipsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Category>("All");
  const list = filter === "All" ? SCHOLARSHIPS : SCHOLARSHIPS.filter((s) => s.category === filter);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
          <View style={{ alignItems: "center", marginTop: spacing.sm }}>
            <View style={styles.heroBadge}>
              <Ionicons name="school" size={14} color={colors.goldSoft} />
              <Txt variant="caption" color={colors.goldSoft} style={{ marginLeft: 6 }}>Scholarships & Grants</Txt>
            </View>
            <Txt variant="title" color={colors.white} center style={{ marginTop: spacing.md }}>
              Investing in Bright Futures
            </Txt>
            <Txt variant="body" color="rgba(255,255,255,0.75)" center style={{ marginTop: 6, maxWidth: 320 }}>
              The CK family supports deserving students and alumni in reaching their dreams.
            </Txt>
          </View>
          <View style={styles.statsRow}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statCell}>
                <Ionicons name={s.icon} size={18} color={colors.goldSoft} />
                <Txt style={{ fontFamily: fonts.display, color: colors.white, fontSize: 20, marginTop: 4 }}>{s.value}</Txt>
                <Txt variant="caption" color="rgba(255,255,255,0.7)" center style={{ marginTop: 2 }}>{s.label}</Txt>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterActive]}>
              <Txt style={{ fontFamily: filter === f ? fonts.bodyBold : fonts.bodyMedium, color: filter === f ? colors.navyDeep : colors.inkSoft, fontSize: 13 }}>
                {f}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>

        {/* Scholarship cards */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          {list.map((s) => (
            <View key={s.id} style={[styles.card, shadow.soft]}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={styles.sponsorAvatar}>
                  <Txt style={{ fontFamily: fonts.bodyBold, color: colors.white, fontSize: 14 }}>{s.sponsorInitials}</Txt>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Txt variant="heading" numberOfLines={2}>{s.title}</Txt>
                  <Txt variant="caption" style={{ marginTop: 1 }}>by {s.sponsor}</Txt>
                </View>
                <Chip label={s.status} tone={statusTone(s.status)} />
              </View>

              <Txt variant="body" style={{ marginTop: spacing.md }}>{s.description}</Txt>

              <View style={styles.amountRow}>
                <View>
                  <Txt style={{ fontFamily: fonts.display, color: colors.goldDeep, fontSize: 22 }}>{s.amount}</Txt>
                  <Txt variant="caption">{s.amountNote}</Txt>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Txt variant="label" color={colors.muted}>DEADLINE</Txt>
                  <Txt variant="bodyMedium" style={{ marginTop: 2 }}>{s.deadline}</Txt>
                </View>
              </View>

              <View style={styles.divider} />
              <Txt variant="label" color={colors.goldDeep} style={{ marginBottom: spacing.sm }}>ELIGIBILITY</Txt>
              {s.eligibility.map((e) => (
                <View key={e} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} style={{ marginTop: 2 }} />
                  <Txt variant="caption" color={colors.inkSoft} style={{ flex: 1, marginLeft: 8 }}>{e}</Txt>
                </View>
              ))}

              <Pressable
                style={[styles.applyBtn, s.status !== "Open" && styles.applyDisabled]}
                disabled={s.status !== "Open"}
                onPress={() => router.push("/contact")}
              >
                <Txt style={{ fontFamily: fonts.bodyBold, color: s.status === "Open" ? colors.navyDeep : colors.muted, fontSize: 14 }}>
                  {s.status === "Open" ? "Apply / Enquire" : s.status === "Closed" ? "Applications Closed" : "Opening Soon"}
                </Txt>
              </Pressable>
            </View>
          ))}
        </View>

        {/* How to apply */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Txt variant="label" color={colors.goldDeep} style={{ marginBottom: spacing.md, marginLeft: 4 }}>HOW TO APPLY</Txt>
          {STEPS.map((st, i) => (
            <View key={st.title} style={[styles.stepRow, shadow.soft]}>
              <View style={styles.stepNum}>
                <Txt style={{ fontFamily: fonts.display, color: colors.white, fontSize: 16 }}>{i + 1}</Txt>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name={st.icon} size={16} color={colors.goldDeep} />
                  <Txt variant="bodyMedium" style={{ marginLeft: 6 }}>{st.title}</Txt>
                </View>
                <Txt variant="caption" style={{ marginTop: 2 }}>{st.description}</Txt>
              </View>
            </View>
          ))}
        </View>

        <Ornament style={{ marginTop: spacing.xl }} />
        <Txt variant="caption" center style={{ marginTop: spacing.md }}>
          For queries, reach out to the CK Alumni office.
        </Txt>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  heroBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill },
  statsRow: { flexDirection: "row", marginTop: spacing.xl, gap: spacing.sm },
  statCell: { flex: 1, alignItems: "center" },
  filterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.paperDim, borderWidth: 1, borderColor: colors.line },
  filterActive: { backgroundColor: colors.goldSoft, borderColor: colors.goldSoft },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  sponsorAvatar: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: spacing.md },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  applyBtn: { marginTop: spacing.md, backgroundColor: colors.goldSoft, paddingVertical: 13, borderRadius: radius.md, alignItems: "center" },
  applyDisabled: { backgroundColor: colors.paperDim },
  stepRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
});
