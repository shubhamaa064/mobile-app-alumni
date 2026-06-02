import React from "react";
import { View, FlatList, StyleSheet, Image, Linking, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, type Leader, type LeaderMember } from "@/lib/api";
import { colors, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Loader } from "@/components/ui";

function MemberRow({ member }: { member: LeaderMember }) {
  const years =
    member.startYear || member.endYear
      ? `${member.startYear ?? ""}${member.endYear ? `–${member.endYear}` : member.isCurrent ? "–present" : ""}`
      : null;
  return (
    <View style={styles.member}>
      {member.profileImage ? (
        <Image source={{ uri: member.profileImage }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Ionicons name="person" size={20} color={colors.gold} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.nameRow}>
          <Txt variant="heading" numberOfLines={1} style={{ flex: 1 }}>
            {member.name}
          </Txt>
          {member.isCurrent ? (
            <View style={styles.currentPill}>
              <Txt variant="caption" style={styles.currentPillText}>
                Current
              </Txt>
            </View>
          ) : null}
        </View>
        {member.batchYear ? (
          <Txt variant="caption" style={{ marginTop: 2 }}>
            Batch of {member.batchYear}
            {years ? `  ·  ${years}` : ""}
          </Txt>
        ) : years ? (
          <Txt variant="caption" style={{ marginTop: 2 }}>
            {years}
          </Txt>
        ) : null}
        {member.bio ? (
          <Txt variant="caption" style={{ marginTop: 4 }} numberOfLines={3}>
            {member.bio}
          </Txt>
        ) : null}
        {member.linkedinUrl ? (
          <Pressable onPress={() => Linking.openURL(member.linkedinUrl!)} style={styles.linkRow} hitSlop={8}>
            <Ionicons name="logo-linkedin" size={14} color={colors.navy} />
            <Txt variant="caption" style={styles.linkText}>
              LinkedIn
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function LeadershipScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["leadership"], queryFn: api.leadership });
  const groups = (data?.data || []).filter((g) => g.isActive !== false);

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="At the helm" title="Leadership" subtitle="The office bearers serving CTK" />
      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(l: Leader) => l.id}
          renderItem={({ item }) => (
            <View style={[styles.card, shadow.soft]}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Ionicons name="ribbon" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Txt variant="title" numberOfLines={2}>
                    {item.name}
                  </Txt>
                  {item.description ? (
                    <Txt variant="caption" style={{ marginTop: 2 }} numberOfLines={2}>
                      {item.description}
                    </Txt>
                  ) : null}
                </View>
              </View>
              {item.members.length ? (
                <View style={styles.members}>
                  {[...item.members]
                    .sort((a, b) => a.order - b.order)
                    .map((m) => (
                      <MemberRow key={m.id} member={m} />
                    ))}
                </View>
              ) : (
                <Txt variant="caption" style={styles.vacant}>
                  Position currently vacant
                </Txt>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="people-circle-outline" title="Coming soon" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  members: { marginTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: spacing.sm },
  member: { flexDirection: "row", alignItems: "flex-start", paddingVertical: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.paper },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center" },
  currentPill: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginLeft: spacing.sm },
  currentPillText: { color: colors.gold, fontSize: 10 },
  linkRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  linkText: { color: colors.navy, marginLeft: 4 },
  vacant: { marginTop: spacing.md, fontStyle: "italic" },
});
