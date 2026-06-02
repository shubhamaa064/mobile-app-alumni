import React from "react";
import { View, StyleSheet, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PageHeader } from "@/components/PageHeader";
import { Txt } from "@/components/Text";
import { EmptyState } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";
import { useInbox, type InboxItem } from "@/lib/inbox";
import { routeFromData, type NotifData } from "@/lib/notifications";
import { relativeTime } from "@/lib/format";

const ICON_FOR: Record<NonNullable<NotifData["type"]>, keyof typeof Ionicons.glyphMap> = {
  event: "calendar",
  news: "ribbon",
  alumni: "person",
  album: "images",
  job: "briefcase",
  general: "notifications",
};

function Row({
  item,
  onPress,
  onRemove,
}: {
  item: InboxItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const icon = ICON_FOR[item.data.type ?? "general"] ?? "notifications";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
        <Ionicons name={icon} size={18} color={item.read ? colors.muted : colors.goldDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Txt
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: item.read ? fonts.bodyMedium : fonts.bodySemi,
              fontSize: 14.5,
              color: colors.ink,
            }}
          >
            {item.title}
          </Txt>
          {!item.read ? <View style={styles.dot} /> : null}
        </View>
        {item.body ? (
          <Txt variant="caption" numberOfLines={2} style={{ marginTop: 2 }}>
            {item.body}
          </Txt>
        ) : null}
        <Txt style={styles.time}>{relativeTime(item.receivedAt)}</Txt>
      </View>
      <Pressable onPress={onRemove} hitSlop={10} style={styles.removeBtn}>
        <Ionicons name="close" size={15} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

export default function InboxScreen() {
  const { items, unread, markRead, markAllRead, remove, clear } = useInbox();

  const open = (item: InboxItem) => {
    markRead(item.id);
    router.push(routeFromData(item.data) as never);
  };

  return (
    <View style={styles.screen}>
      <PageHeader
        eyebrow="Stay in touch"
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up"}
        back
        right={
          items.length > 0 ? (
            <Pressable onPress={unread > 0 ? markAllRead : clear} hitSlop={8} style={styles.headerAction}>
              <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.goldSoft }}>
                {unread > 0 ? "Mark read" : "Clear"}
              </Txt>
            </Pressable>
          ) : undefined
        }
      />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={items.length === 0 ? styles.emptyPad : styles.listPad}
        renderItem={({ item }) => (
          <Row item={item} onPress={() => open(item)} onRemove={() => remove(item.id)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications yet"
            subtitle="Reunion reminders, Wall of Fame news and community updates will land here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  listPad: { padding: spacing.lg },
  emptyPad: { flexGrow: 1, justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.paperDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconWrapUnread: { backgroundColor: "rgba(200,162,75,0.16)" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.maroon },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 5 },
  removeBtn: { padding: 4, marginLeft: 6 },
  sep: { height: spacing.sm },
});
