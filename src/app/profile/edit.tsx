import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { goBack } from "@/lib/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  parsePrivacy,
  updateProfile,
  changePassword,
  type Address,
  type MyProfile,
  type PrivacySettings,
  type ProfileUpdate,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts, gradients, radius, spacing, shadow } from "@/theme";
import { Txt } from "@/components/Text";
import { ImageUploadField } from "@/components/ImageUploadField";
import { Field } from "../login";

type AddrForm = { street: string; landmark: string; city: string; state: string; pincode: string; country: string };

function toAddrForm(a?: Address | null): AddrForm {
  return {
    street: a?.street || "",
    landmark: a?.landmark || "",
    city: a?.city || "",
    state: a?.state || "",
    pincode: a?.pincode || "",
    country: a?.country || "",
  };
}

function addrToApi(a: AddrForm): Address {
  return {
    street: a.street.trim() || null,
    landmark: a.landmark.trim() || null,
    city: a.city.trim() || null,
    state: a.state.trim() || null,
    pincode: a.pincode.trim() || null,
    country: a.country.trim() || null,
  };
}

function addrHasContent(a: AddrForm): boolean {
  return Object.values(a).some((v) => v.trim());
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user, refreshUser } = useAuth();
  const profile = useQuery({ queryKey: ["myProfile"], queryFn: api.myProfile, enabled: !!user });

  if (!user) {
    goBack();
    return null;
  }
  if (profile.isLoading || !profile.data) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: insets.top + spacing.xxxl }} />
      </View>
    );
  }

  return <EditForm insets={insets} qc={qc} refreshUser={refreshUser} data={profile.data} />;
}

