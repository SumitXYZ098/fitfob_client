import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import CategoryPillItem, { CATEGORIES } from '@/components/CategoryPillItem';
import OpenStreetMapLocationModal, {
  SelectedLocationData,
} from '@/components/modules/OpenStreetMapLocationModal';
import { useNearbyGyms, useGetFavorites, extractFavoriteIds } from '@/hook/useClient';
import { useAuthStore } from '@/store/useAuthStore';
import GymCard, {
  GymCardSkeleton,
  GymItem,
  HolidayItem,
  HolidayInfo,
  gymMatchesCategory,
  getDisplayFeatures,
  getFeatureIcon,
  getHolidayInfo,
} from '@/components/GymCard';

export {
  GymCard,
  GymCardSkeleton,
  GymItem,
  HolidayItem,
  HolidayInfo,
  gymMatchesCategory,
  getDisplayFeatures,
  getFeatureIcon,
  getHolidayInfo,
};

const extractStringList = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          return String(item.name || item.title || item.category || item.service || item.value || '').trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof val === 'string') {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (typeof val === 'object') {
    const text = val.name || val.title || val.category || val.service;
    if (text) return [String(text).trim()];
  }
  return [];
};

const mapClubOwnerToGym = (item: any): GymItem => {
  const data = item?.attributes ? { id: item.id, ...item.attributes } : item || {};

  const title =
    data.clubName ||
    data.businessName ||
    data.gymName ||
    data.name ||
    data.title ||
    data.club_name ||
    'Fitness Club';

  const ratingVal = data.rating || data.avgRating || data.reviewsRating || 4.5;
  const rating =
    typeof ratingVal === 'string' && ratingVal.includes('/') ? ratingVal : `${ratingVal}/5`;

  const rawServices = extractStringList(data.services || data.service);
  const rawCategories = extractStringList(data.categories || data.category);
  const rawActivities = extractStringList(data.activities || data.activity);
  const rawFacilities = extractStringList(data.facilities || data.facility);
  const rawAmenities = extractStringList(data.amenities);
  const clubType = data.clubType || data.club_type || data.type || '';

  // Determine display category
  let category = 'Gyms';
  const lowerTitle = title.toLowerCase();
  if (rawCategories.length > 0) {
    category = rawCategories[0];
  } else if (rawServices.length > 0) {
    category = rawServices[0];
  } else if (clubType) {
    category = clubType;
  } else if (lowerTitle.includes('yoga')) {
    category = 'Yoga';
  } else if (lowerTitle.includes('box')) {
    category = 'Boxing';
  } else if (lowerTitle.includes('dance')) {
    category = 'Dance';
  } else if (lowerTitle.includes('crossfit')) {
    category = 'CrossFit';
  } else if (lowerTitle.includes('zumba')) {
    category = 'Zumba';
  } else if (lowerTitle.includes('pilates')) {
    category = 'Pilates';
  }

  let amenities: string[] = Array.from(new Set([...rawAmenities, ...rawFacilities]));
  if (!amenities.length) {
    amenities = ['AC', 'Wi-Fi', 'Trainers', 'Shower', 'Parking'];
  }

  const services: string[] = Array.from(
    new Set([...rawServices, ...rawActivities, ...rawCategories, category])
  );

  let price = '₹1200/Monthly';
  if (data.price) {
    price = typeof data.price === 'number' ? `₹${data.price}/Monthly` : String(data.price);
  } else if (data.monthlyPrice) {
    price = `₹${data.monthlyPrice}/Monthly`;
  } else if (data.startingPrice) {
    price = `₹${data.startingPrice}/Monthly`;
  } else if (Array.isArray(data.membershipPlans) && data.membershipPlans[0]?.price) {
    price = `₹${data.membershipPlans[0].price}/Monthly`;
  }

  const isOpen = data.isOpen !== undefined ? Boolean(data.isOpen) : true;
  const isVerified =
    data.isVerified !== undefined
      ? Boolean(data.isVerified)
      : data.verification_status === 'approved' || true;

  const fallbackImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
  ];

  let images: string[] = [];
  const rawImages =
    data.club_photos ||
    data.clubPhotos ||
    data.photos ||
    data.images ||
    data.gallery ||
    [];

  if (Array.isArray(rawImages) && rawImages.length > 0) {
    images = rawImages
      .map((img: any) => {
        const url =
          img?.url ||
          img?.formats?.large?.url ||
          img?.formats?.medium?.url ||
          img?.formats?.small?.url ||
          (typeof img === 'string' ? img : null);
        if (!url) return null;
        return url.startsWith('http') ? url : `${process.env.EXPO_PUBLIC_API_URL}${url}`;
      })
      .filter(Boolean) as string[];
  } else if (data.coverImage?.url || data.logo?.url) {
    const single = data.coverImage?.url || data.logo?.url;
    images = [single.startsWith('http') ? single : `${process.env.EXPO_PUBLIC_API_URL}${single}`];
  }

  if (!images.length) {
    images = fallbackImages;
  }

  return {
    id: String(data.documentId || data._id || data.id || Math.random().toString()),
    documentId: data.documentId ? String(data.documentId) : (typeof data.id === 'string' ? data.id : undefined),
    title,
    rating,
    amenities,
    price,
    isOpen,
    isVerified,
    images,
    category,
    categories: rawCategories,
    services,
    city: data.city || data.location?.city || '',
    address: data.address || data.location?.address || data.clubAddress || '',
    distance: data.distance
      ? typeof data.distance === 'number'
        ? `${data.distance.toFixed(2)} ${data.distanceUnit || 'km'}`
        : `${data.distance} ${data.distanceUnit || 'km'}`
      : undefined,
    coordinate: {
      latitude: Number(data.latitude || data.lat || 30.8321),
      longitude: Number(data.longitude || data.lng || 76.6873),
    },
    description: data.description || data.about || data.bio || '',
    holidays: Array.isArray(data.holidays) ? data.holidays : [],
  };
};

