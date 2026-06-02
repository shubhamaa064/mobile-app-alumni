import React from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Survey } from "@/lib/api";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Bell } from "@/components/Bell";
import { Chip, EmptyState, Loader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function SurveysScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["surveys"], queryFn: api.surveys });
  const surveys = data?.data ?? [];

  return (
    <View style={styles.container}>
      <PageHeader eyebrow="Your voice matters" title="Surveys" subtitle="Help shape our community" right={<Bell />} />
      {isLoading ? (
        <Loader label="Loading surveys…" />
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={(s: Survey) => s.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="clipboard-outline" title="No active surveys" subtitle="Check back soon — new surveys appear here." />}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, shadow.soft]} onPress={() => router.push(`/survey/${item.id}`)}>
              <View style={styles.iconBox}>
                <Ionicons name="clipboard-outline" size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Txt variant="heading" numberOfLines={2}>{item.title}</Txt>
                {item.description ? (
                  <Txt variant="caption" numberOfLines={2} style={{ marginTop: 2 }}>{item.description}</Txt>
                ) : null}
                <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.sm, flexWrap: "wrap" }}>
                  <Chip label={`${item.questions.length} question${item.questions.length === 1 ? "" : "s"}`} tone="navy" icon="help-circle-outline" />
                  {item.isAnonymous ? <Chip label="Anonymous" tone="gold" icon="eye-off-outline" /> : null}
                  {item.closesAt ? <Chip label={`Closes ${formatDate(item.closesAt)}`} tone="neutral" icon="time-outline" /> : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  iconBox: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: "rgba(200,162,75,0.16)", alignItems: "center", justifyContent: "center" },
});
