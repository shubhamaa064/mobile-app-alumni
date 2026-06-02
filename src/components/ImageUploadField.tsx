import React, { useState } from "react";
import { View, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { uploadFile, API_BASE } from "@/lib/api";
import { colors, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";

/** Resolve a possibly-relative upload path (e.g. "/uploads/x.jpg") to a full URL. */
export function resolveMedia(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

type Props = {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  /** "avatar" renders a round 96px preview; "banner" renders a wide 16:9 preview. */
  shape?: "avatar" | "banner";
  hint?: string;
};

/**
 * Pick an image from the library, upload it to /api/upload, and hand back the
 * stored URL. Shows a live preview and a busy state during the upload.
 */
export function ImageUploadField({ label, value, onChange, shape = "banner", hint }: Props) {
  const [busy, setBusy] = useState(false);
  const preview = resolveMedia(value);

  const pick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow photo library access to upload an image.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: shape === "avatar",
        aspect: shape === "avatar" ? [1, 1] : undefined,
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      setBusy(true);
      const name = asset.fileName || `upload-${Date.now()}.jpg`;
      const type = asset.mimeType || "image/jpeg";
      const { url } = await uploadFile({ uri: asset.uri, name, type });
      onChange(url);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const round = shape === "avatar";

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Txt variant="label" style={{ marginBottom: 6 }}>{label.toUpperCase()}</Txt>
      <View style={{ flexDirection: round ? "row" : "column", alignItems: round ? "center" : "stretch" }}>
        <Pressable
          onPress={pick}
          disabled={busy}
          style={[
            styles.frame,
            round ? styles.avatar : styles.banner,
            !preview && styles.empty,
          ]}
        >
          {preview ? (
            <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <Ionicons name={round ? "person" : "image-outline"} size={round ? 34 : 28} color={colors.muted} />
          )}
          {busy && (
            <View style={styles.overlay}>
              <ActivityIndicator color={colors.white} />
            </View>
          )}
        </Pressable>
        <Pressable onPress={pick} disabled={busy} style={[styles.btn, round && { marginLeft: spacing.lg }]}>
          <Ionicons name="cloud-upload-outline" size={16} color={colors.navy} />
          <Txt variant="bodyMedium" color={colors.navy} style={{ marginLeft: 6 }}>
            {preview ? "Change" : "Upload"}
          </Txt>
        </Pressable>
      </View>
      {hint ? <Txt variant="caption" color={colors.muted} style={{ marginTop: 6 }}>{hint}</Txt> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.paperDim, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  banner: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md, marginBottom: spacing.sm },
  empty: { borderWidth: 1, borderColor: colors.line, borderStyle: "dashed" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.paperDim,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
