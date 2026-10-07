import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useToggleFavorite } from '@/hook/useClient';

export interface HolidayItem {
  id?: number | string;
  documentId?: string;
  title?: string;
  closureType?: 'full_day' | 'partial_day' | string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endtime?: string;
  endTime?: string;
}

export interface GymItem {
  id: string;
  documentId?: string;
  title: string;
  rating: string;
  amenities: string[];
  price: string;
  isOpen: boolean;
  isVerified: boolean;
  images: string[];
  category?: string;
  categories?: string[];
  services?: string[];
  city?: string;
  address?: string;
  distance?: string;
  coordinate?: { latitude: number; longitude: number };
  description?: string;
  holidays?: HolidayItem[];
}

export interface HolidayInfo {
  hasHoliday: boolean;
  isToday: boolean;
  isPartial: boolean;
  title: string;
  badgeLabel: string;
  noticeLabel: string;
  timing?: string;
  dateStr?: string;
}

// ─── Holiday Calculation Helper ─────────────────────────────────────────────
export const getHolidayInfo = (holidays?: HolidayItem[]): HolidayInfo | null => {
  if (!Array.isArray(holidays) || holidays.length === 0) return null;

  const now = new Date();
  const currentYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Check if today is a holiday
  const todayHoliday = holidays.find((h) => {
    if (!h.startDate) return false;
    const start = h.startDate.split('T')[0];
    const end = (h.endDate || h.startDate).split('T')[0];
    return currentYMD >= start && currentYMD <= end;
  });

  if (todayHoliday) {
    const isPartial = todayHoliday.closureType === 'partial_day';
    const title = todayHoliday.title || (isPartial ? 'Maintenance' : 'Closed');
    const startT = (todayHoliday.startTime || '').slice(0, 5);
    const endT = (todayHoliday.endtime || todayHoliday.endTime || '').slice(0, 5);
    const timing = startT && endT ? `${startT} - ${endT}` : startT || '';

    return {
      hasHoliday: true,
      isToday: true,
      isPartial,
      title,
      badgeLabel: isPartial
        ? `Partial Off${timing ? ` (${timing})` : ''}`
        : `Closed Today`,
      noticeLabel: isPartial
        ? `Partial Closure Today: ${title} (${timing})`
        : `Closed Today: ${title}`,
      timing,
      dateStr: todayHoliday.startDate,
    };
  }

  // 2. Scheduled/Upcoming holiday
  const nextHoliday = holidays[0];
  if (nextHoliday) {
    const isPartial = nextHoliday.closureType === 'partial_day';
    const title = nextHoliday.title || (isPartial ? 'Maintenance' : 'Holiday');
    const startT = (nextHoliday.startTime || '').slice(0, 5);
    const endT = (nextHoliday.endtime || nextHoliday.endTime || '').slice(0, 5);
    const timing = startT && endT ? `${startT} - ${endT}` : '';

    let dateFmt = nextHoliday.startDate || '';
    try {
      if (nextHoliday.startDate) {
        const d = new Date(nextHoliday.startDate);
        if (!isNaN(d.getTime())) {
          dateFmt = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
      }
    } catch (_) { }

    return {
      hasHoliday: true,
      isToday: false,
      isPartial,
      title,
      badgeLabel: `Off ${dateFmt}: ${title}`,
      noticeLabel: `Upcoming Holiday on ${dateFmt}: ${title}${timing ? ` (${timing})` : ''}`,
      timing,
      dateStr: nextHoliday.startDate,
    };
  }

  return null;
};

// ─── Feature Icons & Matching ───────────────────────────────────────────────
export const getFeatureIcon = (name: string): keyof typeof Ionicons.glyphMap => {
  const n = name.toLowerCase();
  if (n.includes('gym') || n.includes('fitness')) return 'barbell-outline';
  if (n.includes('ac') || n.includes('air') || n.includes('cool')) return 'snow-outline';
  if (n.includes('wifi') || n.includes('wi-fi') || n.includes('internet')) return 'wifi-outline';
  if (n.includes('park')) return 'car-outline';
  if (n.includes('train') || n.includes('coach') || n.includes('weight')) return 'barbell-outline';
  if (n.includes('shower') || n.includes('bath')) return 'water-outline';
  if (n.includes('yoga') || n.includes('meditat')) return 'body-outline';
  if (n.includes('box') || n.includes('punch')) return 'flame-outline';
  if (n.includes('dance') || n.includes('zumba')) return 'musical-notes-outline';
  if (n.includes('pool') || n.includes('swim')) return 'water-outline';
  if (n.includes('sauna') || n.includes('steam')) return 'thermometer-outline';
  if (n.includes('lock')) return 'lock-closed-outline';
  if (n.includes('crossfit') || n.includes('turf')) return 'trophy-outline';
  if (n.includes('pilates')) return 'leaf-outline';
  return 'checkmark-circle-outline';
};

export const getDisplayFeatures = (gym: GymItem, selectedCategory?: string): string[] => {
  const rawList: string[] = [];

  const formatName = (cat: string) => {
    if (!cat) return '';
    const clean = cat.trim();
    if (clean.toLowerCase() === 'gyms') return 'Gym';
    return clean;
  };

  // 1. If a category filter is active (not 'All'), place the matching category/service at index 0
  if (selectedCategory && selectedCategory !== 'All') {
    const target = selectedCategory.toLowerCase();
    let matchedItem: string | null = null;

    if (target === 'gyms' || target === 'gym') {
      matchedItem = 'Gym';
    } else {
      const foundInCat = [gym.category, ...(gym.categories || [])].find(
        (c) => c && c.toLowerCase().includes(target)
      );
      const foundInServices = (gym.services || []).find((s) => s.toLowerCase().includes(target));
      const foundInAmenities = (gym.amenities || []).find((a) => a.toLowerCase().includes(target));

      matchedItem = formatName(foundInCat || foundInServices || foundInAmenities || selectedCategory);
    }

    if (matchedItem) {
      rawList.push(matchedItem);
    }
  } else {
    // When 'All' or no filter, prioritize the gym's main category
    if (gym.category) {
      rawList.push(formatName(gym.category));
    }
  }

  // 2. Add services
  if (Array.isArray(gym.services)) {
    gym.services.forEach((s) => {
      const formatted = formatName(s);
      if (formatted) rawList.push(formatted);
    });
  }

  // 3. Add category & categories if not added
  if (gym.category) {
    rawList.push(formatName(gym.category));
  }
  if (Array.isArray(gym.categories)) {
    gym.categories.forEach((c) => {
      const formatted = formatName(c);
      if (formatted) rawList.push(formatted);
    });
  }

  // 4. Add amenities
  if (Array.isArray(gym.amenities)) {
    gym.amenities.forEach((a) => {
      if (a && a.trim()) rawList.push(a.trim());
    });
  }

  // Deduplicate case-insensitively while preserving insertion order
  const seen = new Set<string>();
  const uniqueFeatures: string[] = [];

  for (const item of rawList) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueFeatures.push(item);
    }
  }

  // Return at most 5 items
  return uniqueFeatures.slice(0, 5);
};

