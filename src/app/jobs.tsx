import React from "react";
import { View, FlatList, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, type JobPost } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { JobCard } from "@/components/cards";
import { EmptyState, Loader } from "@/components/ui";

export default function JobsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => api.jobs({ limit: 50 }) });

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="The network gives back" title="Careers" subtitle="Opportunities shared by alumni" />
      {isLoading ? (
        <Loader label="Loading opportunities…" />
      ) : (
        <FlatList
          data={(data?.data || []).filter((j) => j.isActive)}
          keyExtractor={(j: JobPost) => j.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => item.link && Linking.openURL(item.link)}>
              <JobCard job={item} />
              {item.link ? (
                <View style={styles.applyHint}>
                  <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.navy }}>Tap to apply</Txt>
                  <Ionicons name="open-outline" size={13} color={colors.navy} />
                </View>
              ) : null}
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No open roles" subtitle="New opportunities will be posted here." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  applyHint: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-end", marginTop: -spacing.sm, marginBottom: spacing.md, marginRight: 4 },
});
