import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBack } from "@/lib/nav";
import { colors, fonts, gradients, radius, spacing } from "@/theme";
import { Txt } from "./Text";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  back = false,
  right,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.row}>
        {back ? (
          <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <View style={styles.eyebrowRow}>
              <View style={styles.bar} />
              <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.goldSoft, letterSpacing: 1.4 }}>
                {eyebrow.toUpperCase()}
              </Txt>
            </View>
          ) : null}
          <Txt variant="title" color={colors.white}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="caption" color="rgba(255,255,255,0.72)" style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  bar: { width: 16, height: 2, backgroundColor: colors.gold, marginRight: 7, borderRadius: 2 },
});
