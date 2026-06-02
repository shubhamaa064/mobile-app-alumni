import React, { useState } from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, type NewsArticle } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { FameCard, NewsRow } from "@/components/cards";
import { EmptyState, Loader } from "@/components/ui";

export default function NewsScreen() {
  const [tab, setTab] = useState<"fame" | "news">("fame");

  const fame = useQuery({ queryKey: ["news", "fame", "all"], queryFn: () => api.news({ category: "wall_of_fame", limit: 60 }) });
  const news = useQuery({ queryKey: ["news", "general"], queryFn: () => api.news({ limit: 60 }) });

  const general = (news.data?.data || []).filter((a) => a.category !== "wall_of_fame");

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="Pride of CTK" title="Wall of Fame" subtitle="Celebrating our distinguished alumni" />

      <View style={styles.segment}>
        {(["fame", "news"] as const).map((t) => {
          const active = tab === t;
          return (
            <Pressable key={t} style={[styles.segBtn, active && styles.segActive]} onPress={() => setTab(t)}>
              <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: active ? colors.navyDeep : colors.inkSoft }}>
                {t === "fame" ? "Wall of Fame" : "News & Updates"}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {tab === "fame" ? (
        fame.isLoading ? (
          <Loader />
        ) : (
          <FlatList
            data={fame.data?.data || []}
            keyExtractor={(a: NewsArticle) => a.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <View style={{ width: "48%", marginBottom: spacing.lg }}>
                <FameCard article={item} full />
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon="ribbon-outline" title="No honourees yet" />}
          />
        )
      ) : news.isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={general}
          keyExtractor={(a: NewsArticle) => a.id}
          renderItem={({ item }) => <NewsRow article={item} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="newspaper-outline" title="No news yet" subtitle="Fresh updates will appear here." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  segment: { flexDirection: "row", margin: spacing.lg, backgroundColor: colors.paperDim, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.line },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: "center" },
  segActive: { backgroundColor: colors.goldSoft },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  sep: { height: 1, backgroundColor: colors.line },
});
