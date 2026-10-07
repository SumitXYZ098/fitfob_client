import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import GymCard, {
  GymCardSkeleton,
  GymItem,
  mapClubOwnerToGym,
} from '@/components/GymCard';
import { useGetFavorites } from '@/hook/useClient';

export default function FavoritesScreen() {
  const router = useRouter();
  const { data: rawFavData, isLoading, isRefetching, refetch } = useGetFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Parse raw backend favorites response to GymItem array
  const favoriteGyms: GymItem[] = useMemo(() => {
    if (!rawFavData) return [];

    const rawList = Array.isArray(rawFavData)
      ? rawFavData
      : Array.isArray(rawFavData?.data)
        ? rawFavData.data
        : Array.isArray(rawFavData?.favorites)
          ? rawFavData.favorites
          : [];

    return rawList
      .map(mapClubOwnerToGym)
      .filter((gym: GymItem) => {
        // Exclude items optimistically removed during current session
        if (removedIds.has(gym.id)) return false;
        if (gym.documentId && removedIds.has(gym.documentId)) return false;
        return true;
      });
  }, [rawFavData, removedIds]);

  // Filter gyms according to search query
  const filteredGyms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return favoriteGyms;

    return favoriteGyms.filter((gym) => {
      const titleMatch = (gym.title || '').toLowerCase().includes(q);
      const cityMatch = (gym.city || '').toLowerCase().includes(q);
      const addressMatch = (gym.address || '').toLowerCase().includes(q);
      const categoryMatch = (gym.category || '').toLowerCase().includes(q);
      const amenitiesMatch = (gym.amenities || []).some((a) =>
        a.toLowerCase().includes(q)
      );
      const servicesMatch = (gym.services || []).some((s) =>
        s.toLowerCase().includes(q)
      );

      return (
        titleMatch ||
        cityMatch ||
        addressMatch ||
        categoryMatch ||
        amenitiesMatch ||
        servicesMatch
      );
    });
  }, [favoriteGyms, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRemovedIds(new Set()); // Reset optimistic removals on manual pull-to-refresh
    try {
      await refetch();
    } catch (e) {
      console.log('Error refreshing favorites:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleToggleFavorite = (gym: GymItem) => {
    // Optimistically remove from list on this screen
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(gym.id);
      if (gym.documentId) next.add(gym.documentId);
      return next;
    });

    Toast.show({
      type: 'info',
      text1: 'Removed from Favorites',
      text2: `${gym.title} was removed from your saved list`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7F8" />

      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between border-b border-gray-100 bg-[#FAF7F8] px-4 pb-3 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="font-bold text-lg text-slate-900">Favorite Gyms</Text>
          <Text className="font-medium text-xs text-slate-500">
            {isLoading ? 'Loading...' : `${favoriteGyms.length} Saved ${favoriteGyms.length === 1 ? 'Club' : 'Clubs'}`}
          </Text>
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-[#FFEAEF]">
          <Ionicons name="heart" size={20} color="#E23744" />
        </View>
      </View>

      {/* 2. Search Bar (Rendered when favorites exist) */}
      {favoriteGyms.length > 0 && (
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center rounded-2xl border border-gray-200/80 bg-white px-3.5 py-2.5 shadow-sm">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search saved clubs, cities, amenities..."
              placeholderTextColor="#9CA3AF"
              className="ml-2.5 flex-1 font-regular text-sm text-slate-800"
            />
            {Boolean(searchQuery.trim()) && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 3. Main Content List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            colors={['#E23744']}
            tintColor="#E23744"
          />
        }>
        {isLoading ? (
          <View>
            <GymCardSkeleton />
            <GymCardSkeleton />
            <GymCardSkeleton />
          </View>
        ) : filteredGyms.length > 0 ? (
          filteredGyms.map((gym) => (
            <GymCard
              key={gym.id}
              gym={gym}
              isFav={true}
              onToggleFavorite={() => handleToggleFavorite(gym)}
            />
          ))
        ) : searchQuery.trim() ? (
          /* Search Empty State */
          <View className="my-12 items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <View className="mb-3.5 h-16 w-16 items-center justify-center rounded-full bg-[#FFEAEF]">
              <Ionicons name="search-outline" size={28} color="#E23744" />
            </View>
            <Text className="text-center font-bold text-lg text-slate-800">
              No Matches Found
            </Text>
            <Text className="mt-1 px-4 text-center font-regular text-xs text-slate-500 leading-5">
              No saved gyms matched "{searchQuery}". Try searching for another name or location.
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.8}
              className="mt-5 rounded-full bg-slate-100 px-5 py-2">
              <Text className="font-semibold text-xs text-slate-700">Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Zero Favorites Empty State */
          <View className="my-auto items-center justify-center py-10 px-4">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-[#FFEAEF] shadow-sm">
              <Ionicons name="heart-dislike-outline" size={44} color="#E23744" />
            </View>
            <Text className="text-center font-bold text-xl text-slate-900">
              No Favorites Yet
            </Text>
            <Text className="mt-2 max-w-[280px] text-center font-regular text-sm text-slate-500 leading-6">
              You haven't saved any gyms yet. Explore top clubs near you and tap the heart icon to access them quickly anytime!
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/(tabs)' as any)}
              className="mt-6 flex-row items-center space-x-2 rounded-full bg-[#E23744] px-6 py-3.5 shadow-md shadow-[#E23744]/25">
              <Ionicons name="compass-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text className="font-bold text-sm text-white">Explore Nearby Gyms</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
