import React from "react";
import { View, StyleSheet, ActivityIndicator, Pressable, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "./Text";

/** Gold-flanked section header with an "eyebrow" label and serif title. */
export function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <View style={styles.eyebrowRow}>
            <View style={styles.goldBar} />
            <Txt variant="label" color={colors.goldDeep}>
              {eyebrow.toUpperCase()}
            </Txt>
          </View>
        ) : null}
        <Txt variant="title">{title}</Txt>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.linkBtn}>
          <Txt variant="label" color={colors.navy} style={{ letterSpacing: 0.5 }}>
            {action}
          </Txt>
          <Ionicons name="arrow-forward" size={14} color={colors.navy} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  icon,
  tone = "neutral",
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: "neutral" | "gold" | "navy" | "ghost";
}) {
  const palette = {
    neutral: { bg: colors.paperDim, fg: colors.inkSoft, bd: colors.line },
    gold: { bg: "rgba(200,162,75,0.16)", fg: colors.goldDeep, bd: "rgba(200,162,75,0.4)" },
    navy: { bg: "rgba(20,33,61,0.08)", fg: colors.navy, bd: "rgba(20,33,61,0.18)" },
    ghost: { bg: "rgba(255,255,255,0.14)", fg: colors.white, bd: "rgba(255,255,255,0.3)" },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.bd }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette.fg} style={{ marginRight: 5 }} /> : null}
      <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, color: palette.fg, letterSpacing: 0.3 }}>{label}</Txt>
    </View>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.gold} size="large" />
      {label ? (
        <Txt variant="caption" style={{ marginTop: spacing.md }}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "leaf-outline",
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.gold} />
      </View>
      <Txt variant="heading" center style={{ marginTop: spacing.md }}>
        {title}
      </Txt>
      {subtitle ? (
        <Txt variant="caption" center style={{ marginTop: 4, maxWidth: 260 }}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

/** A decorative divider: a thin rule with a small gold diamond in the middle. */
export function Ornament({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.ornament, style]}>
      <View style={styles.ornLine} />
      <Ionicons name="diamond" size={10} color={colors.gold} style={{ marginHorizontal: 10 }} />
      <View style={styles.ornLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  goldBar: { width: 18, height: 2, backgroundColor: colors.gold, marginRight: 8, borderRadius: 2 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(200,162,75,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  ornament: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  ornLine: { width: 40, height: 1, backgroundColor: colors.line },
});
