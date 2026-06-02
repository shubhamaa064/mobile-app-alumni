import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, type Principal, type PrincipalTenure } from "@/lib/api";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Loader } from "@/components/ui";

function tenureLabel(t: PrincipalTenure): string {
  const start = t.startYear ?? "";
  const end = t.endYear ?? (t.startYear ? "present" : "");
  if (!start && !end) return t.notes ?? "";
  return `${start}${end ? `–${end}` : ""}`;
}

export default function PrincipalsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["principals"], queryFn: api.principals });
  const principals = [...(data || [])].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="50+ years of legacy" title="Our Principals" subtitle="Guiding lights of Christ The King" />
      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={principals}
          keyExtractor={(p: Principal) => p.id}
          renderItem={({ item }) => {
            const tenure = item.tenures?.map(tenureLabel).filter(Boolean).join("  ·  ");
            return (
              <View style={[styles.card, shadow.soft]}>
                {item.profileImage ? (
                  <Image source={{ uri: item.profileImage }} style={styles.photo} contentFit="cover" transition={250} />
                ) : (
                  <View style={[styles.photo, styles.photoFallback]}>
                    <Ionicons name="person" size={28} color={colors.gold} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Txt variant="heading">{item.name}</Txt>
                  {tenure ? (
                    <Txt style={{ fontFamily: fonts.handBold, fontSize: 16, color: colors.goldDeep, marginTop: 1 }}>{tenure}</Txt>
                  ) : null}
                  {item.bio ? (
                    <Txt variant="caption" style={{ marginTop: 4 }} numberOfLines={4}>
                      {item.bio}
                    </Txt>
                  ) : null}
                  {item.tenures?.some((t) => t.notes) ? (
                    <Txt variant="caption" style={{ marginTop: 4, fontStyle: "italic" }} numberOfLines={2}>
                      {item.tenures.find((t) => t.notes)?.notes}
                    </Txt>
                  ) : null}
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="school-outline" title="Coming soon" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { flexDirection: "row", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  photo: { width: 72, height: 72, borderRadius: radius.md },
  photoFallback: { backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
});
