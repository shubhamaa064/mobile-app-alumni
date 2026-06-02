import React, { useState } from "react";
import { View, FlatList, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api, type AlumniUser } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Bell } from "@/components/Bell";
import { AlumniCard } from "@/components/cards";
import { EmptyState, Loader } from "@/components/ui";
import { useDebounced } from "@/lib/useDebounced";

export default function AlumniScreen() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 350);

  const query = useQuery({
    queryKey: ["alumni", debounced],
    queryFn: () => api.alumni({ search: debounced || undefined, limit: 40 }),
    placeholderData: keepPreviousData,
  });

  const data = (query.data?.data || []).filter((u) => u.alumniProfile);

  return (
    <View style={styles.container}>
      <PageHeader
        eyebrow="The CTK family"
        title="Alumni Directory"
        subtitle={query.data ? `${query.data.total}+ graduates and growing` : "Reconnect with old friends"}
        right={<Bell />}
      />

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
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="No alumni found" subtitle="Try a different name or batch year." />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
});
