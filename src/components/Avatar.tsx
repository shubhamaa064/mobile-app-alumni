import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "@/theme";
import { Txt } from "./Text";

export function Avatar({
  uri,
  initials,
  size = 48,
  ring = true,
}: {
  uri?: string | null;
  initials: string;
  size?: number;
  ring?: boolean;
}) {
  const r = size / 2;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: r,
          borderWidth: ring ? 2 : 0,
          borderColor: colors.gold,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r }} contentFit="cover" transition={250} />
      ) : (
        <Txt style={{ fontFamily: fonts.display, fontSize: size * 0.36, color: colors.gold }}>{initials}</Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
