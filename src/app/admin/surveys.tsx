import React from "react";
import { View, FlatList } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState, Chip } from "@/components/ui";
import { AdminScreen, HeaderAction, adminList } from "@/components/admin";
import { formatDate } from "@/lib/format";

export default function SurveysAdmin() {
  const list = useQuery({ queryKey: ["surveys"], queryFn: api.surveys });

  return (
    <AdminScreen title="Surveys" admin headerRight={<HeaderAction icon="add" onPress={() => router.push("/admin/survey-create")} />}>
      {list.isLoading ? (
        <Loader label="Loading surveys…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(s) => s.id}
          contentContainerStyle={adminList.body}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="clipboard-outline" title="No surveys yet" subtitle="Tap + to create one." />}
          renderItem={({ item }) => (
            <View style={adminList.card}>
              <View style={adminList.row}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyMedium" numberOfLines={2}>{item.title}</Txt>
                  {item.description ? <Txt variant="caption" numberOfLines={1}>{item.description}</Txt> : null}
                </View>
                {item.isActive ? <Chip label="Active" tone="gold" /> : <Chip label="Closed" tone="neutral" />}
              </View>
              <View style={{ flexDirection: "row", marginTop: 6, gap: spacing.md, flexWrap: "wrap" }}>
                <Txt variant="caption" color={colors.muted}>{item.questions.length} questions</Txt>
                {item.isAnonymous ? <Txt variant="caption" color={colors.muted}>Anonymous</Txt> : null}
                {item.closesAt ? <Txt variant="caption" color={colors.muted}>Closes {formatDate(item.closesAt)}</Txt> : null}
              </View>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}
