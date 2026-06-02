import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform, Linking, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBack } from "@/lib/nav";
import { Txt } from "@/components/Text";
import { Logo } from "@/components/Logo";
import { colors, fonts, gradients, radius, spacing } from "@/theme";
import { CHANNELS, requestPermission, presentNow } from "@/lib/notifications";

export default function NotifyPrimerScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const close = goBack;

  const onAllow = async () => {
    setBusy(true);
    const { granted, canAskAgain } = await requestPermission();
    setBusy(false);
    if (granted) {
      // A warm welcome — and the first item for their inbox.
      presentNow(
        "Welcome to the CTK family 🎓",
        "We'll keep you posted on reunions, news and memories.",
        { type: "general", channelId: "general" },
      ).catch(() => {});
      close();
      return;
    }
    // Hard-denied: the OS won't prompt again, so point them to settings.
    if (Platform.OS !== "web" && !canAskAgain) {
      Alert.alert(
        "Notifications are off",
        "You can turn them on anytime for CTK Alumni in your device settings.",
        [
          { text: "Not now", style: "cancel", onPress: close },
          {
            text: "Open Settings",
            onPress: () => {
              Linking.openSettings().catch(() => {});
              close();
            },
          },
        ],
      );
      return;
    }
    close();
  };

  return (
    <LinearGradient colors={gradients.hero} style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <Pressable onPress={close} hitSlop={10} style={[styles.skip, { top: insets.top + spacing.md }]}>
        <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Not now</Txt>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.bellWrap}>
          <Ionicons name="notifications" size={40} color={colors.navyDeep} />
        </View>
        <View style={{ marginTop: spacing.xl, alignItems: "center" }}>
          <Logo height={76} plate />
        </View>
        <Txt style={styles.hand}>never miss a moment</Txt>
        <Txt variant="display" center color={colors.white} style={{ marginTop: 2 }}>
          Stay in the loop
        </Txt>
        <Txt variant="body" center color="rgba(255,255,255,0.78)" style={{ marginTop: spacing.md, maxWidth: 320 }}>
          Turn on alerts so the CTK community can reach you about what matters most.
        </Txt>
      </View>

      <View style={styles.card}>
        {CHANNELS.map((ch, i) => (
          <View key={ch.id} style={[styles.row, i < CHANNELS.length - 1 && styles.divider]}>
            <View style={styles.icon}>
              <Ionicons name={ch.icon} size={18} color={colors.goldDeep} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="bodyMedium">{ch.name}</Txt>
              <Txt variant="caption">{ch.description}</Txt>
            </View>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
        <Pressable style={styles.allowBtn} onPress={onAllow} disabled={busy}>
          <Ionicons name="notifications" size={18} color={colors.navyDeep} />
          <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 15, marginLeft: 8 }}>
            Turn on notifications
          </Txt>
        </Pressable>
        <Txt variant="caption" center color="rgba(255,255,255,0.55)" style={{ marginTop: spacing.md }}>
          You can fine-tune or turn these off anytime in Settings.
        </Txt>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between" },
  skip: { position: "absolute", right: spacing.lg, zIndex: 10, padding: 6 },
  hero: { alignItems: "center", paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  bellWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  hand: { fontFamily: fonts.handBold, fontSize: 22, color: colors.goldSoft, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xs,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(200,162,75,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  allowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldSoft,
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
});
