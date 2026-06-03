import React, { useMemo, useState } from "react";
import { View, FlatList, StyleSheet, TextInput, Pressable, ScrollView, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api, type AlumniUser } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Bell } from "@/components/Bell";
import { AlumniCard } from "@/components/cards";
import { EmptyState, Loader } from "@/components/ui";
import { useDebounced } from "@/lib/useDebounced";

const PAGE_SIZE = 24;

// Mirror the web directory's filter options (app/alumni/AlumniClient.tsx).
const BATCH_YEARS = Array.from({ length: 20 }, (_, i) => 2025 - i);
const COUNTRIES = ["India", "USA", "UK", "Canada", "Germany", "Australia", "Singapore", "UAE", "France", "Japan"];
const PROFESSIONS = ["Software Engineer", "Doctor", "Entrepreneur", "Teacher", "Banker", "Lawyer", "Consultant", "Designer", "Manager", "Researcher"];

export default function AlumniScreen() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 350);

  const [batch, setBatch] = useState("");
  const [country, setCountry] = useState("");
  const [profession, setProfession] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = [batch, country, profession].filter(Boolean).length;

  const query = useInfiniteQuery({
    queryKey: ["alumni", debounced, batch, country, profession],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.alumni({
        search: debounced || undefined,
        batch: batch || undefined,
        country: country || undefined,
        profession: profession || undefined,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (last) => {
      const loaded = last.page * last.limit;
      return loaded < last.total ? last.page + 1 : undefined;
    },
  });

  const data = useMemo(
    () => (query.data?.pages.flatMap((p) => p.data) || []).filter((u) => u.alumniProfile),
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  const clearFilters = () => {
    setBatch("");
    setCountry("");
    setProfession("");
  };

  return (
    <View style={styles.container}>
      <PageHeader
        eyebrow="The CTK family"
        title="Alumni Directory"
        subtitle={query.data ? `${total}+ graduates and growing` : "Reconnect with old friends"}
        right={<Bell />}
      />

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, company, batch…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {search ? <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => setSearch("")} /> : null}
        </View>
        <Pressable
          onPress={() => setShowFilters(true)}
          style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]}
          hitSlop={6}
        >
          <Ionicons name="options-outline" size={20} color={activeFilters > 0 ? colors.navyDeep : colors.navy} />
          {activeFilters > 0 ? (
            <View style={styles.filterBadge}>
              <Txt style={styles.filterBadgeTxt}>{activeFilters}</Txt>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Active filter pills */}
      {activeFilters > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          keyboardShouldPersistTaps="handled"
        >
          {batch ? <ActivePill label={`Batch ${batch}`} onClear={() => setBatch("")} /> : null}
          {country ? <ActivePill label={country} onClear={() => setCountry("")} /> : null}
          {profession ? <ActivePill label={profession} onClear={() => setProfession("")} /> : null}
          <Pressable onPress={clearFilters} style={styles.clearAll} hitSlop={6}>
            <Txt style={styles.clearAllTxt}>Clear all</Txt>
          </Pressable>
        </ScrollView>
      ) : null}

      {query.isLoading ? (
        <Loader label="Finding alumni…" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(u: AlumniUser) => u.id}
          renderItem={({ item }) => <AlumniCard user={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={colors.goldDeep} style={{ marginVertical: spacing.lg }} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No alumni found"
              subtitle={activeFilters > 0 ? "Try widening your filters." : "Try a different name or batch year."}
            />
          }
        />
      )}

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        batch={batch}
        country={country}
        profession={profession}
        setBatch={setBatch}
        setCountry={setCountry}
        setProfession={setProfession}
        onClear={clearFilters}
        activeFilters={activeFilters}
      />
    </View>
  );
}

function ActivePill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Pressable onPress={onClear} style={styles.pill} hitSlop={4}>
      <Txt style={styles.pillTxt}>{label}</Txt>
      <Ionicons name="close" size={13} color={colors.goldDeep} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

function FilterSheet({
  visible,
  onClose,
  batch,
  country,
  profession,
  setBatch,
  setCountry,
  setProfession,
  onClear,
  activeFilters,
}: {
  visible: boolean;
  onClose: () => void;
  batch: string;
  country: string;
  profession: string;
  setBatch: (v: string) => void;
  setCountry: (v: string) => void;
  setProfession: (v: string) => void;
  onClear: () => void;
  activeFilters: number;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHead}>
          <Txt variant="title" color={colors.ink}>Filter alumni</Txt>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          <FilterGroup
            title="Batch year"
            options={BATCH_YEARS.map(String)}
            value={batch}
            onChange={setBatch}
          />
          <FilterGroup title="Country" options={COUNTRIES} value={country} onChange={setCountry} />
          <FilterGroup title="Profession" options={PROFESSIONS} value={profession} onChange={setProfession} />
        </ScrollView>

        <View style={styles.sheetActions}>
          <Pressable
            onPress={onClear}
            disabled={activeFilters === 0}
            style={[styles.sheetBtn, styles.sheetBtnGhost, activeFilters === 0 && { opacity: 0.4 }]}
          >
            <Txt style={styles.sheetBtnGhostTxt}>Clear</Txt>
          </Pressable>
          <Pressable onPress={onClose} style={[styles.sheetBtn, styles.sheetBtnPrimary]}>
            <Txt style={styles.sheetBtnPrimaryTxt}>
              {activeFilters > 0 ? `Show results` : "Done"}
            </Txt>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Txt style={styles.groupTitle}>{title}</Txt>
      <View style={styles.optionWrap}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(selected ? "" : opt)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Txt style={[styles.optionTxt, selected && styles.optionTxtSelected]}>{opt}</Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: colors.goldSoft, borderColor: colors.goldDeep },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeTxt: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 10.5 },

  pillRow: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.sm, alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200,162,75,0.16)",
    borderWidth: 1,
    borderColor: "rgba(200,162,75,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  pillTxt: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.goldDeep },
  clearAll: { paddingVertical: 6, paddingHorizontal: 8 },
  clearAllTxt: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, textDecorationLine: "underline" },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },

  backdrop: { flex: 1, backgroundColor: "rgba(12,23,48,0.45)" },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: "82%",
  },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: spacing.md },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  groupTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: spacing.sm },
  optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  optionSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  optionTxt: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.inkSoft },
  optionTxtSelected: { color: colors.white },

  sheetActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  sheetBtn: { flex: 1, paddingVertical: 15, borderRadius: radius.pill, alignItems: "center" },
  sheetBtnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  sheetBtnGhostTxt: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft },
  sheetBtnPrimary: { backgroundColor: colors.navy, flex: 1.6 },
  sheetBtnPrimaryTxt: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white },
});