export const gymMatchesCategory = (gym: GymItem, categoryId: string): boolean => {
  if (!categoryId || categoryId === 'All') return true;

  const catLower = categoryId.toLowerCase();

  const testList = (list?: string[], matcher?: (s: string) => boolean): boolean => {
    if (!list || !list.length) return false;
    return list.some((item) =>
      matcher ? matcher(item.toLowerCase()) : item.toLowerCase().includes(catLower)
    );
  };

  const titleLower = (gym.title || '').toLowerCase();
  const descLower = (gym.description || '').toLowerCase();
  const catDisplayLower = (gym.category || '').toLowerCase();

  switch (catLower) {
    case 'all':
      return true;

    case 'gyms':
    case 'gym':
      if (catDisplayLower.includes('gym') || catDisplayLower.includes('fitness')) return true;
      if (titleLower.includes('gym') || titleLower.includes('fitness') || titleLower.includes('club')) return true;
      if (
        testList(gym.services, (s) =>
          s.includes('gym') || s.includes('fitness') || s.includes('strength') || s.includes('weights') || s.includes('workout')
        )
      ) return true;
      if (
        testList(gym.amenities, (a) =>
          a.includes('gym') || a.includes('trainers') || a.includes('weights') || a.includes('cardio')
        )
      ) return true;
      const isExclusivelyOther = ['yoga', 'boxing', 'dance', 'pilates', 'zumba'].some(
        (other) => catDisplayLower.includes(other) && !catDisplayLower.includes('gym')
      );
      return !isExclusivelyOther;

    case 'yoga':
      return (
        catDisplayLower.includes('yoga') ||
        titleLower.includes('yoga') ||
        descLower.includes('yoga') ||
        testList(gym.services, (s) => s.includes('yoga') || s.includes('meditation') || s.includes('asana')) ||
        testList(gym.amenities, (a) => a.includes('yoga') || a.includes('meditation'))
      );

    case 'boxing':
      return (
        catDisplayLower.includes('box') ||
        titleLower.includes('box') ||
        descLower.includes('box') ||
        testList(gym.services, (s) => s.includes('box') || s.includes('kickbox') || s.includes('mma') || s.includes('combat')) ||
        testList(gym.amenities, (a) => a.includes('box') || a.includes('ring') || a.includes('punch'))
      );

    case 'dance':
      return (
        catDisplayLower.includes('dance') ||
        titleLower.includes('dance') ||
        descLower.includes('dance') ||
        testList(gym.services, (s) => s.includes('dance') || s.includes('dancing') || s.includes('aerobic') || s.includes('salsa')) ||
        testList(gym.amenities, (a) => a.includes('dance') || a.includes('studio') || a.includes('aerobics'))
      );

    case 'crossfit':
      return (
        catDisplayLower.includes('crossfit') ||
        catDisplayLower.includes('cross fit') ||
        titleLower.includes('crossfit') ||
        titleLower.includes('cross fit') ||
        descLower.includes('crossfit') ||
        testList(gym.services, (s) => s.includes('crossfit') || s.includes('cross fit') || s.includes('functional') || s.includes('hiit') || s.includes('turf')) ||
        testList(gym.amenities, (a) => a.includes('crossfit') || a.includes('turf') || a.includes('functional'))
      );

    case 'zumba':
      return (
        catDisplayLower.includes('zumba') ||
        titleLower.includes('zumba') ||
        descLower.includes('zumba') ||
        testList(gym.services, (s) => s.includes('zumba')) ||
        testList(gym.amenities, (a) => a.includes('zumba'))
      );

    case 'pilates':
      return (
        catDisplayLower.includes('pilates') ||
        titleLower.includes('pilates') ||
        descLower.includes('pilates') ||
        testList(gym.services, (s) => s.includes('pilates') || s.includes('reformer') || s.includes('core')) ||
        testList(gym.amenities, (a) => a.includes('pilates') || a.includes('reformer'))
      );

    default:
      return (
        catDisplayLower.includes(catLower) ||
        titleLower.includes(catLower) ||
        testList(gym.services, (s) => s.includes(catLower)) ||
        testList(gym.amenities, (a) => a.includes(catLower))
      );
  }
};