function EditForm({ insets, qc, refreshUser, data }: {
  insets: { top: number };
  qc: ReturnType<typeof useQueryClient>;
  refreshUser: () => Promise<void>;
  data: MyProfile;
}) {
  const p = data.alumniProfile;
  const initialPrivacy = parsePrivacy(p?.privacySettings);

  // ── Form state ──
  const [avatarUrl, setAvatarUrl] = useState(p?.imageUrl || "");
  const [firstName, setFirstName] = useState(p?.firstName || "");
  const [lastName, setLastName] = useState(p?.lastName || "");
  const [bio, setBio] = useState(p?.bio || "");
  const [profession, setProfession] = useState(p?.profession || "");
  const [company, setCompany] = useState(p?.company || "");
  const [batchYear, setBatchYear] = useState(p?.batchYear ? String(p.batchYear) : "");
  const [country, setCountry] = useState(p?.country || "");
  const [dateOfBirth, setDateOfBirth] = useState(p?.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "");
  const [mobile, setMobile] = useState(p?.mobile || "");
  const [whatsapp, setWhatsapp] = useState(p?.whatsapp || "");
  const [skills, setSkills] = useState(p?.skills || "");
  const [linkedinUrl, setLinkedinUrl] = useState(p?.linkedinUrl || "");
  const [twitterUrl, setTwitterUrl] = useState(p?.twitterUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(p?.websiteUrl || "");
  const [fatherName, setFatherName] = useState(p?.fatherName || "");
  const [motherName, setMotherName] = useState(p?.motherName || "");

  const [sameAddress, setSameAddress] = useState(p?.sameAddress ?? true);
  const [currentAddr, setCurrentAddr] = useState<AddrForm>(toAddrForm(p?.currentAddress));
  const [permanentAddr, setPermanentAddr] = useState<AddrForm>(toAddrForm(p?.permanentAddress));

  const [privacy, setPrivacy] = useState<PrivacySettings>(initialPrivacy);

  // ── Password change ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const saveMut = useMutation({
    mutationFn: async () => {
      const dob = dateOfBirth.trim();
      const yearNum = batchYear.trim() ? Number(batchYear.trim()) : null;
      const payload: ProfileUpdate = {
        avatarUrl: avatarUrl.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        profession: profession.trim(),
        company: company.trim(),
        country: country.trim(),
        batchYear: yearNum && !Number.isNaN(yearNum) ? yearNum : null,
        dateOfBirth: dob || null,
        mobile: mobile.trim(),
        whatsapp: whatsapp.trim(),
        skills: skills.trim(),
        linkedinUrl: linkedinUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        sameAddress,
        currentAddress: addrToApi(currentAddr),
        permanentAddress: addrToApi(sameAddress ? currentAddr : permanentAddr),
        privacySettings: privacy,
      };
      await updateProfile(payload);
    },
    onSuccess: async () => {
      await refreshUser();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["myProfile"] }),
        qc.invalidateQueries({ queryKey: ["profileCompleteness"] }),
        qc.invalidateQueries({ queryKey: ["alumnus", data.id] }),
      ]);
      Alert.alert("Saved", "Your profile has been updated.");
      goBack();
    },
    onError: (e) => Alert.alert("Couldn't save", e instanceof Error ? e.message : "Please try again."),
  });

  const pwMut = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
      if (newPassword !== confirmPassword) throw new Error("New passwords do not match.");
      await changePassword(currentPassword, newPassword);
    },
    onSuccess: () => {
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("Password changed", "Your password has been updated.");
    },
    onError: (e) => Alert.alert("Couldn't change password", e instanceof Error ? e.message : "Please try again."),
  });

  const togglePrivacy = (k: keyof PrivacySettings) => setPrivacy((s) => ({ ...s, [k]: !s[k] }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerBar}>
          <Pressable onPress={goBack} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </Pressable>
          <Txt variant="heading" color={colors.white}>Edit Profile</Txt>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── Profile photo ── */}
          <Section title="Profile Photo">
            <ImageUploadField
              label="Your photo"
              value={avatarUrl}
              onChange={setAvatarUrl}
              shape="avatar"
              hint="A clear headshot helps alumni recognise you."
            />
          </Section>

          {/* ── Basics ── */}
          <Section title="Basic Information">
            <Row>
              <View style={{ flex: 1 }}><Labeled label="First name"><Field icon="person-outline" value={firstName} onChangeText={setFirstName} placeholder="First name" /></Labeled></View>
            </Row>
            <Labeled label="Last name"><Field icon="person-outline" value={lastName} onChangeText={setLastName} placeholder="Last name" /></Labeled>
            <Labeled label="Bio"><Field icon="book-outline" value={bio} onChangeText={setBio} placeholder="Tell the family about yourself" multiline /></Labeled>
            <Labeled label="Batch year"><Field icon="school-outline" value={batchYear} onChangeText={setBatchYear} placeholder="e.g. 2012" keyboardType="number-pad" /></Labeled>
            <Labeled label="Date of birth (YYYY-MM-DD)"><Field icon="calendar-outline" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="1995-08-21" autoCapitalize="none" /></Labeled>
          </Section>

          {/* ── Professional ── */}
          <Section title="Professional">
            <Labeled label="Profession"><Field icon="briefcase-outline" value={profession} onChangeText={setProfession} placeholder="e.g. Software Engineer" /></Labeled>
            <Labeled label="Company"><Field icon="business-outline" value={company} onChangeText={setCompany} placeholder="e.g. Acme Corp" /></Labeled>
            <Labeled label="Country"><Field icon="earth-outline" value={country} onChangeText={setCountry} placeholder="e.g. India" /></Labeled>
            <Labeled label="Skills (comma-separated)"><Field icon="layers-outline" value={skills} onChangeText={setSkills} placeholder="React, Leadership, Design" autoCapitalize="none" /></Labeled>
          </Section>

          {/* ── Contact ── */}
          <Section title="Contact">
            <Labeled label="Mobile"><Field icon="call-outline" value={mobile} onChangeText={setMobile} placeholder="+91 ..." keyboardType="phone-pad" /></Labeled>
            <Labeled label="WhatsApp"><Field icon="logo-whatsapp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+91 ..." keyboardType="phone-pad" /></Labeled>
            <Labeled label="LinkedIn URL"><Field icon="logo-linkedin" value={linkedinUrl} onChangeText={setLinkedinUrl} placeholder="https://linkedin.com/in/…" autoCapitalize="none" keyboardType="url" /></Labeled>
            <Labeled label="Twitter / X URL"><Field icon="logo-twitter" value={twitterUrl} onChangeText={setTwitterUrl} placeholder="https://x.com/…" autoCapitalize="none" keyboardType="url" /></Labeled>
            <Labeled label="Website URL"><Field icon="globe-outline" value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://…" autoCapitalize="none" keyboardType="url" /></Labeled>
          </Section>

          {/* ── Family ── */}
          <Section title="Family">
            <Labeled label="Father's name"><Field icon="person-outline" value={fatherName} onChangeText={setFatherName} placeholder="Father's name" /></Labeled>
            <Labeled label="Mother's name"><Field icon="person-outline" value={motherName} onChangeText={setMotherName} placeholder="Mother's name" /></Labeled>
          </Section>

          {/* ── Current address ── */}
          <Section title="Current Address">
            <AddressFields value={currentAddr} onChange={setCurrentAddr} />
          </Section>

          {/* ── Permanent address ── */}
          <Section title="Permanent Address">
            <ToggleRow label="Same as current address" value={sameAddress} onValueChange={setSameAddress} />
            {!sameAddress ? <View style={{ marginTop: spacing.md }}><AddressFields value={permanentAddr} onChange={setPermanentAddr} /></View> : null}
          </Section>

          {/* ── Privacy ── */}
          <Section title="Privacy">
            <Txt variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
              Choose what other alumni can see on your public profile.
            </Txt>
            <ToggleRow label="Show mobile number" value={privacy.showMobile} onValueChange={() => togglePrivacy("showMobile")} />
            <ToggleRow label="Show WhatsApp" value={privacy.showWhatsapp} onValueChange={() => togglePrivacy("showWhatsapp")} />
            <ToggleRow label="Show email" value={privacy.showEmail} onValueChange={() => togglePrivacy("showEmail")} />
            <ToggleRow label="Show date of birth" value={privacy.showDateOfBirth} onValueChange={() => togglePrivacy("showDateOfBirth")} />
            <ToggleRow label="Show current address" value={privacy.showCurrentAddress} onValueChange={() => togglePrivacy("showCurrentAddress")} />
            <ToggleRow label="Show permanent address" value={privacy.showPermanentAddress} onValueChange={() => togglePrivacy("showPermanentAddress")} />
            <ToggleRow label="Show education" value={privacy.showEducation} onValueChange={() => togglePrivacy("showEducation")} />
            <ToggleRow label="Show work experience" value={privacy.showWorkExperience} onValueChange={() => togglePrivacy("showWorkExperience")} />
          </Section>

          <Pressable style={[styles.saveBtn, saveMut.isPending && { opacity: 0.6 }]} onPress={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <ActivityIndicator color={colors.navyDeep} /> : (
              <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navyDeep, fontSize: 16 }}>Save Changes</Txt>
            )}
          </Pressable>

          {/* ── Password ── */}
          <Section title="Change Password">
            <Labeled label="Current password"><Field icon="lock-closed-outline" value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" secureTextEntry autoCapitalize="none" /></Labeled>
            <Labeled label="New password"><Field icon="key-outline" value={newPassword} onChangeText={setNewPassword} placeholder="At least 8 characters" secureTextEntry autoCapitalize="none" /></Labeled>
            <Labeled label="Confirm new password"><Field icon="key-outline" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter new password" secureTextEntry autoCapitalize="none" /></Labeled>
            <Pressable
              style={[styles.secondaryBtn, pwMut.isPending && { opacity: 0.6 }]}
              onPress={() => pwMut.mutate()}
              disabled={pwMut.isPending || !currentPassword || !newPassword}
            >
              {pwMut.isPending ? <ActivityIndicator color={colors.navy} /> : (
                <Txt style={{ fontFamily: fonts.bodyBold, color: colors.navy, fontSize: 15 }}>Update Password</Txt>
              )}
            </Pressable>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function AddressFields({ value, onChange }: { value: AddrForm; onChange: (a: AddrForm) => void }) {
  const set = (k: keyof AddrForm) => (t: string) => onChange({ ...value, [k]: t });
  return (
    <View>
      <Labeled label="Street"><Field icon="home-outline" value={value.street} onChangeText={set("street")} placeholder="House / street" /></Labeled>
      <Labeled label="Landmark"><Field icon="navigate-outline" value={value.landmark} onChangeText={set("landmark")} placeholder="Landmark (optional)" /></Labeled>
      <Row>
        <View style={{ flex: 1, marginRight: spacing.sm }}><Labeled label="City"><Field icon="business-outline" value={value.city} onChangeText={set("city")} placeholder="City" /></Labeled></View>
        <View style={{ flex: 1 }}><Labeled label="State"><Field icon="map-outline" value={value.state} onChangeText={set("state")} placeholder="State" /></Labeled></View>
      </Row>
      <Row>
        <View style={{ flex: 1, marginRight: spacing.sm }}><Labeled label="Pincode"><Field icon="pin-outline" value={value.pincode} onChangeText={set("pincode")} placeholder="Pincode" keyboardType="number-pad" /></Labeled></View>
        <View style={{ flex: 1 }}><Labeled label="Country"><Field icon="earth-outline" value={value.country} onChangeText={set("country")} placeholder="Country" /></Labeled></View>
      </Row>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, shadow.soft]}>
      <Txt variant="label" color={colors.goldDeep} style={{ marginBottom: spacing.md }}>{title.toUpperCase()}</Txt>
      {children}
    </View>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xs }}>
      <Txt variant="caption" color={colors.inkSoft} style={{ marginBottom: 4, marginLeft: 2, fontFamily: fonts.bodySemi }}>{label}</Txt>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row" }}>{children}</View>;
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Txt variant="bodyMedium" style={{ flex: 1 }}>{label}</Txt>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.goldSoft }}
        thumbColor={value ? colors.gold : colors.card}
        ios_backgroundColor={colors.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  saveBtn: { backgroundColor: colors.goldSoft, paddingVertical: 16, borderRadius: radius.md, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.md, ...shadow.lift },
  secondaryBtn: { borderWidth: 1.5, borderColor: colors.navy, paddingVertical: 14, borderRadius: radius.md, alignItems: "center", marginTop: spacing.sm },
});
