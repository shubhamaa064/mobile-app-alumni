/**
 * First-launch onboarding carousel.
 *
 * Shown once (guarded by the "ctk_onboarded" SecureStore flag, set from the
 * home screen's first-launch check). Introduces the app and routes new members
 * toward signing in. Purely presentational — no data fetching.
 */
import React, { useRef, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";

export const ONBOARDED_KEY = "ctk_onboarded";

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  hand: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: "people-circle-outline",
    hand: "welcome home",
    title: "The CTK family, reunited",
    body: "Reconnect with classmates, teachers and the people you grew up with — all in one place.",
  },
  {
    icon: "search-outline",
    hand: "find your batch",
    title: "Discover your alumni",
    body: "Browse the directory by batch, profession and country. See where everyone landed.",
  },
  {
    icon: "calendar-outline",
    hand: "never miss out",
    title: "Events, news & birthdays",
    body: "Reunions, the Wall of Fame and member birthdays — gently delivered to your pocket.",
  },
  {
    icon: "shield-checkmark-outline",
    hand: "make it yours",
    title: "Secure & personal",
    body: "Complete your profile and unlock the app with Face ID for quick, private access.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const finish = async (goToLogin: boolean) => {
    await SecureStore.setItemAsync(ONBOARDED_KEY, "1").catch(() => {});
    if (router.canGoBack()) router.back();
    if (goToLogin && !user) {
      // Slight defer so the modal dismiss animation doesn't fight navigation.
      setTimeout(() => router.push("/login"), 250);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else {
      void finish(true);
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <LinearGradient colors={gradients.hero} style={styles.container}>
      <Pressable onPress={() => finish(false)} style={[styles.skip, { top: insets.top + 8 }]} hitSlop={10}>
        <Txt style={styles.skipTxt}>Skip</Txt>
      </Pressable>

      <View style={{ alignItems: "center", marginTop: insets.top + spacing.xxl }}>
        <Logo height={64} plate />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={64} color={colors.goldSoft} />
            </View>
            <Txt style={styles.hand}>{s.hand}</Txt>
            <Txt variant="title" color={colors.white} center style={{ marginTop: 4 }}>{s.title}</Txt>
            <Txt variant="body" color="rgba(255,255,255,0.7)" center style={{ marginTop: spacing.md, maxWidth: 300 }}>
              {s.body}
            </Txt>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.cta} onPress={next}>
          <Txt style={styles.ctaTxt}>{isLast ? "Get started" : "Next"}</Txt>
          <Ionicons name="arrow-forward" size={18} color={colors.navyDeep} style={{ marginLeft: 6 }} />
        </Pressable>

        {isLast && !user ? (
          <Pressable onPress={() => finish(false)} style={{ marginTop: spacing.md }} hitSlop={8}>
            <Txt style={styles.laterTxt}>I'll explore first</Txt>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skip: { position: "absolute", right: spacing.lg, zIndex: 10, paddingHorizontal: spacing.md, paddingVertical: 6 },
  skipTxt: { fontFamily: fonts.bodySemi, color: "rgba(255,255,255,0.75)", fontSize: 14 },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  iconWrap: { width: 132, height: 132, borderRadius: 66, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  hand: { fontFamily: fonts.handBold, fontSize: 22, color: colors.goldSoft },
  footer: { paddingHorizontal: spacing.xl, alignItems: "center" },
  dots: { flexDirection: "row", gap: 8, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { width: 22, backgroundColor: colors.goldSoft },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, paddingVertical: 16, paddingHorizontal: spacing.xxl, borderRadius: radius.pill, alignSelf: "stretch", ...shadow.lift },
  ctaTxt: { fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 },
  laterTxt: { fontFamily: fonts.bodySemi, color: "rgba(255,255,255,0.7)", fontSize: 13.5 },
});
