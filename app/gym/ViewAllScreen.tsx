import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Modal,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Polygon, Line, Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import CategoryPillItem, { CATEGORIES } from '@/components/CategoryPillItem';
import { useNearbyGyms } from '@/hook/useClient';
import GymCard, {
  GymCardSkeleton,
  GymItem,
  HolidayItem,
  gymMatchesCategory,
  getDisplayFeatures,
  getFeatureIcon,
  getHolidayInfo,
} from '@/components/GymCard';

export { GymItem };

const ALL_GYMS: GymItem[] = [
  {
    id: '1',
    title: 'Anytime Fitness Gym',
    rating: '4.5/5',
    amenities: ['AC', 'Wi-Fi', 'Trainers', 'SPA', 'Shower', 'Parking'],
    price: '₹1200/Monthly',
    isOpen: true,
    isVerified: true,
    category: 'Gyms',
    coordinate: { latitude: 30.7333, longitude: 76.7794 },
    images: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  {
    id: '2',
    title: 'Gold’s Fitness Club',
    rating: '4.8/5',
    amenities: ['AC', 'Wi-Fi', 'Personal Trainer', 'Sauna', 'Locker'],
    price: '₹1500/Monthly',
    isOpen: true,
    isVerified: true,
    category: 'Gyms',
    coordinate: { latitude: 30.7398, longitude: 76.7827 },
    images: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  {
    id: '3',
    title: 'Cult.Fit Elite Center',
    rating: '4.7/5',
    amenities: ['Boxing', 'CrossFit', 'Steam', 'Nutritionist', 'Shower'],
    price: '₹1800/Monthly',
    isOpen: true,
    isVerified: true,
    category: 'Boxing',
    coordinate: { latitude: 30.7265, longitude: 76.765 },
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  {
    id: '4',
    title: 'Prana Yoga & Wellness Studio',
    rating: '4.9/5',
    amenities: ['Meditation', 'Mat Provided', 'AC', 'Herbal Tea', 'Locker'],
    price: '₹1100/Monthly',
    isOpen: true,
    isVerified: true,
    category: 'Yoga',
    coordinate: { latitude: 30.7412, longitude: 76.7725 },
    images: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  {
    id: '5',
    title: 'Powerhouse Gym & Spa',
    rating: '4.6/5',
    amenities: ['AC', 'Wi-Fi', 'Swimming Pool', 'Sauna', 'Parking'],
    price: '₹1600/Monthly',
    isOpen: false,
    isVerified: true,
    category: 'Gyms',
    coordinate: { latitude: 30.6970, longitude: 76.7260 },
    images: [
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  {
    id: '6',
    title: 'Ozone Fitness Club',
    rating: '4.6/5',
    amenities: ['AC', 'Wi-Fi', 'Spinning', 'Shower', 'Parking'],
    price: '₹1400/Monthly',
    isOpen: true,
    isVerified: true,
    category: 'Gyms',
    coordinate: { latitude: 30.6720, longitude: 76.7350 },
    images: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop',
    ],
  },
];

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
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop',
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
    title,
    rating,
    amenities,
    price,
    isOpen,
    isVerified,
    category,
    categories: rawCategories,
    services,
    images,
    coordinate: {
      latitude: Number(data.latitude || data.lat || 30.7333),
      longitude: Number(data.longitude || data.lng || 76.7794),
    },
    city: data.city || data.location?.city || '',
    address: data.address || data.location?.address || data.clubAddress || '',
    description: data.description || data.about || data.bio || '',
    holidays: Array.isArray(data.holidays) ? data.holidays : [],
  };
};
// ─── ViewAllScreen Component ──────────────────────────────────────────────


export default function ViewAllScreen() {
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
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'all'>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const [city, setCity] = useState<string>('');
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [refreshing, setRefreshing] = useState(false);

  // Auto-detect user GPS location to search gyms nearby
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getLastKnownPositionAsync();
          if (loc && isMounted) {
            setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }
          const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (fresh && isMounted) {
            setCoords({ latitude: fresh.coords.latitude, longitude: fresh.coords.longitude });
            const [geo] = await Location.reverseGeocodeAsync({
              latitude: fresh.coords.latitude,
              longitude: fresh.coords.longitude,
            });
            if (geo?.city && isMounted) setCity(geo.city);
          }
        }
      } catch (e) {
        // Location fallback
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
    refetch,
  } = useNearbyGyms({
    city: city || undefined,
    latitude: coords.latitude,
    longitude: coords.longitude,
    query: searchQuery.trim() || undefined,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    if (nearbyData) {
      console.log('📋 [ViewAllScreen] Nearby Gyms API Response:', JSON.stringify(nearbyData, null, 2));
    }
  }, [nearbyData]);

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

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter and sort gyms (matching category cards appear first!)
  const filteredGyms = useMemo(() => {
    const list = rawGyms.filter((gym) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        gym.title.toLowerCase().includes(q) ||
        gym.category?.toLowerCase().includes(q) ||
        gym.amenities.some((a) => a.toLowerCase().includes(q)) ||
        gym.services?.some((s) => s.toLowerCase().includes(q));
      const matchesOpen = !onlyOpen || gym.isOpen;
      return matchesSearch && matchesOpen;
    });

    const sortFn = (a: GymItem, b: GymItem) => {
      if (sortBy === 'rating') {
        return parseFloat(b.rating) - parseFloat(a.rating);
      }
      if (sortBy === 'price') {
        const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10) || 0;
        const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10) || 0;
        return priceA - priceB;
      }
      return 0;
    };

    if (!selectedCategory || selectedCategory === 'All') {
      return [...list].sort(sortFn);
    }

    // Matching category cards appear FIRST!
    const matching = list.filter((g) => gymMatchesCategory(g, selectedCategory)).sort(sortFn);
    const others = list.filter((g) => !gymMatchesCategory(g, selectedCategory)).sort(sortFn);

    return [...matching, ...others];
  }, [rawGyms, selectedCategory, searchQuery, onlyOpen, sortBy]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7F8" />
      {/* 1. Header Bar with Back Button & Search */}
      <View className="flex-row items-center px-4 pb-2 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center rounded-full border border-[#E5E7EB] bg-white pl-4 pr-1.5 py-1 shadow-sm">
          <TextInput
            placeholder="Search gyms, yoga...."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="font-regular flex-1 py-1.5 pr-2 text-sm text-darkText"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="mr-1 p-1">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-full bg-[#E23744]">
            <Feather name="search" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Category Horizontal Scroll */}
      <View className="my-2.5">
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

      {/* 3. Section Header: Title & Filter Button */}
      <View className="mb-3 flex-row items-center justify-between px-4">
        <Text className="font-bold text-xl text-darkText">Nearby gyms</Text>
        <TouchableOpacity
          onPress={() => setIsFilterModalVisible(true)}
          className={`flex-row items-center rounded-full border px-4 py-1.5 shadow-sm ${sortBy !== 'all' || onlyOpen ? 'border-[#E23744] bg-[#FFEAEF]' : 'border-[#E5E7EB] bg-white'
            }`}>
          <Ionicons name="options-outline" size={16} color="#E23744" />
          <Text className="ml-1.5 font-semibold text-sm text-darkText">Filter</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Content: Gym List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E23744']}
            tintColor="#E23744"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 110,
        }}>
        {(isLoading || (isPending && !nearbyData)) ? (
          <View>
            <GymCardSkeleton />
            <GymCardSkeleton />
            <GymCardSkeleton />
          </View>
        ) : filteredGyms.length === 0 ? (
          <View className="my-6 items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <Image
              source={require('@/assets/images/empty-gyms.png')}
              style={{ width: 180, height: 180, borderRadius: 24 }}
              resizeMode="contain"
            />
            <Text className="mt-3 text-center font-bold text-lg text-darkText">
              No Gyms Found Nearby
            </Text>
            <Text className="mt-1 px-4 text-center font-regular text-xs text-secondaryText leading-5">
              No fitness clubs found matching your selected category or filters. Try resetting filters or choosing another city.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('Gyms');
                setSortBy('all');
                setOnlyOpen(false);
              }}
              activeOpacity={0.85}
              className="mt-5 rounded-full bg-[#E23744] px-6 py-2.5 shadow-sm">
              <Text className="font-semibold text-xs text-white">Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredGyms.map((gym) => {
            const isTopMatch =
              selectedCategory !== 'All' && gymMatchesCategory(gym, selectedCategory);
            return (
              <GymCard
                key={gym.id}
                gym={gym}
                isTopMatch={isTopMatch}
                selectedCategory={selectedCategory}
                isFav={!!favorites[gym.id]}
                onToggleFavorite={() => toggleFavorite(gym.id)}
              />
            );
          })
        )}
      </ScrollView>

      {/* 5. Floating "Map View" Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/gym/Mapviewscreen' as any)}
        className="absolute bottom-6 self-center z-30 flex-row items-center rounded-full bg-[#E23744] px-6 py-3 shadow-lg"
        style={{
          shadowColor: '#E23744',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
        }}>
        {/* Custom Map with Pin SVG */}
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Polygon
            points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="8" y1="2" x2="8" y2="18" stroke="#FFFFFF" strokeWidth="2" />
          <Line x1="16" y1="6" x2="16" y2="22" stroke="#FFFFFF" strokeWidth="2" />
          <Circle cx="12" cy="11" r="2" fill="#FFFFFF" />
        </Svg>
        <Text className="ml-2 font-bold text-base text-white">Map View</Text>
      </TouchableOpacity>

      {/* 6. Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5">
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
