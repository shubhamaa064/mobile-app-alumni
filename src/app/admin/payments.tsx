import React from "react";
import { View, FlatList } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, type AdminPayment } from "@/lib/api";
import { colors, fonts, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState, Chip } from "@/components/ui";
import { AdminScreen, HeaderAction, adminList } from "@/components/admin";
import { formatDate } from "@/lib/format";

function payerName(p: AdminPayment): string {
  const a = p.user?.alumniProfile;
  if (a) return `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || p.user?.email || "—";
  return p.user?.email || "Guest";
}
function statusTone(s: string): "gold" | "neutral" | "navy" {
  if (s === "SUCCESS") return "gold";
  if (s === "PENDING") return "navy";
  return "neutral";
}

export default function PaymentsAdmin() {
  const list = useQuery({ queryKey: ["adminPayments"], queryFn: () => api.adminPayments({ limit: 50 }) });
  const data = list.data;

  return (
    <AdminScreen title="Payments" admin headerRight={<HeaderAction icon="add" onPress={() => router.push("/admin/payment-add")} />}>
      {list.isLoading ? (
        <Loader label="Loading payments…" />
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={adminList.body}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            data ? (
              <View style={[adminList.card, { padding: spacing.lg, marginBottom: spacing.md }]}>
                <Txt variant="caption" color={colors.muted}>TOTAL REVENUE</Txt>
                <Txt style={{ fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginTop: 2 }}>
                  ₹{Number(data.totalRevenue || 0).toLocaleString("en-IN")}
                </Txt>
                <Txt variant="caption" color={colors.muted}>{data.totalCount} successful payment{data.totalCount === 1 ? "" : "s"}</Txt>
              </View>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="card-outline" title="No payments yet" />}
          renderItem={({ item }) => (
            <View style={adminList.card}>
              <View style={adminList.row}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyMedium" numberOfLines={1}>{payerName(item)}</Txt>
                  <Txt variant="caption" numberOfLines={1}>
                    {item.type}{item.paidFor ? ` · ${item.paidFor}` : ""} · {formatDate(item.createdAt)}
                  </Txt>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Txt variant="bodyMedium">₹{Number(item.amount).toLocaleString("en-IN")}</Txt>
                  <Chip label={item.status} tone={statusTone(item.status)} />
                </View>
              </View>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}