// ─── Data Extraction & Gym Mapping Helper ────────────────────────────────────
export const extractStringList = (val: any): string[] => {
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

export const mapClubOwnerToGym = (item: any): GymItem => {
  if (!item) {
    return {
      id: Math.random().toString(),
      title: 'Fitness Club',
      rating: '4.5/5',
      amenities: [],
      price: '₹1200/Monthly',
      isOpen: true,
      isVerified: false,
      images: [],
    };
  }

  // Handle nested club relations (e.g. { club: ... } or { clubOwner: ... })
  const clubData = item.club || item.clubOwner || item.gym || item;
  const data = clubData?.attributes ? { id: clubData.id, ...clubData.attributes } : clubData;

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
  } else if (typeof data.logo === 'string' && data.logo.startsWith('http')) {
    images = [data.logo];
  }

  if (!images.length) {
    images = fallbackImages;
  }

  const docId = data.documentId || (typeof data.id === 'string' ? data.id : undefined);

  return {
    id: String(data.documentId || data._id || data.id || Math.random().toString()),
    documentId: docId ? String(docId) : undefined,
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

// ─── Shimmer & Skeleton ─────────────────────────────────────────────────────
function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });
}

function SkeletonBox({ style }: { style?: object }) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[{ backgroundColor: '#E5E7EB', borderRadius: 10, opacity }, style]}
    />
  );
}

export function GymCardSkeleton() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32;
  return (
    <View
      style={{
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}>
      <SkeletonBox style={{ width: cardWidth, height: 240, borderRadius: 0 }} />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox style={{ height: 18, width: '60%' }} />
          <SkeletonBox style={{ height: 14, width: 40, borderRadius: 6 }} />
        </View>
        <SkeletonBox style={{ height: 12, width: '45%', marginTop: 10 }} />
        <SkeletonBox style={{ height: 12, width: '80%', marginTop: 8 }} />
        <SkeletonBox style={{ height: 16, width: '35%', marginTop: 10 }} />
      </View>
    </View>
  );
}

