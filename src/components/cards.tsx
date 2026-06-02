import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts, radius, shadow, spacing, gradients } from "@/theme";
import { Txt } from "./Text";
import { Chip } from "./ui";
import { Avatar } from "./Avatar";
import { formatDate, formatDay, initials, titleCase, relativeYears } from "@/lib/format";
import type { EventItem, NewsArticle, GalleryItem, Album, AlumniUser, JobPost } from "@/lib/api";

const FALLBACK_EVENT = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=70";

/* ----------------------------- Event card ----------------------------- */
export function EventCard({ event }: { event: EventItem }) {
  const d = formatDay(event.date);
  const past = event.status === "past";
  return (
    <Pressable
      style={({ pressed }) => [styles.card, shadow.soft, pressed && styles.pressed]}
      onPress={() => router.push(`/event/${event.id}`)}
    >
      <View style={styles.eventImageWrap}>
        <Image source={{ uri: event.imageUrl || FALLBACK_EVENT }} style={styles.eventImage} contentFit="cover" transition={250} />
        <LinearGradient colors={gradients.scrim} style={StyleSheet.absoluteFill} />
        <View style={styles.dateChip}>
          <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 20, color: colors.navy, lineHeight: 22 }}>{d.day}</Txt>
          <Txt style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.goldDeep, letterSpacing: 1 }}>{d.month}</Txt>
        </View>
        {past ? (
          <View style={styles.memoryBadge}>
            <Ionicons name="time-outline" size={12} color={colors.white} />
            <Txt style={{ fontFamily: fonts.handBold, fontSize: 15, color: colors.white, marginLeft: 4 }}>
              {relativeYears(event.date)}
            </Txt>
          </View>
        ) : null}
        <View style={styles.eventOverlayText}>
          <Txt variant="heading" color={colors.white} numberOfLines={2}>
            {event.title}
          </Txt>
        </View>
      </View>
      <View style={styles.eventBody}>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.gold} />
          <Txt variant="caption" numberOfLines={1} style={{ marginLeft: 5, flex: 1 }}>
            {event.location || (event.isVirtual ? "Online" : "Christ The King Campus")}
          </Txt>
        </View>
        <View style={[styles.metaRow, { marginTop: 6 }]}>
          <Chip label={titleCase(event.category)} tone="gold" />
          {!past ? <Chip label="Upcoming" tone="navy" icon="sparkles" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

/* --------------------------- Wall of fame / news --------------------------- */
export function FameCard({ article, full }: { article: NewsArticle; full?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fameCard, full && styles.fameCardFull, shadow.soft, pressed && styles.pressed]}
      onPress={() => router.push(`/news/${article.id}`)}
    >
      <View style={styles.fameImageWrap}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.fameImage} contentFit="cover" transition={250} />
        ) : (
          <View style={[styles.fameImage, styles.fameFallback]}>
            <Ionicons name="person" size={40} color={colors.gold} />
          </View>
        )}
        <View style={styles.fameTape} />
      </View>
      <Txt variant="bodyMedium" center numberOfLines={1} style={{ marginTop: 10 }}>
        {article.title}
      </Txt>
      <Txt variant="caption" center numberOfLines={2} style={{ marginTop: 2 }}>
        {article.excerpt.replace(/\r?\n/g, " · ")}
      </Txt>
    </Pressable>
  );
}

export function NewsRow({ article }: { article: NewsArticle }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.newsRow, pressed && styles.pressed]}
      onPress={() => router.push(`/news/${article.id}`)}
    >
      {article.imageUrl ? (
        <Image source={{ uri: article.imageUrl }} style={styles.newsThumb} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.newsThumb, styles.fameFallback]}>
          <Ionicons name="newspaper-outline" size={22} color={colors.gold} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Chip label={titleCase(article.category)} tone="gold" />
        <Txt variant="bodyMedium" numberOfLines={2} style={{ marginTop: 6 }}>
          {article.title}
        </Txt>
        <Txt variant="caption" style={{ marginTop: 3 }}>
          {formatDate(article.publishedAt)}
        </Txt>
      </View>
    </Pressable>
  );
}

/* ----------------------------- Photo / album ----------------------------- */
export function AlbumCard({ album, width }: { album: Album; width: number }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.albumCard, { width }, shadow.soft, pressed && styles.pressed]}
      onPress={() => router.push(`/album/${album.id}`)}
    >
      <View style={styles.polaroid}>
        {album.coverUrl ? (
          <Image source={{ uri: album.coverUrl }} style={[styles.albumImg, { height: width * 0.82 }]} contentFit="cover" transition={250} />
        ) : (
          <View style={[styles.albumImg, { height: width * 0.82 }, styles.fameFallback]}>
            <Ionicons name="images-outline" size={32} color={colors.gold} />
          </View>
        )}
        <Txt style={styles.albumCaption} numberOfLines={2}>
          {album.name}
        </Txt>
        <Txt style={styles.albumSub} numberOfLines={1}>
          {titleCase(album.category)}
          {album._count?.photos ? `  ·  ${album._count.photos} photo${album._count.photos === 1 ? "" : "s"}` : ""}
        </Txt>
      </View>
    </Pressable>
  );
}

