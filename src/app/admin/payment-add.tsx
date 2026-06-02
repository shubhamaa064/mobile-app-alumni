import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPayment } from "@/lib/api";
import { spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { AdminScreen, FormField, ChipSelect, SubmitButton } from "@/components/admin";

const TYPES = ["MEMBERSHIP", "EVENT", "DONATION", "OTHER"].map((t) => ({ value: t, label: t }));
const METHODS = ["CASH", "UPI", "CARD", "BANK", "OTHER"].map((m) => ({ value: m, label: m }));

export default function PaymentAdd() {
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>({ type: "MEMBERSHIP", paymentMethod: "CASH" });
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: () =>
      createPayment({
        amount: Number(f.amount),
        type: f.type,
        paymentMethod: f.paymentMethod,
        transactionId: f.transactionId?.trim() || undefined,
        paidFor: f.paidFor?.trim() || undefined,
        notes: f.notes?.trim() || undefined,
        userId: f.userId?.trim() || undefined,
        status: "SUCCESS",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminPayments"] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const submit = () => {
    const amt = Number(f.amount);
    if (!amt || amt <= 0) return Alert.alert("Invalid amount", "Enter a positive amount.");
    mut.mutate();
  };

  return (
    <AdminScreen title="Record Payment" admin>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
          <FormField label="Amount (₹)" value={f.amount || ""} onChangeText={set("amount")} placeholder="500" keyboardType="numeric" />
          <Txt variant="label" style={{ marginBottom: 6 }}>TYPE</Txt>
          <ChipSelect options={TYPES} value={f.type} onChange={set("type")} />
          <Txt variant="label" style={{ marginBottom: 6 }}>METHOD</Txt>
          <ChipSelect options={METHODS} value={f.paymentMethod} onChange={set("paymentMethod")} />
          <FormField label="Paid for (optional)" value={f.paidFor || ""} onChangeText={set("paidFor")} placeholder="2026 membership" />
          <FormField label="Member user ID (optional)" value={f.userId || ""} onChangeText={set("userId")} placeholder="Leave blank for guest" autoCapitalize="none" />
          <FormField label="Transaction ID (optional)" value={f.transactionId || ""} onChangeText={set("transactionId")} placeholder="TXN…" autoCapitalize="none" />
          <FormField label="Notes (optional)" value={f.notes || ""} onChangeText={set("notes")} placeholder="Any details…" multiline />

          <SubmitButton label="Record payment" onPress={submit} busy={mut.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
