import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { colors, fonts, gradients, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Chip, Loader, Ornament } from "@/components/ui";
import { formatDate, titleCase } from "@/lib/format";

export default function NewsDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: article, isLoading, isError } = useQuery({ queryKey: ["news", id], queryFn: () => api.newsItem(id) });

  if (isLoading) return <View style={styles.container}><Loader label="Loading…" /></View>;

  if (isError || !article || typeof article.content !== "string") {
    return (
      <View style={[styles.container, styles.center]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { top: insets.top + 8, backgroundColor: colors.navy }]} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <Ionicons name="newspaper-outline" size={64} color={colors.muted} />
        <Txt variant="heading" center style={{ marginTop: spacing.md }}>
          Story unavailable
        </Txt>
        <Txt variant="body" center color={colors.muted} style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          We couldn't load this article. Please check your connection and try again.
        </Txt>
        <Pressable onPress={goBack} style={styles.emptyBtn}>
          <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 14 }}>Go back</Txt>
        </Pressable>
      </View>
    );
  }

  const hasImage = !!article.imageUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, !hasImage && { backgroundColor: colors.navy }]}>
        {hasImage ? (
          <Image source={{ uri: article.imageUrl! }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="ribbon" size={64} color={colors.gold} />
          </View>
        )}
        <LinearGradient colors={gradients.scrim} style={StyleSheet.absoluteFill} />
        <Pressable onPress={goBack} style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <View style={styles.heroText}>
          <Chip label={titleCase(article.category)} tone="gold" />
          <Txt variant="title" color={colors.white} style={{ marginTop: 8 }}>
            {article.title}
          </Txt>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={18} color={colors.gold} />
          <Txt variant="caption" style={{ marginLeft: 6 }}>
            {article.author} · {formatDate(article.publishedAt)}
          </Txt>
        </View>
        <Ornament style={{ marginVertical: spacing.lg }} />
        <Txt variant="body" style={{ fontSize: 16, lineHeight: 26 }}>
          {article.content.replace(/\r\n/g, "\n")}
        </Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill },
  hero: { height: 280, justifyContent: "flex-end" },
  backBtn: { position: "absolute", left: spacing.lg, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(12,23,48,0.5)", alignItems: "center", justifyContent: "center" },
  heroText: { padding: spacing.lg },
  body: { padding: spacing.lg },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
});
