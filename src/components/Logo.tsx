import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors, radius, shadow, spacing } from "@/theme";

const LOGO = require("@/assets/ctk-logo.webp");
const ASPECT = 1358 / 1920; // intrinsic width / height

/**
 * The official "Christ The King Alumni Association — To Serve Humanity" mark.
 * The artwork has dark navy lettering, so on dark surfaces pass `plate` to set
 * it on a cream card where every element stays legible.
 */
export function Logo({
  height = 96,
  plate = false,
  style,
}: {
  height?: number;
  plate?: boolean;
  style?: ViewStyle;
}) {
  const img = <Image source={LOGO} style={{ height, width: height * ASPECT }} contentFit="contain" transition={200} />;
  if (!plate) return <View style={[styles.center, style]}>{img}</View>;
  return <View style={[styles.plate, shadow.soft, style]}>{img}</View>;
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  plate: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardWarm,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(200,162,75,0.35)",
  },
});
