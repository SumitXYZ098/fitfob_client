import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  type ScrollViewInstance,
  Modal,
  FlatList,
  StatusBar,
  Platform,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ExerciseZoneItem {
  title: string;
  image: string;
}

interface GymWhereYouExerciseProps {
  exerciseZones: ExerciseZoneItem[];
  gymTitle: string;
  isDetailFetching?: boolean;
  onViewerStateChange?: (isOpen: boolean) => void;
}

function SkeletonBox({ style }: { style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={[{ backgroundColor: '#E2E8F0', opacity }, style]}
    />
  );
}

export default function GymWhereYouExercise({
  exerciseZones,
  gymTitle,
  isDetailFetching = false,
  onViewerStateChange,
}: GymWhereYouExerciseProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Exercise Zones Photo Lightbox Modal State
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);
  const zoneListRef = useRef<FlatList>(null);
  const thumbnailScrollRef = useRef<ScrollViewInstance>(null);
  const isClosingZoneViewerRef = useRef<boolean>(false);
  const lastClosedZoneViewerTimeRef = useRef<number>(0);

  // Notify parent of viewer state change (e.g. to hide/show sticky bottom bar)
  useEffect(() => {
    onViewerStateChange?.(selectedZoneIndex !== null);
  }, [selectedZoneIndex, onViewerStateChange]);

  // Keep bottom thumbnail strip centered on active photo
  useEffect(() => {
    if (selectedZoneIndex !== null && thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollTo({
        x: Math.max(0, selectedZoneIndex * 64 - screenWidth / 2 + 32),
        animated: true,
      });
    }
  }, [selectedZoneIndex, screenWidth]);

  const handleOpenZoneViewer = (index: number) => {
    if (Date.now() - lastClosedZoneViewerTimeRef.current < 450) {
      return;
    }
    isClosingZoneViewerRef.current = false;
    setSelectedZoneIndex(index);
    setTimeout(() => {
      try {
        zoneListRef.current?.scrollToIndex({ index, animated: false });
      } catch {}
    }, 60);
  };

  const handleCloseZoneViewer = () => {
    isClosingZoneViewerRef.current = true;
    lastClosedZoneViewerTimeRef.current = Date.now();
    setSelectedZoneIndex(null);
  };

  const handleNextZone = () => {
    if (
      !isClosingZoneViewerRef.current &&
      selectedZoneIndex !== null &&
      exerciseZones &&
      selectedZoneIndex < exerciseZones.length - 1
    ) {
      const next = selectedZoneIndex + 1;
      setSelectedZoneIndex(next);
      try {
        zoneListRef.current?.scrollToIndex({ index: next, animated: true });
      } catch {}
    }
  };

  const handlePrevZone = () => {
    if (
      !isClosingZoneViewerRef.current &&
      selectedZoneIndex !== null &&
      selectedZoneIndex > 0
    ) {
      const prev = selectedZoneIndex - 1;
      setSelectedZoneIndex(prev);
      try {
        zoneListRef.current?.scrollToIndex({ index: prev, animated: true });
      } catch {}
    }
  };

  const currentZone =
    selectedZoneIndex !== null && exerciseZones ? exerciseZones[selectedZoneIndex] : null;

  if (exerciseZones.length === 0) {
    if (isDetailFetching) {
      return (
        <View className="mt-6">
          <SkeletonBox style={{ height: 18, width: 160, borderRadius: 4, marginBottom: 12 }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-1 -mx-5 px-5">
            {[1, 2, 3].map((_, idx) => (
              <View
                key={idx}
                className="mr-3 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                <SkeletonBox style={{ height: 112, width: '100%', borderRadius: 0 }} />
                <View className="p-2.5">
                  <SkeletonBox style={{ height: 14, width: '70%', borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }
    return null;
  }

  return (
    <View className="mt-6">
      {/* ─── Header: Where you'll exercise ───────────────────────────────── */}
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-base text-slate-900">Where you&apos;ll exercise</Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="expand-outline" size={12} color="#94A3B8" />
          <Text className="text-xs font-medium text-slate-400">Tap to expand</Text>
        </View>
      </View>

      {/* ─── Horizontal Scroll of Zone Cards ────────────────────────────── */}
      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        className="mt-3 -mx-5 px-5">
        {exerciseZones.map((zone: ExerciseZoneItem, idx: number) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.88}
            onPress={() => handleOpenZoneViewer(idx)}
            className="mr-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
            <View className="relative h-28 w-full bg-slate-100">
              {zone.image ? (
                <ExpoImage
                  source={{ uri: zone.image }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-slate-100">
                  <Ionicons name="barbell-outline" size={28} color="#94A3B8" />
                </View>
              )}
              {/* Full View Preview Badge */}
              <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 flex-row items-center gap-1 border border-white/20">
                <Ionicons name="scan-outline" size={11} color="#FFFFFF" />
                <Text className="text-[10px] font-semibold text-white">Full View</Text>
              </View>
            </View>
            <View className="p-3">
              <Text className="font-bold text-xs text-slate-800" numberOfLines={1}>
                {zone.title}
              </Text>
              <View className="mt-1.5 flex-row items-center gap-1">
                <Text className="text-[11px] font-semibold text-[#E23744]">View photo</Text>
                <Ionicons name="chevron-forward" size={11} color="#E23744" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── Fullscreen Photo Lightbox Modal ─────────────────────────────── */}
      <Modal
        visible={selectedZoneIndex !== null}
        animationType="fade"
        transparent={false}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
        presentationStyle="fullScreen"
        onRequestClose={handleCloseZoneViewer}
        onDismiss={() => {
          isClosingZoneViewerRef.current = false;
        }}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} className="justify-between">
          <StatusBar barStyle="dark-content" />

          {/* Top Header Bar */}
          <View
            style={{
              paddingTop:
                Platform.OS === 'android'
                  ? (StatusBar.currentHeight || 24) + 8
                  : insets.top > 0
                  ? insets.top
                  : 44,
              backgroundColor: '#FFFFFF',
            }}
            className="border-b border-slate-100 z-20">
            <View className="flex-row items-center justify-between px-4 py-2.5">
              {/* Photo Counter */}
              {exerciseZones.length > 0 && selectedZoneIndex !== null ? (
                <View className="rounded-full bg-slate-100 px-3.5 py-1.5 border border-slate-200">
                  <Text className="text-xs font-bold text-slate-700">
                    {selectedZoneIndex + 1} / {exerciseZones.length}
                  </Text>
                </View>
              ) : (
                <View />
              )}

              {/* Right: Close Button */}
              <TouchableOpacity
                onPress={handleCloseZoneViewer}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 border border-slate-200 active:bg-slate-200">
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center: Fullscreen Horizontal Pager */}
          <View className="flex-1 justify-center relative bg-slate-50">
            <FlatList
              ref={zoneListRef}
              data={exerciseZones}
              keyExtractor={(_, index) => `lightbox-zone-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedZoneIndex ?? 0}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                if (isClosingZoneViewerRef.current || selectedZoneIndex === null) return;
                setTimeout(() => {
                  try {
                    zoneListRef.current?.scrollToIndex({ index: info.index, animated: false });
                  } catch {}
                }, 100);
              }}
              scrollEventThrottle={16}
              onScroll={(e) => {
                if (isClosingZoneViewerRef.current || selectedZoneIndex === null) return;
                const offsetX = e.nativeEvent.contentOffset.x;
                const newIndex = Math.round(offsetX / screenWidth);
                if (
                  newIndex >= 0 &&
                  newIndex < exerciseZones.length &&
                  newIndex !== selectedZoneIndex
                ) {
                  setSelectedZoneIndex(newIndex);
                }
              }}
              onMomentumScrollEnd={(e) => {
                if (isClosingZoneViewerRef.current || selectedZoneIndex === null) return;
                const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                if (
                  idx >= 0 &&
                  idx < exerciseZones.length &&
                  idx !== selectedZoneIndex
                ) {
                  setSelectedZoneIndex(idx);
                }
              }}
              renderItem={({ item }) => (
                <View
                  style={{ width: screenWidth }}
                  className="flex-1 items-center justify-center px-4 py-2">
                  {Boolean(item.image) ? (
                    <View className="w-full flex-1 items-center justify-center">
                      <ExpoImage
                        source={{ uri: item.image }}
                        style={{
                          width: screenWidth - 32,
                          height: '100%',
                          maxHeight: 500,
                          borderRadius: 20,
                        }}
                        contentFit="contain"
                        transition={200}
                      />
                    </View>
                  ) : (
                    <View className="h-64 w-64 items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-sm">
                      <Ionicons name="image-outline" size={64} color="#94A3B8" />
                      <Text className="mt-2 text-xs font-semibold text-slate-400">
                        No Image Available
                      </Text>
                    </View>
                  )}
                </View>
              )}
            />

            {/* Left Chevron Button */}
            {selectedZoneIndex !== null && selectedZoneIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevZone}
                activeOpacity={0.85}
                className="absolute left-3 top-1/2 -mt-6 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md">
                <Ionicons name="chevron-back" size={22} color="#0F172A" />
              </TouchableOpacity>
            )}

            {/* Right Chevron Button */}
            {selectedZoneIndex !== null &&
              selectedZoneIndex < exerciseZones.length - 1 && (
                <TouchableOpacity
                  onPress={handleNextZone}
                  activeOpacity={0.85}
                  className="absolute right-3 top-1/2 -mt-6 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md">
                  <Ionicons name="chevron-forward" size={22} color="#0F172A" />
                </TouchableOpacity>
              )}
          </View>

          {/* Bottom Info & Thumbnails Bar */}
          <View
            style={{
              paddingBottom:
                Platform.OS === 'ios'
                  ? Math.max(insets.bottom, 20)
                  : Math.max(insets.bottom, 16) + 12,
              backgroundColor: '#FFFFFF',
            }}
            className="border-t border-slate-200/80 bg-white px-5 pt-3.5 shadow-lg z-20">
            {/* Zone Details */}
            <View className="mb-3">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="fitness" size={14} color="#E23744" />
                <Text className="text-[11px] font-bold uppercase tracking-wider text-[#E23744]">
                  Exercise Zone
                </Text>
              </View>
              <Text className="mt-1 text-lg font-bold text-slate-900 leading-tight">
                {currentZone?.title || 'Exercise Area'}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500 font-medium">
                {gymTitle}
              </Text>
            </View>

            {/* Horizontal Thumbnails Strip (if multiple zones) */}
            {exerciseZones.length > 1 && (
              <ScrollView
                ref={thumbnailScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                className="pt-1">
                {exerciseZones.map((zone, idx) => {
                  const isActive = idx === selectedZoneIndex;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (isClosingZoneViewerRef.current || selectedZoneIndex === null) return;
                        setSelectedZoneIndex(idx);
                        try {
                          zoneListRef.current?.scrollToIndex({ index: idx, animated: true });
                        } catch {}
                      }}
                      style={{
                        height: 56,
                        width: 56,
                        borderRadius: 14,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: isActive ? '#E23744' : '#E2E8F0',
                        opacity: isActive ? 1 : 0.6,
                        backgroundColor: '#F1F5F9',
                      }}>
                      {Boolean(zone.image) ? (
                        <ExpoImage
                          source={{ uri: zone.image }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-slate-100">
                          <Ionicons name="barbell-outline" size={16} color="#94A3B8" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