// ─── Main GymCard Component ─────────────────────────────────────────────────
export interface GymCardProps {
  gym: GymItem;
  isFav?: boolean;
  isTopMatch?: boolean;
  selectedCategory?: string;
  onToggleFavorite?: () => void;
}

export default function GymCard({
  gym,
  isFav = false,
  isTopMatch,
  selectedCategory,
  onToggleFavorite,
}: GymCardProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(0);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32;

  const { toggleFavorite, isPending: isTogglingFav } = useToggleFavorite();
  const [localFav, setLocalFav] = useState<boolean>(Boolean(isFav));

  useEffect(() => {
    setLocalFav(Boolean(isFav));
  }, [isFav]);

  const handleToggleFavorite = async () => {
    const clubDocumentId = gym.documentId || gym.id;
    const nextState = !localFav;
    setLocalFav(nextState);

    if (onToggleFavorite) {
      onToggleFavorite();
    }

    if (clubDocumentId) {
      try {
        await toggleFavorite(clubDocumentId, localFav);
      } catch (e) {
        // Revert on error
        setLocalFav(localFav);
      }
    }
  };

  const displayFeatures = useMemo(() => {
    return getDisplayFeatures(gym, selectedCategory);
  }, [gym, selectedCategory]);

  const holidayInfo = useMemo(() => {
    return getHolidayInfo(gym.holidays);
  }, [gym.holidays]);

  // Infinite forward loop: append first image at the end
  const slides =
    gym.images && gym.images.length > 1 ? [...gym.images, gym.images[0]] : gym.images || [];

  useEffect(() => {
    if (!cardWidth || !gym.images || gym.images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * cardWidth,
        animated: true,
      });

      if (nextIndex >= gym.images.length) {
        // Forward scroll to clone completes, reset dot to 0 and silently return to origin
        setActiveIndex(0);
        currentIndexRef.current = 0;
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            x: 0,
            animated: false,
          });
        }, 450);
      } else {
        currentIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [cardWidth, gym.images?.length]);

  const handleMomentScrollEnd = (e: any) => {
    const scrollX = e.nativeEvent.contentOffset.x;
    let newIndex = Math.round(scrollX / cardWidth);
    if (gym.images && newIndex >= gym.images.length) {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      newIndex = 0;
    }
    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);
  };

  const handleOpenDetail = () => {
    try {
      router.push({
        pathname: '/gym/gym-detail' as any,
        params: { id: gym.id },
      });
    } catch (e) {
      console.log('Navigation push error:', e);
    }
  };

  return (
    <View className="mb-5 overflow-hidden rounded-3xl border border-[#F3F4F6] bg-white shadow-sm">
      {/* Image Carousel & Badges */}
      <View className="relative h-60 w-full bg-gray-200">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentScrollEnd}
          scrollEventThrottle={16}>
          {slides.map((imgUrl, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.95}
              onPress={handleOpenDetail}>
              <Image
                source={{ uri: imgUrl }}
                style={{ width: cardWidth, height: 240 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top Left: Heart Favorite Button */}
        <TouchableOpacity
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
          disabled={isTogglingFav}
          className="absolute left-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-black/30">
          <Ionicons
            name={localFav ? 'heart' : 'heart-outline'}
            size={18}
            color={localFav ? '#E23744' : '#FFF'}
          />
        </TouchableOpacity>

        {/* Top Right: Verified Badge */}
        {gym.isVerified && (
          <View className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full bg-[#E23744] shadow-sm">
            <Svg width={14} height={14} viewBox="0 0 13 13" fill="none">
              <Path
                d="M12.8333 6.10167L11.41 4.48L11.6083 2.33333L9.5025 1.855L8.4 0L6.41667 0.851667L4.43333 0L3.33083 1.855L1.225 2.3275L1.42333 4.47417L0 6.10167L1.42333 7.72333L1.225 9.87583L3.33083 10.3542L4.43333 12.2092L6.41667 11.3517L8.4 12.2033L9.5025 10.3483L11.6083 9.87L11.41 7.72333L12.8333 6.10167ZM5.25 9.01833L2.91667 6.685L3.73917 5.8625L5.25 7.3675L9.09417 3.52333L9.91667 4.35167L5.25 9.01833Z"
                fill="#FFFFFF"
              />
            </Svg>
          </View>
        )}

        {/* Bottom Left: Holiday Badge / Open Now Badge, Category & Top Match Badge */}
        <View className="absolute bottom-3 left-3 z-10 flex-row flex-wrap items-center space-x-1.5">
          {holidayInfo ? (
            <View
              className={`flex-row items-center rounded-full px-2.5 py-1 shadow-sm ${holidayInfo.isToday && !holidayInfo.isPartial
                  ? 'bg-red-600'
                  : holidayInfo.isToday && holidayInfo.isPartial
                    ? 'bg-amber-600'
                    : 'bg-orange-600'
                }`}>
              <Ionicons
                name={holidayInfo.isToday ? 'alert-circle' : 'calendar'}
                size={12}
                color="#FFF"
                style={{ marginRight: 4 }}
              />
              <Text className="font-bold text-[11px] text-white">
                {holidayInfo.badgeLabel}
              </Text>
            </View>
          ) : gym.isOpen ? (
            <View className="rounded-full bg-white px-2.5 py-1 shadow-sm">
              <Text className="font-semibold text-xs text-[#E23744]">Open now</Text>
            </View>
          ) : (
            <View className="rounded-full bg-black/60 px-2.5 py-1 shadow-sm">
              <Text className="font-medium text-xs text-white">Closed</Text>
            </View>
          )}
        </View>

        {/* Bottom Right: Dynamic Carousel Pagination Dots */}
        {gym.images && gym.images.length > 1 && (
          <View className="absolute bottom-3 right-3 z-10 flex-row items-center">
            {gym.images.map((_, idx) => (
              <View
                key={idx}
                style={{ marginRight: idx === gym.images.length - 1 ? 0 : 6 }}
                className={`h-1.5 rounded-full ${idx === activeIndex ? 'w-5 bg-[#E23744]' : 'w-1.5 bg-white/70'}`}
              />
            ))}
          </View>
        )}
      </View>

      {/* Card Details */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenDetail}
        className="p-4">
        {/* Title & Rating */}
        <View className="flex-row items-center justify-between">
          <Text className="mr-2 flex-1 font-bold text-lg text-darkText" numberOfLines={1}>
            {gym.title}
          </Text>
          <View className="flex-row items-center space-x-1">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text className="ml-1 font-medium text-xs text-secondaryText">{gym.rating}</Text>
          </View>
        </View>

        {/* Location & Distance */}
        {Boolean(gym.distance) && (
          <View className="mt-1 flex-row items-center">
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text className="ml-1 flex-1 font-regular text-xs text-secondaryText" numberOfLines={1}>
             {gym.distance ? `${gym.distance} away` : ''}
            </Text>
          </View>
        )}

        {/* Holiday Notice Pill Banner */}
        {holidayInfo && (
          <View
            className={`mt-2 flex-row items-center rounded-xl px-2.5 py-1.5 ${holidayInfo.isToday && !holidayInfo.isPartial
                ? 'border border-red-200 bg-red-50'
                : 'border border-amber-200 bg-amber-50'
              }`}>
            <Ionicons
              name={holidayInfo.isToday ? 'information-circle' : 'calendar-outline'}
              size={14}
              color={holidayInfo.isToday && !holidayInfo.isPartial ? '#DC2626' : '#D97706'}
              style={{ marginRight: 5 }}
            />
            <Text
              className={`flex-1 font-medium text-xs ${holidayInfo.isToday && !holidayInfo.isPartial ? 'text-red-700' : 'text-amber-800'
                }`}
              numberOfLines={1}>
              {holidayInfo.noticeLabel}
            </Text>
          </View>
        )}

        {/* Key Features (Max 5, Active filter shown 1st) */}
        {displayFeatures.length > 0 && (
          <View className="mt-2.5">
            <View className="flex-row flex-wrap gap-1.5">
              {displayFeatures.map((item, idx) => {
                const isFilterActive = Boolean(selectedCategory && selectedCategory !== 'All');
                const isMatchedFilterChip = isFilterActive && idx === 0;

                return (
                  <View
                    key={`${item}-${idx}`}
                    className={`flex-row items-center rounded-lg px-2 py-1 ${isMatchedFilterChip
                      ? 'border border-[#E23744]/40 bg-[#FFEAEF]'
                      : 'border border-slate-100 bg-slate-50'
                      }`}>
                    <Ionicons
                      name={getFeatureIcon(item)}
                      size={12}
                      color="#E23744"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      className={`font-medium text-[11px] ${isMatchedFilterChip ? 'font-bold text-[#E23744]' : 'text-slate-700'
                        }`}>
                      {item}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Pricing */}
        <Text className="mt-2.5 font-bold text-base text-darkText">{gym.price}</Text>
      </TouchableOpacity>
    </View>
  );
}
