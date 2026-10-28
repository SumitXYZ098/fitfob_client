import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  type ScrollViewInstance,
  Image,
  useWindowDimensions,
  Modal,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import AllGymsMapView, { AllGymsMapViewHandle, MapGymItem } from '@/components/modules/AllGymsMapView';
import { useNearbyGyms, useGetFavorites, extractFavoriteIds } from '@/hook/useClient';
import CategoryPillItem, { CATEGORIES, CategoryOption } from '@/components/CategoryPillItem';
import GymCard, {
  GymCardSkeleton,
  GymItem,
  gymMatchesCategory,
  mapClubOwnerToGym,
} from '@/components/GymCard';

export { GymItem };

export default function Mapviewscreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // 3-Stage Snap Positions (GPU hardware accelerated translateY):
  // 1. Full: translateY = 0 (Full vertical scrollable list)
  // 2. Half: translateY = FULL_HEIGHT - HALF_HEIGHT (Initial state, map on top, gym card below)
  // 3. Minimized: translateY = FULL_HEIGHT + 30 (Slid completely off-screen, full map visible)
  const FULL_HEIGHT = Math.round(screenHeight * 0.88);
  const HALF_HEIGHT = Math.round(screenHeight * 0.55);

  const TRANSLATE_FULL = 0;
  const TRANSLATE_HALF = FULL_HEIGHT - HALF_HEIGHT;
  const TRANSLATE_MIN = FULL_HEIGHT + 30;

  const [sheetState, setSheetState] = useState<'minimized' | 'half' | 'full'>('half');
  const translateYAnim = useRef(new Animated.Value(TRANSLATE_HALF)).current;
  const currentTranslateY = useRef(TRANSLATE_HALF);

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
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [city, setCity] = useState<string>('');
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const { data: favoritesData, refetch: refetchFavorites } = useGetFavorites();
  const favoriteIds = useMemo(() => extractFavoriteIds(favoritesData), [favoritesData]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'all'>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  // Fetch user location for full map view
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getLastKnownPositionAsync();
          if (loc && isMounted) {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
          const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (fresh && isMounted) {
            setUserLocation({
              latitude: fresh.coords.latitude,
              longitude: fresh.coords.longitude,
            });
            const [geo] = await Location.reverseGeocodeAsync({
              latitude: fresh.coords.latitude,
              longitude: fresh.coords.longitude,
            });
            if (geo?.city && isMounted) setCity(geo.city);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hook to fetch nearby gyms from backend endpoint: /api/club-owners/search
  const {
    data: nearbyData,
    isLoading,
    isPending,
  } = useNearbyGyms({
    latitude: userLocation?.latitude,
    longitude: userLocation?.longitude,
  });

  const rawGyms: GymItem[] = useMemo(() => {
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

  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const mapRef = useRef<AllGymsMapViewHandle>(null);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const snapTo = (state: 'minimized' | 'half' | 'full') => {
    let target = TRANSLATE_HALF;
    if (state === 'minimized') target = TRANSLATE_MIN;
    if (state === 'full') target = TRANSLATE_FULL;

    currentTranslateY.current = target;

    if (state === 'minimized') {
      // Smooth timing animation to slide off-screen with ZERO overshoot, bounce, or blinking!
      Animated.timing(translateYAnim, {
        toValue: target,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setSheetState('minimized');
      });
    } else {
      setSheetState(state);
      Animated.spring(translateYAnim, {
        toValue: target,
        damping: 24,
        mass: 0.8,
        stiffness: 220,
        overshootClamping: true, // Prevents oscillation/blinking completely
        useNativeDriver: true,
      }).start();
    }
  };

  // PanResponder to handle ultra-smooth dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newY = currentTranslateY.current + gestureState.dy;
        if (newY >= -10 && newY <= TRANSLATE_MIN) {
          translateYAnim.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dy = gestureState.dy;
        const vy = gestureState.vy;

        if (dy > 35 || vy > 0.35) {
          // Dragged DOWN
          if (currentTranslateY.current === TRANSLATE_FULL) {
            snapTo('half');
          } else {
            snapTo('minimized');
          }
        } else if (dy < -35 || vy < -0.35) {
          // Dragged UP
          if (currentTranslateY.current === TRANSLATE_MIN) {
            snapTo('half');
          } else {
            snapTo('full');
          }
        } else {
          // Snap to closest
          const currentVal = currentTranslateY.current + dy;
          const distMin = Math.abs(currentVal - TRANSLATE_MIN);
          const distHalf = Math.abs(currentVal - TRANSLATE_HALF);
          const distFull = Math.abs(currentVal - TRANSLATE_FULL);

          const minD = Math.min(distMin, distHalf, distFull);
          if (minD === distMin) snapTo('minimized');
          else if (minD === distHalf) snapTo('half');
          else snapTo('full');
        }
      },
    })
  ).current;

  // Filter and sort gyms
  const filteredGyms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rawGyms
      .filter((gym) => {
        const matchesCategory =
          selectedCategory === 'All' || gymMatchesCategory(gym, selectedCategory);
        const matchesSearch =
          !q ||
          gym.title.toLowerCase().includes(q) ||
          gym.amenities.some((a) => a.toLowerCase().includes(q)) ||
          (gym.address && gym.address.toLowerCase().includes(q)) ||
          (gym.city && gym.city.toLowerCase().includes(q));
        const matchesOpen = !onlyOpen || gym.isOpen;
        return matchesCategory && matchesSearch && matchesOpen;
      })
      .sort((a, b) => {
        if (q) {
          const aName = (a.title || '').toLowerCase();
          const bName = (b.title || '').toLowerCase();
          const aStarts = aName.startsWith(q);
          const bStarts = bName.startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
        }
        if (sortBy === 'rating') {
          return parseFloat(b.rating) - parseFloat(a.rating);
        }
        if (sortBy === 'price') {
          const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10) || 0;
          const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10) || 0;
          return priceA - priceB;
        }
        return 0;
      });
  }, [rawGyms, selectedCategory, searchQuery, onlyOpen, sortBy]);

  // Keep selected gym updated when list changes
  useEffect(() => {
    if (filteredGyms.length > 0) {
      if (!selectedGymId || !filteredGyms.some((g) => g.id === selectedGymId)) {
        setSelectedGymId(filteredGyms[0].id);
      }
    }
  }, [filteredGyms, selectedGymId]);

  const selectedGym = useMemo(() => {
    return filteredGyms.find((g) => g.id === selectedGymId) || filteredGyms[0] || null;
  }, [filteredGyms, selectedGymId]);

  // Gyms mapped for AllGymsMapView with title, category, price, coordinates
  const mapGyms: MapGymItem[] = useMemo(() => {
    if (isLoading || (isPending && !nearbyData)) {
      return [];
    }
    return filteredGyms.map((g) => ({
      id: g.id,
      title: g.title,
      rating: g.rating,
      price: g.price,
      category: g.category || 'Gym',
      isOpen: g.isOpen,
      image: g.images && g.images.length > 0 ? g.images[0] : '',
      coordinate: g.coordinate,
    }));
  }, [filteredGyms, isLoading, isPending, nearbyData]);

  // Reorder so that the selected gym on the map always comes to the very top of the list
  const displayGyms = useMemo(() => {
    if (!selectedGymId) return filteredGyms;
    const selected = filteredGyms.find((g) => g.id === selectedGymId);
    if (!selected) return filteredGyms;
    return [selected, ...filteredGyms.filter((g) => g.id !== selectedGymId)];
  }, [filteredGyms, selectedGymId]);

  const focusGymOnMap = (gym: GymItem) => {
    setSelectedGymId(gym.id);
    mapRef.current?.focusGym(gym.id);
    snapTo('minimized');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]" edges={['top']}>
      {/* 1. Header Bar: Back Button, Search Bar, and Filter Button */}
      <View className="flex-row items-center px-4 pb-2 pt-2 bg-[#FAF7F8] z-20">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        {/* Search Bar */}
        <View className="flex-1 flex-row items-center rounded-full border border-[#E5E7EB] bg-white px-4 py-2 shadow-sm">
          <TextInput
            placeholder="Search club name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="font-regular flex-1 py-0.5 pr-2 text-sm text-darkText"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-0.5">
              <Ionicons name="close-circle" size={17} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          onPress={() => setIsFilterModalVisible(true)}
          className={`ml-2 h-11 w-11 items-center justify-center rounded-full shadow-sm ${sortBy !== 'all' || onlyOpen ? 'border border-[#E23744] bg-[#FFEAEF]' : 'bg-[#FFEAEF]'
            }`}
          activeOpacity={0.8}>
          <Ionicons name="options-outline" size={20} color="#E23744" />
        </TouchableOpacity>
      </View>

      {/* 2. FULL MAP AREA (Dedicated AllGymsMapView showing all gyms with name badges & interactive popups) */}
      <View style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#FAF7F8' }}>
        <AllGymsMapView
          ref={mapRef}
          gyms={mapGyms}
          selectedGymId={selectedGymId}
          userLocation={userLocation}
          onSelectGym={(gymId) => {
            setSelectedGymId(gymId);
            if (sheetState === 'minimized') {
              snapTo('half');
            }
            // Smoothly scroll list to the very top so the selected gym card is immediately at top
            scrollViewRef.current?.scrollTo({
              y: 0,
              animated: true,
            });
          }}
          onOpenGymDetail={(gymId) => {
            const isFav = favoriteIds.has(String(gymId));
            router.push({
              pathname: '/gym/gym-detail' as any,
              params: { id: gymId, initialIsFav: String(isFav) },
            });
          }}
          style={{ flex: 1, width: '100%', height: '100%' }}
        />
      </View>

      {/* 3. SLIDING BOTTOM SHEET */}
      <Animated.View
        pointerEvents={sheetState === 'minimized' ? 'none' : 'auto'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: FULL_HEIGHT,
          transform: [{ translateY: translateYAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 10,
        }}
        className="rounded-t-[32px] bg-white border-t border-gray-100 overflow-hidden">
        {/* Top Handle & Drag Area (PanResponder) */}
        <View
          {...panResponder.panHandlers}
          className="items-center px-4 pt-3 pb-2 bg-white border-b border-gray-100">
          {/* Pull Handle Bar */}
          <View className="h-1.5 w-12 rounded-full bg-slate-300 mb-2.5" />

          {/* Clean Centered Header */}
          <View className="flex-row items-center justify-between w-full px-2 mb-2.5">
            <View className="w-8" />
            <Text className="font-bold text-base text-[#1E293B] text-center">
              {(isLoading || (isPending && !nearbyData))
                ? 'Finding gyms near you...'
                : `${filteredGyms.length} Gym's Near You`}
            </Text>
            {/* Quick minimize chevron to slide sheet down */}
            <TouchableOpacity
              onPress={() => snapTo('minimized')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Stylish Category Horizontal Scroll inside bottom sheet */}
          <View className="w-full pb-1.5 pt-0.5">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4 }}>
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
        </View>

        {/* Scrollable Gym Cards */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 70,
          }}>
          {(isLoading || (isPending && !nearbyData)) ? (
            <View>
              <GymCardSkeleton />
              <GymCardSkeleton />
              <GymCardSkeleton />
            </View>
          ) : displayGyms.length === 0 ? (
            <View className="items-center justify-center py-12">
            <GymCardSkeleton />
            </View>
          ) : (
            displayGyms.map((gym) => {
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
                  onToggleFavorite={() => {
                    toggleFavorite(gym.id);
                    refetchFavorites?.();
                  }}
                />
              );
            })
          )}
        </ScrollView>
      </Animated.View>

      {/* 5. Floating "View List" Button (Appears only when bottom sheet is slid down / minimized) */}
      {sheetState === 'minimized' && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => snapTo('half')}
          className="absolute bottom-7 self-center z-30 flex-row items-center rounded-full bg-[#E23744] px-6 py-3.5 shadow-lg"
          style={{
            shadowColor: '#E23744',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          }}>
          <Ionicons name="list-outline" size={19} color="#FFFFFF" />
          <Text className="ml-2 font-bold text-base text-white">View List</Text>
        </TouchableOpacity>
      )}

      {/* 5. Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            className="rounded-t-3xl bg-white p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-bold text-xl text-darkText">Filter & Sort</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <Text className="mb-2 font-semibold text-sm text-gray-500">SORT BY</Text>
            <View className="mb-4 flex-row space-x-2">
              {[
                { label: 'Default', value: 'all' },
                { label: 'Highest Rated', value: 'rating' },
                { label: 'Price: Low to High', value: 'price' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSortBy(opt.value as any)}
                  className={`mr-2 rounded-full border px-4 py-2 ${sortBy === opt.value
                    ? 'border-[#E23744] bg-[#FFEAEF]'
                    : 'border-gray-200 bg-white'
                    }`}>
                  <Text
                    className={`font-semibold text-xs ${sortBy === opt.value ? 'text-[#E23744]' : 'text-gray-700'
                      }`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Options */}
            <Text className="mb-2 font-semibold text-sm text-gray-500">STATUS</Text>
            <TouchableOpacity
              onPress={() => setOnlyOpen((prev) => !prev)}
              className={`mb-6 flex-row items-center rounded-xl border p-3 ${onlyOpen ? 'border-[#E23744] bg-[#FFEAEF]' : 'border-gray-200 bg-white'
                }`}>
              <Ionicons
                name={onlyOpen ? 'checkbox' : 'square-outline'}
                size={20}
                color={onlyOpen ? '#E23744' : '#6B7280'}
              />
              <Text className="ml-2 font-medium text-sm text-darkText">Only show gyms open now</Text>
            </TouchableOpacity>

            {/* Actions */}
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => {
                  setSortBy('all');
                  setOnlyOpen(false);
                  setIsFilterModalVisible(false);
                }}
                className="mr-3 flex-1 items-center rounded-full border border-gray-300 py-3">
                <Text className="font-semibold text-base text-gray-700">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                className="flex-1 items-center rounded-full bg-[#E23744] py-3">
                <Text className="font-semibold text-base text-white">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