// ─── Main HomeScreen Component ───────────────────────────────────────────


export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoryAnimTrigger, setCategoryAnimTrigger] = useState<{ id: string; time: number }>({
    id: 'All',
    time: 0,
  });

  const handleSelectCategory = (catId: string) => {
    if (selectedCategory === catId) {
      setSelectedCategory('All');
      setCategoryAnimTrigger({ id: 'All', time: Date.now() });
    } else {
      setSelectedCategory(catId);
      setCategoryAnimTrigger({ id: catId, time: Date.now() });
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const { data: favoritesData } = useGetFavorites();
  const favoriteIds = useMemo(() => extractFavoriteIds(favoritesData), [favoritesData]);

  // Debounce search input so user typing doesn't spam requests on every keystroke
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedSearchQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Default coordinates from endpoint provided by user
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 30.832111611338167,
    longitude: 76.6873704048281,
  });
  const [city, setCity] = useState<string>('Chandigarh');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);

  const handleLocationConfirmed = (locData: SelectedLocationData) => {
    setCoords({
      latitude: locData.latitude,
      longitude: locData.longitude,
    });
    setCity(locData.city.toLowerCase());
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  // Auto-detect current device location
  const detectLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc?.coords) {
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          try {
            const addresses = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (addresses && addresses.length > 0) {
              const addr = addresses[0];
              const detectedCity =
                addr.city || addr.subregion || addr.district || addr.region || 'malikpur';
              setCity(detectedCity.toLowerCase());
            }
          } catch (geoErr) {
            console.log('Reverse geocoding error:', geoErr);
          }
        }
      }
    } catch (err) {
      console.log('Location detection error:', err);
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const searchCity = debouncedSearchQuery.trim();
  const isCitySearch = Boolean(searchCity);

  // Hook to fetch nearby gyms from backend endpoint: /api/club-owners/search
  // When a city name is typed, run with city and disable latitude and longitude
  const {
    data: nearbyData,
    isLoading,
    isPending,
    refetch,
  } = useNearbyGyms(
    isCitySearch
      ? {
          city: searchCity,
        }
      : {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
  );

  const handleSearchSubmit = () => {
    if (debouncedSearchQuery.trim() !== searchQuery.trim()) {
      setDebouncedSearchQuery(searchQuery);
    } else {
      refetch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  useEffect(() => {
    if (nearbyData) {
      console.log('📋 [HomeScreen] Nearby Gyms API Response:', JSON.stringify(nearbyData.data[3], null, 2));
    }
  }, [nearbyData]);

  const gyms: GymItem[] = useMemo(() => {
    if (!nearbyData) return [];

    const rawList = Array.isArray(nearbyData)
      ? nearbyData
      : Array.isArray(nearbyData?.data)
        ? nearbyData.data
        : Array.isArray(nearbyData?.clubs)
          ? nearbyData.clubs
          : Array.isArray(nearbyData?.results)
            ? nearbyData.results
            : [];

    return rawList.map(mapClubOwnerToGym);
  }, [nearbyData]);

  const filteredGyms = useMemo(() => {
    // 1. Search Query Filter
    const activeSearch = debouncedSearchQuery.trim() || searchQuery.trim();
    const searchFiltered = gyms.filter((gym) => {
      if (!activeSearch) return true;

      const q = activeSearch.toLowerCase();
      const inTitle = (gym.title || '').toLowerCase().includes(q);
      const inCity =
        (gym.city || '').toLowerCase().includes(q) ||
        (gym.city && q.includes(gym.city.toLowerCase()));
      const inAddress = (gym.address || '').toLowerCase().includes(q);
      const inCategory = (gym.category || '').toLowerCase().includes(q);
      const inCategories = gym.categories?.some((c) => c.toLowerCase().includes(q));
      const inAmenities = gym.amenities?.some((a) => a.toLowerCase().includes(q));
      const inServices = gym.services?.some((s) => s.toLowerCase().includes(q));
      const inDesc = (gym.description || '').toLowerCase().includes(q);

      return (
        inTitle ||
        inCity ||
        inAddress ||
        inCategory ||
        inCategories ||
        inAmenities ||
        inServices ||
        inDesc
      );
    });

    if (!selectedCategory || selectedCategory === 'All') {
      return searchFiltered;
    }

    // 2. Prioritize: cards matching selectedCategory appear FIRST!
    const matching: GymItem[] = [];
    const others: GymItem[] = [];

    searchFiltered.forEach((g) => {
      if (gymMatchesCategory(g, selectedCategory)) {
        matching.push(g);
      } else {
        others.push(g);
      }
    });

    return [...matching, ...others];
  }, [gyms, selectedCategory, debouncedSearchQuery, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), detectLocation()]);
    } catch (e) {
      console.log('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, detectLocation]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]">
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7F8" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E23744']} />
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 90 : 70 }}>
        {/* 1. Header Bar */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          {/* Location selector */}
          <TouchableOpacity
            onPress={() => setIsLocationModalVisible(true)}
            activeOpacity={0.7}
            className="flex-row items-center space-x-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#FFEAEF]">
              <Ionicons name="location" size={20} color="#E23744" />
            </View>
            <View className="ml-2">
              <View className="flex-row items-center">
                <Text className="font-bold text-lg capitalize text-darkText" numberOfLines={1}>
                  {city}
                </Text>
                <Ionicons name="chevron-down" size={15} color="#1E293B" style={{ marginLeft: 4 }} />
                {isLocating && (
                  <ActivityIndicator size="small" color="#E23744" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text className="font-regular text-[11px] text-slate-400">Tap to change location</Text>
            </View>
          </TouchableOpacity>

          {/* Action Icons */}
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              onPress={() => router.push('/account/notifications' as any)}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#FFEAEF]">
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path
                  d="M6.95508 18.1195C7.35096 19.2153 8.57752 20 9.99852 20C11.4195 20 12.6461 19.2153 13.042 18.1195C12.1264 18.1937 11.1155 18.2326 9.99852 18.2326C8.88151 18.2326 7.8706 18.1937 6.95508 18.1195Z"
                  fill="#E23744"
                />
                <Path
                  d="M11.3909 1.40357C11.293 0.711327 10.6973 0.198768 9.99817 0.205261C9.30231 0.207544 8.7116 0.715813 8.60547 1.40357C9.52485 1.21979 10.4715 1.21979 11.3909 1.40357Z"
                  fill="#E23744"
                />
                <Path
                  d="M17.2596 11.0535C16.7412 10.4997 16.3194 9.86286 16.0118 9.16948C15.8657 8.7492 15.7441 8.32074 15.6477 7.88637C15.068 5.53222 14.1878 1.97272 9.99914 1.97272C5.81043 1.97272 4.93029 5.53222 4.35056 7.88637C4.25414 8.32078 4.13259 8.7492 3.98647 9.16948C3.6789 9.86286 3.25708 10.4997 2.7387 11.0535C2.07416 11.8418 1.38488 12.6618 1.19048 14.0404C1.0786 14.6282 1.24427 15.2347 1.6394 15.684C2.69982 16.9071 5.51352 17.5257 9.99914 17.5257C14.4847 17.5257 17.2984 16.9071 18.3589 15.684C18.754 15.2347 18.9196 14.6282 18.8078 14.0404C18.6134 12.6618 17.9241 11.8418 17.2596 11.0535ZM7.13207 4.66368C6.41417 5.58944 6.02888 6.98781 5.72347 8.22566C5.61419 8.72126 5.47354 9.20946 5.30248 9.68727C5.25911 9.80863 5.15314 9.89678 5.02591 9.91733C4.89869 9.93787 4.77036 9.88754 4.69103 9.78597C4.6117 9.6844 4.59391 9.54769 4.64463 9.42924C4.80287 8.98177 4.93356 8.52505 5.03595 8.06164C5.35974 6.74812 5.77085 5.26565 6.57359 4.2303C6.65044 4.12889 6.77586 4.07659 6.90202 4.09339C7.02814 4.1102 7.13553 4.19351 7.18311 4.31152C7.23073 4.42958 7.21125 4.56404 7.13207 4.66368ZM8.69729 3.56509C8.47358 3.63396 8.2582 3.72738 8.05503 3.84363C8.00143 3.87503 7.9404 3.89152 7.8783 3.89136C7.71834 3.89136 7.57828 3.78389 7.53688 3.62936C7.49549 3.47482 7.56301 3.31175 7.70157 3.23174C7.95035 3.08945 8.21429 2.97537 8.48841 2.8917C8.61009 2.85062 8.74452 2.87876 8.83947 2.96521C8.93443 3.05167 8.97504 3.18287 8.94549 3.30789C8.91593 3.43287 8.82094 3.53204 8.69729 3.56683V3.56509Z"
                  fill="#E23744"
                />
              </Svg>
              <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E23744]" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/account/profile' as any)}
              className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-[#FFEAEF]">
              <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
                <Path
                  d="M16.45 11.6667C17.1263 11.6667 17.7749 11.9301 18.2531 12.3989C18.7313 12.8677 19 13.5036 19 14.1667V14.7625C19 17.7433 15.4215 20 10.5 20C5.5785 20 2 17.8608 2 14.7625V14.1667C2 13.5036 2.26866 12.8677 2.74688 12.3989C3.2251 11.9301 3.8737 11.6667 4.55 11.6667H16.45ZM10.5 0C11.1697 -9.78424e-09 11.8329 0.129329 12.4517 0.380602C13.0704 0.631876 13.6327 1.00017 14.1062 1.46447C14.5798 1.92876 14.9555 2.47995 15.2118 3.08658C15.4681 3.69321 15.6 4.34339 15.6 5C15.6 5.65661 15.4681 6.30679 15.2118 6.91342C14.9555 7.52004 14.5798 8.07124 14.1062 8.53553C13.6327 8.99983 13.0704 9.36812 12.4517 9.6194C11.8329 9.87067 11.1697 10 10.5 10C9.1474 10 7.85019 9.47322 6.89376 8.53553C5.93732 7.59785 5.4 6.32608 5.4 5C5.4 3.67392 5.93732 2.40215 6.89376 1.46447C7.85019 0.526784 9.1474 1.97602e-08 10.5 0Z"
                  fill="#E23744"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Search Bar */}
        <View className="my-2 px-4">
          <View className="flex-row items-center rounded-full border border-[#F3F4F6] bg-white px-4 py-2 shadow-sm">
            {/* <Feather name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} /> */}
            <TextInput
              placeholder="Search city name"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
              className="font-regular flex-1 py-1 pr-1 text-base text-darkText"
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="mr-2">
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSearchSubmit}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#E23744]">
              <Feather name="search" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Category Horizontal Scroll */}
        <View className="my-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}>
            {CATEGORIES.map((cat) => (
              <CategoryPillItem
                key={cat.id}
                cat={cat}
                isSelected={selectedCategory === cat.id}
                animTrigger={categoryAnimTrigger.id === cat.id ? categoryAnimTrigger.time : 0}
                onPress={() => handleSelectCategory(cat.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 4. Offer Banner */}
        <View className="my-3 px-4">
          <View className="relative overflow-hidden rounded-2xl bg-primary p-5 shadow-md">
            {/* Background design accents */}
            <View className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
            <View className="absolute -top-10 right-12 h-24 w-24 rounded-full bg-white/10" />

            <Text className="font-bold font-boldHelvetica text-lg leading-tight text-white">
              Discover Gyms That Match Your Goals
            </Text>
            <Text className="mt-2 font-medium text-sm text-white/80">
              Up to 50% OFF on monthly gym passes
            </Text>
          </View>
        </View>

        {/* 5. Nearby Gym Section Header */}
        <View className="mb-3 mt-4 flex-row items-center justify-between px-4">
          <Text className="font-bold text-xl text-darkText">Nearby Gym</Text>
          <TouchableOpacity
            onPress={() => router.push('/gym/ViewAllScreen' as any)}
            className="flex-row items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 ">
            <Text className="font-semibold text-sm text-[#E23744]">View All</Text>
            <Ionicons name="chevron-forward" size={14} color="#E23744" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>

        {/* 6. Gym Cards */}
        <View className="px-4">
          {(isLoading || (isPending && !nearbyData)) ? (
            <View>
              <GymCardSkeleton />
              <GymCardSkeleton />
              <GymCardSkeleton />
            </View>
          ) : filteredGyms.length > 0 ? (
            filteredGyms.map((gym) => {
              const isTopMatch =
                selectedCategory !== 'All' && gymMatchesCategory(gym, selectedCategory);
              const isGymFav =
                favorites[gym.id] !== undefined
                  ? favorites[gym.id]
                  : favoriteIds.has(String(gym.documentId || gym.id));
              return (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  isTopMatch={isTopMatch}
                  selectedCategory={selectedCategory}
                  isFav={isGymFav}
                  onToggleFavorite={() => toggleFavorite(gym.id)}
                />
              );
            })
          ) : (selectedCategory !== 'All' || searchQuery.trim()) ? (
            <View className="my-6 items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-[#FFEAEF]">
                <Ionicons name="filter-outline" size={30} color="#E23744" />
              </View>
              <Text className="mt-1 text-center font-bold text-lg text-darkText">
                No {selectedCategory !== 'All' ? selectedCategory : 'Results'} Found
              </Text>
              <Text className="mt-1 px-4 text-center font-regular text-xs text-secondaryText leading-5">
                We couldn&apos;t find any {selectedCategory !== 'All' ? selectedCategory.toLowerCase() : ''} options matching your filter in &quot;{searchCity || city}&quot;. Try exploring other categories or view all clubs.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory('All');
                  handleClearSearch();
                  setCategoryAnimTrigger({ id: 'All', time: Date.now() });
                }}
                activeOpacity={0.85}
                className="mt-4 flex-row items-center rounded-full bg-[#E23744] px-5 py-2.5 shadow-sm">
                <Ionicons name="refresh" size={15} color="#FFF" />
                <Text className="ml-1.5 font-semibold text-xs text-white">Show All Gyms</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="my-6 items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <Image
                source={require('@/assets/images/empty-gyms.png')}
                style={{ width: 190, height: 190, borderRadius: 24 }}
                resizeMode="contain"
              />
              <Text className="mt-3 text-center font-bold text-lg text-darkText">
                {(searchCity || city) ? `No Gyms Found in ${(searchCity || city).charAt(0).toUpperCase() + (searchCity || city).slice(1)}` : 'No Gyms Found Nearby'}
              </Text>
              <Text className="mt-1 px-4 text-center font-regular text-xs text-secondaryText leading-5">
                We couldn&apos;t find any fitness clubs registered around &quot;{searchCity || city || 'this area'}&quot; yet. You can explore all clubs across other areas or choose a different location.
              </Text>

              {/* Action Buttons */}
              <View className="mt-5 w-full items-center gap-2.5">
                <TouchableOpacity
                  onPress={() => {
                    setCity('');
                    setSelectedCategory('All');
                    handleClearSearch();
                    refetch();
                  }}
                  activeOpacity={0.85}
                  className="w-full flex-row items-center justify-center rounded-full bg-[#E23744] py-3 shadow-sm">
                  <Ionicons name="globe-outline" size={17} color="#FFF" />
                  <Text className="ml-2 font-semibold text-sm text-white">Explore All Registered Clubs</Text>
                </TouchableOpacity>

                <View className="flex-row items-center justify-center gap-2.5 w-full">
                  <TouchableOpacity
                    onPress={() => setIsLocationModalVisible(true)}
                    activeOpacity={0.85}
                    className="flex-1 flex-row items-center justify-center rounded-full border border-[#E23744]/20 bg-[#FFEAEF] py-2.5">
                    <Ionicons name="location-outline" size={15} color="#E23744" />
                    <Text className="ml-1.5 font-semibold text-xs text-[#E23744]">Change City</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => refetch()}
                    activeOpacity={0.8}
                    className="flex-1 flex-row items-center justify-center rounded-full border border-slate-200 bg-slate-50 py-2.5">
                    <Ionicons name="refresh-outline" size={15} color="#475569" />
                    <Text className="ml-1.5 font-semibold text-xs text-slate-600">Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Interactive OpenStreetMap Location Selection Modal */}
      <OpenStreetMapLocationModal
        visible={isLocationModalVisible}
        initialCoords={coords}
        initialCity={city}
        onClose={() => setIsLocationModalVisible(false)}
        onConfirm={handleLocationConfirmed}
      />
    </SafeAreaView>
  );
}
