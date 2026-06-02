import React, { useCallback, useRef, useState } from "react";
import { View, Modal, Pressable, StyleSheet, FlatList, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/theme";
import { Txt } from "@/components/Text";

type Photo = { id: string; url: string; title?: string | null; description?: string | null };

/**
 * Full-screen, swipeable photo viewer. Users can swipe left/right between
 * photos, tap the on-screen arrows, and see a "n / total" position counter.
 */
export function PhotoViewer({
  photos,
  index,
  onClose,
}: {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Photo>>(null);
  const [current, setCurrent] = useState(0);
  const visible = index !== null;

  // Sync the starting index whenever the viewer opens.
  const initialIndex = index ?? 0;

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      setCurrent(i);
    },
    [width],
  );

  const go = useCallback(
    (dir: -1 | 1) => {
      const next = Math.min(photos.length - 1, Math.max(0, current + dir));
      if (next === current) return;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrent(next);
    },
    [current, photos.length],
  );

  const onShow = useCallback(() => {
    setCurrent(initialIndex);
    // Jump (no animation) to the tapped photo once the list mounts.
    requestAnimationFrame(() => {
      if (initialIndex > 0) listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [initialIndex]);

  const active = photos[current];

  return (
    <Modal visible={visible} transparent animationType="fade" onShow={onShow} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={onMomentumEnd}
          onScrollToIndexFailed={({ index: i }) => {
            setTimeout(() => listRef.current?.scrollToIndex({ index: i, animated: false }), 80);
          }}
          renderItem={({ item }) => (
            <Pressable style={[styles.page, { width, height }]} onPress={onClose}>
              <Image source={{ uri: item.url }} style={styles.img} contentFit="contain" transition={150} />
            </Pressable>
          )}
        />

        {/* Close */}
        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.white} />
        </Pressable>

        {/* Counter */}
        {photos.length > 0 ? (
          <View style={styles.counter}>
            <Txt variant="caption" color={colors.white}>{current + 1} / {photos.length}</Txt>
          </View>
        ) : null}

        {/* Prev */}
        {current > 0 ? (
          <Pressable style={[styles.nav, styles.navLeft]} onPress={() => go(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={colors.white} />
          </Pressable>
        ) : null}

        {/* Next */}
        {current < photos.length - 1 ? (
          <Pressable style={[styles.nav, styles.navRight]} onPress={() => go(1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={26} color={colors.white} />
          </Pressable>
        ) : null}

        {/* Caption */}
        {active?.title || active?.description ? (
          <View style={styles.captionWrap} pointerEvents="none">
            {active?.title ? <Txt variant="bodyMedium" color={colors.white} center numberOfLines={2}>{active.title}</Txt> : null}
            {active?.description ? (
              <Txt variant="caption" color="rgba(255,255,255,0.75)" center numberOfLines={2} style={{ marginTop: 2 }}>
                {active.description}
              </Txt>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(8,12,24,0.97)" },
  page: { alignItems: "center", justifyContent: "center" },
  img: { width: "92%", height: "78%" },
  close: { position: "absolute", top: 54, right: 24, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  counter: { position: "absolute", top: 60, left: 0, right: 0, alignItems: "center" },
  nav: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: { left: spacing.md },
  navRight: { right: spacing.md },
  captionWrap: { position: "absolute", bottom: 56, left: spacing.xl, right: spacing.xl, alignItems: "center" },
});
