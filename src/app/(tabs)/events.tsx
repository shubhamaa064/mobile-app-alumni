import React, { useState } from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, type EventItem } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Bell } from "@/components/Bell";
import { EventCard } from "@/components/cards";
import { EmptyState, Loader } from "@/components/ui";

const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Memories" },
  { key: "all", label: "All" },
] as const;

export default function EventsScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("upcoming");

  const query = useQuery({
    queryKey: ["events", filter],
    queryFn: () => api.events({ status: filter === "all" ? undefined : filter, limit: 50 }),
  });

  const data = query.data?.data || [];

  return (
    <View style={styles.container}>
      <PageHeader eyebrow="Reunions & meets" title="Events" subtitle="Moments worth coming back for" right={<Bell />} />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable key={f.key} style={[styles.pill, active && styles.pillActive]} onPress={() => setFilter(f.key)}>
              <Txt
                style={{
                  fontFamily: fonts.bodySemi,
                  fontSize: 13,
                  color: active ? colors.navyDeep : colors.inkSoft,
                }}
              >
                {f.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? (
        <Loader label="Loading events…" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: EventItem) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="No events here yet" subtitle="Check back soon for the next gathering." />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  filterRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.paperDim,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillActive: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
});
