import React from "react";
import { View, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, type DonationCampaign } from "@/lib/api";
import { colors, fonts, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { Loader, EmptyState } from "@/components/ui";
import { AdminScreen, adminList } from "@/components/admin";
import { formatDate } from "@/lib/format";

function pct(c: DonationCampaign): number {
  if (!c.targetGoal) return 0;
  return Math.min(100, Math.round((c.raised / c.targetGoal) * 100));
}

export default function DonationsAdmin() {
  const list = useQuery({ queryKey: ["donationCampaigns"], queryFn: api.donationCampaigns });

  return (
    <AdminScreen title="Donations" admin>
      {list.isLoading ? (
        <Loader label="Loading campaigns…" />
      ) : (
        <FlatList
          data={list.data?.data || []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={adminList.body}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="heart-outline" title="No campaigns yet" />}
          renderItem={({ item }) => (
            <View style={[adminList.card, { padding: spacing.lg }]}>
              <Txt variant="bodyMedium" numberOfLines={2}>{item.title}</Txt>
              {item.description ? <Txt variant="caption" numberOfLines={2} style={{ marginTop: 2 }}>{item.description}</Txt> : null}

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.success }}>
                  ₹{Number(item.raised).toLocaleString("en-IN")}
                </Txt>
                <Txt variant="caption" color={colors.muted}>
                  of ₹{Number(item.targetGoal).toLocaleString("en-IN")}
                </Txt>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.paperDim, marginTop: 6, overflow: "hidden" }}>
                <View style={{ height: 8, borderRadius: 4, width: `${pct(item)}%`, backgroundColor: colors.gold }} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                <Txt variant="caption" color={colors.goldDeep}>{pct(item)}% funded</Txt>
                <Txt variant="caption" color={colors.muted}>
                  {formatDate(item.startDate)}{item.endDate ? ` – ${formatDate(item.endDate)}` : ""}
                </Txt>
              </View>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}
