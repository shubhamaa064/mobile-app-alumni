import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, gradients } from "@/theme";
import { Txt } from "./Text";

/** Regal CTK monogram inside an antique-gold ring, topped with a small crown. */
export function Crest({ size = 64 }: { size?: number }) {
  const ring = size;
  return (
    <View style={{ alignItems: "center" }}>
      <Ionicons name="ribbon" size={size * 0.32} color={colors.gold} style={{ marginBottom: -size * 0.13, zIndex: 2 }} />
      <LinearGradient
        colors={gradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2 }]}
      >
        <View style={[styles.inner, { width: ring - 8, height: ring - 8, borderRadius: (ring - 8) / 2 }]}>
          <Txt style={{ fontFamily: fonts.displayBlack, fontSize: size * 0.36, color: colors.gold, letterSpacing: 1 }}>
            CTK
          </Txt>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: "center", justifyContent: "center" },
  inner: {
    backgroundColor: colors.navyDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(200,162,75,0.4)",
  },
});