export function PhotoTile({ item, size, onPress }: { item: GalleryItem; size: number; onPress?: () => void }) {
  return (
    <Pressable style={[styles.photoTile, { width: size, height: size }]} onPress={onPress}>
      <Image source={{ uri: item.thumbnail || item.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      {item.type === "video" ? (
        <View style={styles.playBadge}>
          <Ionicons name="play" size={16} color={colors.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

/* ----------------------------- Alumni card ----------------------------- */
export function AlumniCard({ user }: { user: AlumniUser }) {
  const p = user.alumniProfile;
  if (!p) return null;
  return (
    <Pressable
      style={({ pressed }) => [styles.alumniCard, shadow.soft, pressed && styles.pressed]}
      onPress={() => router.push(`/alumni/${user.id}`)}
    >
      <Avatar uri={p.imageUrl} initials={initials(p.firstName, p.lastName)} size={58} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.metaRow}>
          <Txt variant="heading" numberOfLines={1} style={{ flexShrink: 1 }}>
            {p.firstName} {p.lastName}
          </Txt>
          {p.isVerified ? <Ionicons name="checkmark-circle" size={16} color={colors.gold} style={{ marginLeft: 5 }} /> : null}
        </View>
        <Txt variant="caption" numberOfLines={1}>
          {p.profession || "Alumnus"}
          {p.company ? ` · ${p.company}` : ""}
        </Txt>
        <View style={[styles.metaRow, { marginTop: 7 }]}>
          {p.batchYear ? <Chip label={`Batch '${String(p.batchYear).slice(-2)}`} tone="navy" icon="school-outline" /> : null}
          {p.country ? <View style={{ marginLeft: 6 }}><Chip label={p.country} tone="neutral" icon="location-outline" /></View> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

/* ----------------------------- Job card ----------------------------- */
export function JobCard({ job }: { job: JobPost }) {
  return (
    <View style={[styles.jobCard, shadow.soft]}>
      <View style={styles.metaRow}>
        <View style={styles.jobLogo}>
          <Ionicons name="briefcase" size={18} color={colors.navy} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Txt variant="bodyMedium" numberOfLines={2}>
            {job.title}
          </Txt>
          <Txt variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>
            {job.company}
          </Txt>
        </View>
      </View>
      <View style={[styles.metaRow, { marginTop: 10, flexWrap: "wrap", gap: 6 }]}>
        <Chip label={titleCase(job.type)} tone="gold" />
        <Chip label={job.location} tone="neutral" icon="location-outline" />
      </View>
      <Txt variant="caption" numberOfLines={2} style={{ marginTop: 8 }}>
        {job.description}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.lg },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  eventImageWrap: { height: 180, justifyContent: "flex-end" },
  eventImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  dateChip: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: colors.cardWarm,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
    ...shadow.soft,
  },
  memoryBadge: {
    position: "absolute",
    top: 16,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(123,45,38,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  eventOverlayText: { padding: spacing.lg },
  eventBody: { padding: spacing.lg, paddingTop: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center" },

  fameCard: { width: 150, backgroundColor: colors.cardWarm, borderRadius: radius.md, padding: 10, marginRight: spacing.md },
  fameCardFull: { width: "100%", marginRight: 0 },
  fameImageWrap: { alignItems: "center" },
  fameImage: { width: "100%", height: 150, borderRadius: 6 },
  fameFallback: { backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  fameTape: {
    position: "absolute",
    top: -6,
    width: 56,
    height: 16,
    backgroundColor: "rgba(200,162,75,0.45)",
    transform: [{ rotate: "-4deg" }],
  },

  newsRow: { flexDirection: "row", paddingVertical: spacing.md, alignItems: "center" },
  newsThumb: { width: 78, height: 78, borderRadius: radius.md },

  albumCard: { marginBottom: spacing.lg },
  polaroid: { backgroundColor: colors.white, padding: 8, paddingBottom: 12, borderRadius: 6, ...shadow.soft },
  albumImg: { width: "100%", borderRadius: 3 },
  albumCaption: { fontFamily: fonts.handBold, fontSize: 18, color: colors.ink, marginTop: 8, textAlign: "center" },
  albumSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 1 },

  photoTile: { backgroundColor: colors.navy, borderRadius: radius.sm, overflow: "hidden", margin: 3 },
  playBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.scrim,
    alignItems: "center",
    justifyContent: "center",
  },

  alumniCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  jobCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  jobLogo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(200,162,75,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
