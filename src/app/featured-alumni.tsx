import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, type AlumniUser } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { PageHeader } from "@/components/PageHeader";
import { AlumniCard } from "@/components/cards";
import { EmptyState, Loader } from "@/components/ui";

export default function FeaturedAlumniScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["alumni", "featured"],
    queryFn: () => api.alumni({ status: "verified", limit: 50 }),
  });

  const alumni = (data?.data || []).filter((u) => u.alumniProfile);

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="Pride of CTK" title="Featured Alumni" subtitle="Verified members of our community" />
      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={alumni}
          keyExtractor={(u: AlumniUser) => u.id}
          renderItem={({ item }) => <AlumniCard user={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="ribbon-outline" title="No featured alumni yet" subtitle="Verified members will appear here soon." />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
});
