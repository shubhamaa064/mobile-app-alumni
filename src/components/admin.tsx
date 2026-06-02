/**
 * Shared building blocks for the role-gated admin management screens.
 * AdminScreen renders the gradient hero + back button and gates non-staff out,
 * so each management screen stays focused on its list/form.
 */
import React from "react";
import { View, ScrollView, StyleSheet, Pressable, TextInput, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBack } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";

export function isStaff(role?: string): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}
export function isAdmin(role?: string): boolean {
  return role === "ADMIN";
}

/** Gradient header with back button and a centered title (+ optional action). */
export function AdminHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.hero} style={[hdr.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={hdr.bar}>
        <Pressable onPress={goBack} hitSlop={10} style={hdr.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        <Txt variant="heading" color={colors.white} numberOfLines={1} style={{ flex: 1, textAlign: "center" }}>
          {title}
        </Txt>
        <View style={{ width: 38, alignItems: "flex-end" }}>{right}</View>
      </View>
    </LinearGradient>
  );
}

/**
 * Full management-screen shell: header + role gate. `admin` requires ADMIN,
 * otherwise MODERATOR is also allowed. Children render below the header.
 */
export function AdminScreen({
  title,
  admin = false,
  headerRight,
  children,
}: {
  title: string;
  admin?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const allowed = admin ? isAdmin(user?.role) : isStaff(user?.role);

  return (
    <View style={hdr.container}>
      <AdminHeader title={title} right={allowed ? headerRight : undefined} />
      {allowed ? (
        children
      ) : (
        <View style={hdr.denied}>
          <Ionicons name="shield-outline" size={52} color={colors.muted} />
          <Txt variant="heading" center style={{ marginTop: spacing.md }}>
            {admin ? "Administrators only" : "Staff access only"}
          </Txt>
          <Txt variant="body" center color={colors.muted} style={{ marginTop: spacing.sm, maxWidth: 280 }}>
            You don't have permission to view this area.
          </Txt>
          <Pressable onPress={goBack} style={hdr.primaryBtn}>
            <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep }}>Go back</Txt>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** A pill button for the header (e.g. "+ New"). */
export function HeaderAction({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={hdr.iconBtn}>
      <Ionicons name={icon} size={20} color={colors.white} />
    </Pressable>
  );
}

/** A labelled text input for admin forms. */
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Txt variant="label" color={colors.inkSoft} style={{ marginBottom: 6 }}>
        {label.toUpperCase()}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[form.input, multiline && { minHeight: 92, textAlignVertical: "top", paddingTop: 12 }]}
      />
    </View>
  );
}

/** A labelled on/off toggle row. */
export function ToggleField({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={form.toggleRow}>
      <Txt variant="bodyMedium" style={{ flex: 1 }}>{label}</Txt>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.gold, false: colors.line }}
        thumbColor={colors.white}
      />
    </View>
  );
}

/** A horizontal set of selectable chips (single-select). */
export function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[form.chip, active && form.chipActive]}>
            <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: active ? colors.navyDeep : colors.inkSoft }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A primary submit button with a busy spinner placeholder. */
export function SubmitButton({ label, onPress, busy, disabled }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={busy || disabled} style={[form.submit, (busy || disabled) && { opacity: 0.6 }]}>
      <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 15 }}>{busy ? "Saving…" : label}</Txt>
    </Pressable>
  );
}

const hdr = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  denied: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxxl },
  primaryBtn: { marginTop: spacing.xl, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.pill },
});

const form = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, marginBottom: spacing.xs },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.paperDim, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  submit: { backgroundColor: colors.goldSoft, paddingVertical: 15, borderRadius: radius.md, alignItems: "center", marginTop: spacing.sm, ...shadow.lift },
});

/** Shared row/card styles management lists reuse. */
export const adminList = StyleSheet.create({
  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.soft },
  row: { flexDirection: "row", alignItems: "center" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.paperDim },
  actionDanger: { backgroundColor: "rgba(176,65,62,0.1)" },
});
