import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts } from "@/theme";
import { useInbox } from "@/lib/inbox";
import { Txt } from "./Text";

/** Notification bell with an unread badge — drops into a PageHeader's `right` slot. */
export function Bell({ tint = colors.white }: { tint?: string }) {
  const { unread } = useInbox();
  return (
    <Pressable
      onPress={() => router.push("/inbox")}
      hitSlop={10}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      <Ionicons name="notifications-outline" size={21} color={tint} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Txt style={styles.badgeTxt}>{unread > 9 ? "9+" : String(unread)}</Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 1,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.maroon,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  badgeTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: colors.white,
    lineHeight: 12,
  },
});
