import React, { useState } from "react";
import { View, FlatList, StyleSheet, Pressable, Linking, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api, type Album, type GalleryItem } from "@/lib/api";
import { colors, fonts, radius, spacing } from "@/theme";
import { Txt } from "@/components/Text";
import { PageHeader } from "@/components/PageHeader";
import { Bell } from "@/components/Bell";
import { AlbumCard, PhotoTile } from "@/components/cards";
import { PhotoViewer } from "@/components/PhotoViewer";
import { EmptyState, Loader } from "@/components/ui";

type Tab = "albums" | "photos" | "videos";
const TABS: { id: Tab; label: string }[] = [
  { id: "albums", label: "Albums" },
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
];

export default function GalleryScreen() {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>("albums");
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  const albums = useQuery({ queryKey: ["albums", "all"], queryFn: () => api.albums({ limit: 60 }), enabled: tab === "albums" });
  const photos = useQuery({ queryKey: ["gallery", "photo"], queryFn: () => api.gallery({ type: "photo", limit: 90 }), enabled: tab === "photos" });
  const videos = useQuery({ queryKey: ["gallery", "video"], queryFn: () => api.gallery({ type: "video", limit: 60 }), enabled: tab === "videos" });

  const albumW = (width - spacing.lg * 2 - spacing.md) / 2;
  const photoSize = (width - spacing.lg * 2) / 3 - 6;
  const photoItems = photos.data?.data || [];

  const openMedia = (item: GalleryItem) => {
    if (item.type === "video") {
      Linking.openURL(item.url).catch(() => undefined);
    } else if (item.albumId) {
      router.push(`/album/${item.albumId}`);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader eyebrow="From the archives" title="Memories" subtitle="Every frame tells a story" right={<Bell />} />

      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable key={t.id} style={[styles.segBtn, active && styles.segActive]} onPress={() => setTab(t.id)}>
              <Txt style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: active ? colors.navyDeep : colors.inkSoft }}>
                {t.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {tab === "albums" ? (
        albums.isLoading ? (
          <Loader label="Opening albums…" />
        ) : (
          <FlatList
            key="albums"
            data={albums.data?.data || []}
            keyExtractor={(a: Album) => a.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => <AlbumCard album={item} width={albumW} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon="images-outline" title="No albums yet" />}
          />
        )
      ) : tab === "photos" ? (
        photos.isLoading ? (
          <Loader label="Developing photos…" />
        ) : (
          <FlatList
            key="photos"
            data={photoItems}
            keyExtractor={(p: GalleryItem) => p.id}
            numColumns={3}
            renderItem={({ item, index }) => <PhotoTile item={item} size={photoSize} onPress={() => setPhotoIndex(index)} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon="image-outline" title="No photos yet" />}
          />
        )
      ) : videos.isLoading ? (
        <Loader label="Cueing videos…" />
      ) : (
        <FlatList
          key="videos"
          data={videos.data?.data || []}
          keyExtractor={(p: GalleryItem) => p.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => <VideoCard item={item} width={albumW} onPress={() => openMedia(item)} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="videocam-outline" title="No videos yet" subtitle="Recorded memories will appear here." />}
        />
      )}

      <PhotoViewer photos={photoItems} index={photoIndex} onClose={() => setPhotoIndex(null)} />
    </View>
  );
}

function VideoCard({ item, width, onPress }: { item: GalleryItem; width: number; onPress: () => void }) {
  return (
    <View style={{ width, marginBottom: spacing.lg }}>
      <PhotoTile item={item} size={width} onPress={onPress} />
      <Txt variant="bodyMedium" numberOfLines={1} style={{ marginTop: 6 }}>{item.title || "Untitled"}</Txt>
      {item.description ? <Txt variant="caption" numberOfLines={1}>{item.description}</Txt> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  segment: {
    flexDirection: "row",
    margin: spacing.lg,
    backgroundColor: colors.paperDim,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: "center" },
  segActive: { backgroundColor: colors.goldSoft },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
});
