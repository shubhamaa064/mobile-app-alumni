import React from "react";
import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "subtitle"
  | "body"
  | "bodyMedium"
  | "label"
  | "caption"
  | "hand";

const stylesByVariant: Record<Variant, object> = {
  display: { fontFamily: fonts.displayBlack, fontSize: 34, lineHeight: 40, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.ink },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.ink },
  subtitle: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 24, color: colors.inkSoft },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.inkSoft },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, color: colors.ink },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.4, color: colors.muted },
  caption: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted },
  hand: { fontFamily: fonts.handBold, fontSize: 22, color: colors.gold },
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

export function Txt({ variant = "body", color, center, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[
        stylesByVariant[variant],
        color ? { color } : null,
        center ? styles.center : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({ center: { textAlign: "center" } });
