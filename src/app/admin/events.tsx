import React from "react";
import { View, FlatList, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, deleteEvent, type EventItem } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState, Chip } from "@/components/ui";
import { AdminScreen, HeaderAction, adminList } from "@/components/admin";
import { formatDate } from "@/lib/format";

export default function EventsAdmin() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["adminEvents"], queryFn: () => api.adminEvents({ limit: 50 }) });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const onDelete = (ev: EventItem) =>
    Alert.alert("Delete event", `Remove "${ev.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => delMut.mutate(ev.id) },
    ]);

  return (
    <AdminScreen
      title="Events"
      admin
      headerRight={<HeaderAction icon="add" onPress={() => router.push("/admin/event-edit")} />}
    >
      {list.isLoading ? (
        <Loader label="Loading events…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={adminList.body}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No events yet" subtitle="Tap + to create one." />}
          renderItem={({ item }) => (
            <View style={adminList.card}>
              <View style={adminList.row}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyMedium" numberOfLines={1}>{item.title}</Txt>
                  <Txt variant="caption" numberOfLines={1}>
                    {formatDate(item.date)}{item.location ? ` · ${item.location}` : ""}
                  </Txt>
                </View>
                <Chip label={item.status || "—"} tone={item.status === "UPCOMING" ? "gold" : "neutral"} />
              </View>
              <View style={{ flexDirection: "row", marginTop: 6, gap: spacing.md }}>
                <Txt variant="caption" color={colors.muted}>{item._count?.registrations ?? item.currentAttendees ?? 0} registered</Txt>
                {item.ticketPrice ? <Txt variant="caption" color={colors.muted}>₹{item.ticketPrice}</Txt> : <Txt variant="caption" color={colors.success}>Free</Txt>}
              </View>
              <View style={adminList.actions}>
                <Pressable style={adminList.actionBtn} onPress={() => router.push(`/admin/event-edit?id=${item.id}`)}>
                  <Ionicons name="create-outline" size={15} color={colors.navy} />
                  <Txt variant="caption" color={colors.navy}>Edit</Txt>
                </Pressable>
                <Pressable style={adminList.actionBtn} onPress={() => router.push(`/event/${item.id}`)}>
                  <Ionicons name="eye-outline" size={15} color={colors.navy} />
                  <Txt variant="caption" color={colors.navy}>View</Txt>
                </Pressable>
                <Pressable style={[adminList.actionBtn, adminList.actionDanger]} onPress={() => onDelete(item)}>
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  <Txt variant="caption" color={colors.danger}>Delete</Txt>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}
