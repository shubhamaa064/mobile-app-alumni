import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, Linking, Platform, AppState, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { PageHeader } from "@/components/PageHeader";
import { Txt } from "@/components/Text";
import { colors, fonts, radius, spacing, shadow } from "@/theme";
import { CHANNELS, getPermissionStatus, requestPermission, presentNow, scheduleIn } from "@/lib/notifications";

export default function NotifySettingsScreen() {
  const [status, setStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => setStatus(await getPermissionStatus());
  useEffect(() => {
    refresh();
    // Re-check when the user comes back from system settings (the app goes
    // background → settings → foreground), so the status reflects their change.
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => sub.remove();
  }, []);

  const granted = status === "granted";

  const onEnable = async () => {
    setBusy(true);
    const { granted: ok, canAskAgain } = await requestPermission();
    setBusy(false);
    await refresh();
    if (ok) return;
    if (Platform.OS === "web") {
      Alert.alert("Open the app", "Notifications work in the installed CTK Alumni app — open it on your phone to turn them on.");
      return;
    }
    // Hard-denied (or the system won't prompt again): guide them to settings.
    if (!canAskAgain) {
      Alert.alert(
        "Notifications are blocked",
        "Turn on notifications for CTK Alumni in your device settings to get reunion reminders and Wall of Fame moments.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings().catch(() => {}) },
        ],
      );
    }
  };

  const sendTest = async () => {
    await presentNow("Hello from CTK Alumni 🎓", "This is how your alerts will look. Tap to open the app.", {
      type: "general",
      channelId: "general",
    });
  };

  const tryReminder = async () => {
    await scheduleIn(5, "Reunion reminder 🎓", "Your batch meet is coming up — see you there!", {
      type: "event",
      channelId: "events",
    });
  };

  return (
    <View style={styles.screen}>
      <PageHeader eyebrow="Stay in the loop" title="Notifications" back />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {/* Permission status */}
        <View style={[styles.statusCard, shadow.soft]}>
          <View style={[styles.statusIcon, { backgroundColor: granted ? "rgba(60,122,87,0.14)" : "rgba(200,162,75,0.16)" }]}>
            <Ionicons
              name={granted ? "checkmark-circle" : "notifications"}
              size={26}
              color={granted ? colors.success : colors.goldDeep}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Txt variant="heading">{granted ? "Alerts are on" : "Turn on alerts"}</Txt>
            <Txt variant="caption" style={{ marginTop: 2 }}>
              {granted
                ? "You'll hear about reunions, news and updates."
                : "Never miss a reunion reminder or a Wall of Fame moment."}
            </Txt>
          </View>
          {!granted ? (
            <Pressable style={styles.enableBtn} onPress={onEnable} disabled={busy}>
              <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 13 }}>Enable</Txt>
            </Pressable>
          ) : null}
        </View>

        {/* Channels */}
        <Txt variant="label" color={colors.goldDeep} style={{ marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 4 }}>
          WHAT YOU'LL HEAR ABOUT
        </Txt>
        <View style={[styles.menuCard, shadow.soft]}>
          {CHANNELS.map((ch, i) => (
            <View key={ch.id} style={[styles.channelRow, i < CHANNELS.length - 1 && styles.divider]}>
              <View style={styles.channelIcon}>
                <Ionicons name={ch.icon} size={18} color={colors.navy} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Txt variant="bodyMedium">{ch.name}</Txt>
                <Txt variant="caption">{ch.description}</Txt>
              </View>
            </View>
          ))}
        </View>
        {Platform.OS === "android" ? (
          <Pressable onPress={() => Linking.openSettings().catch(() => {})} style={styles.linkRow}>
            <Ionicons name="options-outline" size={15} color={colors.navy} />
            <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.navy, marginLeft: 6 }}>
              Fine-tune each category in system settings
            </Txt>
          </Pressable>
        ) : null}

        {/* Try it */}
        <Txt variant="label" color={colors.goldDeep} style={{ marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 4 }}>
          TRY IT OUT
        </Txt>
        <View style={[styles.menuCard, shadow.soft]}>
          <Pressable style={[styles.channelRow, styles.divider]} onPress={sendTest}>
            <View style={styles.channelIcon}>
              <Ionicons name="paper-plane" size={17} color={colors.navy} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="bodyMedium">Send a test notification</Txt>
              <Txt variant="caption">See it land right now</Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
          <Pressable style={styles.channelRow} onPress={tryReminder}>
            <View style={styles.channelIcon}>
              <Ionicons name="alarm" size={17} color={colors.navy} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Txt variant="bodyMedium">Preview a reunion reminder</Txt>
              <Txt variant="caption">Arrives in 5 seconds</Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  enableBtn: { backgroundColor: colors.goldSoft, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  menuCard: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden" },
  channelRow: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(200,162,75,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  linkRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, marginLeft: 4 },
});
