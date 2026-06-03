/**
 * "Alumni Around the World" — a mobile-native geographic discovery screen.
 *
 * Instead of porting the web's interactive SVG world map (which doesn't run in
 * React Native and is fiddly on a phone), this delivers the same value as a
 * ranked drill-down list: World (countries) → Country (states) → State (alumni).
 * Tapping an alum opens their full profile. Powered by the existing public
 * /api/analytics/map endpoint — no backend changes.
 */
import React, { useState } from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, type CountryCount, type StateCount, type MapAlumnus } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { EmptyState, Loader } from "@/components/ui";
import { initials } from "@/lib/format";

type Level =
  | { kind: "world" }
  | { kind: "country"; country: string }
  | { kind: "state"; country: string; state: string };

export default function AlumniMapScreen() {
  const [level, setLevel] = useState<Level>({ kind: "world" });

  const countries = useQuery({
    queryKey: ["map", "countries"],
    queryFn: api.mapCountries,
    enabled: level.kind === "world",
  });
  const states = useQuery({
    queryKey: ["map", "states", level.kind !== "world" ? level.country : null],
    queryFn: () => api.mapStates((level as { country: string }).country),
    enabled: level.kind === "country",
  });
  const alumni = useQuery({
    queryKey: ["map", "alumni", level.kind === "state" ? `${level.country}/${level.state}` : null],
    queryFn: () => api.mapAlumni((level as { country: string }).country, (level as { state: string }).state),
    enabled: level.kind === "state",
  });

  const goUp = () => {
    if (level.kind === "state") setLevel({ kind: "country", country: level.country });
    else if (level.kind === "country") setLevel({ kind: "world" });
    else router.canGoBack() ? router.back() : router.replace("/(tabs)");
  };

  const subtitle =
    level.kind === "world"
      ? "Tap a country to explore the CTK family across the globe"
      : level.kind === "country"
        ? level.country
        : `${level.state}, ${level.country}`;

  return (
    <View style={styles.container}>
      <PageHeader
        eyebrow="The CTK family, worldwide"
        title="Alumni Around the World"
        subtitle={subtitle}
        back
      />

      {/* Breadcrumb (only past the world level) */}
      {level.kind !== "world" ? (
        <View style={styles.crumbs}>
          <Crumb label="World" onPress={() => setLevel({ kind: "world" })} />
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
          {level.kind === "state" ? (
            <>
              <Crumb label={level.country} onPress={() => setLevel({ kind: "country", country: level.country })} />
              <Ionicons name="chevron-forward" size={13} color={colors.muted} />
              <Crumb label={level.state} active />
            </>
          ) : (
            <Crumb label={level.country} active />
          )}
        </View>
      ) : null}

      {level.kind === "world" ? (
        <RankedList
          query={countries}
          icon="earth-outline"
          emptyText="No location data yet."
          rows={(countries.data ?? [])
            .filter((r: CountryCount) => r.country.trim())
            .map((r: CountryCount) => ({ key: r.country, label: r.country, count: r.count }))}
          onPress={(key) => setLevel({ kind: "country", country: key })}
        />
      ) : null}

      {level.kind === "country" ? (
        <RankedList
          query={states}
          icon="location-outline"
          emptyText="No state-level data for this country."
          rows={(states.data ?? [])
            .filter((r: StateCount) => r.state.trim())
            .map((r: StateCount) => ({ key: r.state, label: r.state, count: r.count }))}
          onPress={(key) =>
            setLevel({ kind: "state", country: (level as { country: string }).country, state: key })
          }
        />
      ) : null}

      {level.kind === "state" ? (
        alumni.isLoading ? (
          <Loader label="Loading alumni…" />
        ) : (
          <FlatList
            data={alumni.data ?? []}
            keyExtractor={(a: MapAlumnus) => a.id}
            renderItem={({ item }) => <AlumnusRow a={item} onPress={() => router.push(`/alumni/${item.id}`)} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon="people-outline" title="No alumni here yet" subtitle="Be the first to put this place on the map." />}
          />
        )
      ) : null}
    </View>
  );
}

function Crumb({ label, onPress, active }: { label: string; onPress?: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={active} hitSlop={4}>
      <Txt
        numberOfLines={1}
        style={{
          fontFamily: active ? fonts.bodyBold : fonts.bodySemi,
          fontSize: 12.5,
          color: active ? colors.ink : colors.goldDeep,
          maxWidth: 130,
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

function RankedList({
  query,
  rows,
  icon,
  emptyText,
  onPress,
}: {
  query: { isLoading: boolean; isError: boolean };
  rows: { key: string; label: string; count: number }[];
  icon: keyof typeof Ionicons.glyphMap;
  emptyText: string;
  onPress: (key: string) => void;
}) {
  if (query.isLoading) return <Loader label="Mapping the family…" />;
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.key}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onPress(item.key)}>
          <View style={styles.rowIcon}>
            <Ionicons name={icon} size={18} color={colors.goldDeep} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={styles.rowTop}>
              <Txt variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>{item.label}</Txt>
              <Txt style={styles.count}>{item.count.toLocaleString()}</Txt>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.max(6, (item.count / max) * 100)}%` }]} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: spacing.sm }} />
        </Pressable>
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        query.isError
          ? <EmptyState icon="cloud-offline-outline" title="Couldn't load" subtitle="Check your connection and try again." />
          : <EmptyState icon="map-outline" title="Nothing here yet" subtitle={emptyText} />
      }
    />
  );
}

function AlumnusRow({ a, onPress }: { a: MapAlumnus; onPress: () => void }) {
  const sub = [a.profession, a.company].filter(Boolean).join(" · ") || (a.batchYear ? `Batch of ${a.batchYear}` : "CTK Alumni");
  const city = a.currentAddress?.city;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar uri={a.imageUrl} initials={initials(a.firstName, a.lastName)} size={46} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Txt variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>{a.firstName} {a.lastName}</Txt>
          {a.isVerified ? <Ionicons name="checkmark-circle" size={15} color={colors.gold} style={{ marginLeft: 4 }} /> : null}
        </View>
        <Txt variant="caption" color={colors.muted} numberOfLines={1}>{sub}</Txt>
        {city ? <Txt variant="caption" color={colors.goldDeep} numberOfLines={1}>{city}</Txt> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  crumbs: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(200,162,75,0.16)", alignItems: "center", justifyContent: "center" },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  count: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.paperDim, marginTop: 6, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.goldSoft },
});
