import React from "react";
import { View, SectionList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, type Birthday } from "@/lib/api";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { EmptyState, Loader } from "@/components/ui";
import { initials } from "@/lib/format";

function subtitleFor(b: Birthday): string {
  const bits = [b.profession, b.company].filter(Boolean);
  if (b.batch) bits.unshift(`Batch of ${b.batch}`);
  return bits.join("  ·  ");
}

export default function BirthdaysScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["birthdays"], queryFn: api.birthdays });

  const today = (data || []).filter((b) => b.birthday === "today");
  const week = (data || []).filter((b) => b.birthday === "this-week");
  const sections = [
    { key: "today", title: "Today", emoji: "🎂", data: today },
    { key: "week", title: "This week", emoji: "🎉", data: week },
  ].filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="Many happy returns" title="Birthdays" subtitle="Wish your batchmates well" />
      {isLoading ? (
        <Loader />
      ) : sections.length === 0 ? (
        <EmptyState icon="balloon-outline" title="No birthdays right now" subtitle="Check back soon to celebrate the CTK family." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(b: Birthday) => b.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Txt style={styles.sectionEmoji}>{section.emoji}</Txt>
              <Txt variant="heading">{section.title}</Txt>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[styles.card, shadow.soft]}>
              <Avatar uri={item.imageUrl} initials={initials(item.name)} size={52} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Txt variant="heading" numberOfLines={1}>
                  {item.name}
                </Txt>
                {subtitleFor(item) ? (
                  <Txt variant="caption" style={{ marginTop: 2 }} numberOfLines={1}>
                    {subtitleFor(item)}
                  </Txt>
                ) : null}
              </View>
              <Ionicons name="gift" size={22} color={colors.gold} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.sm },
  sectionEmoji: { fontSize: 18, marginRight: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});
