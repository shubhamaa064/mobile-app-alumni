import React, { useState } from "react";
import { View, FlatList, StyleSheet, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, type GalleryItem } from "@/lib/api";
import { colors, spacing } from "@/theme";
import { PageHeader } from "@/components/PageHeader";
import { PhotoTile } from "@/components/cards";
import { PhotoViewer } from "@/components/PhotoViewer";
import { EmptyState, Loader } from "@/components/ui";

export default function AlbumDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const albums = useQuery({ queryKey: ["albums", "all"], queryFn: () => api.albums({ limit: 60 }) });
  const photos = useQuery({ queryKey: ["gallery", "album", id], queryFn: () => api.gallery({ albumId: id, limit: 120 }) });

  const album = albums.data?.data.find((a) => a.id === id);
  const items = photos.data?.data || [];
  const size = (width - spacing.lg * 2) / 3 - 6;

  return (
    <View style={styles.container}>
      <PageHeader back eyebrow="Photo album" title={album?.name || "Album"} subtitle={album?.description || undefined} />
      {photos.isLoading ? (
        <Loader label="Loading photos…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p: GalleryItem) => p.id}
          numColumns={3}
          renderItem={({ item, index }) => <PhotoTile item={item} size={size} onPress={() => setViewerIndex(index)} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="image-outline" title="No photos in this album" />}
        />
      )}

      <PhotoViewer photos={items} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
});
