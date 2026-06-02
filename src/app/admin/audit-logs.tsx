import React from "react";
import { View, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, type AuditLog } from "@/lib/api";
import { colors, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState } from "@/components/ui";
import { AdminScreen, adminList } from "@/components/admin";
import { relativeTime } from "@/lib/format";

function iconFor(action: string): keyof typeof Ionicons.glyphMap {
  if (action.includes("delete")) return "trash-outline";
  if (action.includes("create")) return "add-circle-outline";
  if (action.includes("update") || action.includes("settings")) return "create-outline";
  if (action.includes("login") || action.includes("auth")) return "log-in-outline";
  return "ellipse-outline";
}

export default function AuditLogsAdmin() {
  const list = useQuery({ queryKey: ["auditLogs"], queryFn: () => api.auditLogs({ limit: 100 }) });

  return (
    <AdminScreen title="Audit Log" admin>
      {list.isLoading ? (
        <Loader label="Loading activity…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(a: AuditLog) => a.id}
          contentContainerStyle={adminList.body}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No activity logged" />}
          renderItem={({ item }) => (
            <View style={[adminList.card, adminList.row]}>
              <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.paperDim, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={iconFor(item.action)} size={17} color={colors.navy} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Txt variant="bodyMedium" numberOfLines={1}>{item.action}</Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {[item.actorEmail, item.targetType].filter(Boolean).join(" · ") || "system"}
                </Txt>
              </View>
              <Txt variant="caption" color={colors.muted}>{relativeTime(new Date(item.createdAt).getTime())}</Txt>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}
