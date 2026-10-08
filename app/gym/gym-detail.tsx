import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
  Linking,
  Share,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import GymDetailMapView from '@/components/modules/GymDetailMapView';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGymDetail,
  useToggleFavorite,
  useGetFavorites,
  extractFavoriteIds,
} from '@/hook/useClient';

export interface GymPhotoItem {
  url: string;
  imageInfo?: string;
}

export interface GymBranchItem {
  id: string;
  name: string;
  address?: string;
  coordinate: { latitude: number; longitude: number };
  isMain?: boolean;
}

export interface RatingBreakdownItem {
  star: number;
  pct: string;
}

export interface ExerciseZoneItem {
  title: string;
  image: string;
}

export interface AmenityItem {
  name: string;
  icon: string;
  library: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  time: string;
  comment: string;
}

// Kept for backward compatibility with external imports (empty record - no dummy data)
export const GYM_DETAILS: Record<string, any> = {};

// Format weekly scheduling into readable string (e.g., "Mon - Sun: 06:00 AM - 10:00 PM")
function formatWeekdayScheduling(scheduling: any): string {
  if (!scheduling || typeof scheduling !== 'object') return '';

  const formatTime = (t?: string) => {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length < 2) return t;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hStr = h < 10 ? `0${h}` : `${h}`;
    return `${hStr}:${m} ${ampm}`;
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  const daySchedules = days
    .map((day) => {
      const s = scheduling[day];
      if (!s || (!s.openingTime && !s.closingTime)) return null;
      return {
        day,
        label: dayLabels[day],
        time: `${formatTime(s.openingTime)} - ${formatTime(s.closingTime)}`,
      };
    })
    .filter(Boolean) as { day: string; label: string; time: string }[];

  if (daySchedules.length === 0) return '';

  // Check if all 7 days have identical timing
  const firstTime = daySchedules[0].time;
  const allSame = daySchedules.length === 7 && daySchedules.every((d) => d.time === firstTime);
  if (allSame) {
    return `Mon - Sun: ${firstTime}`;
  }

  // Check if weekdays and weekends differ
  const weekdays = daySchedules.filter((d) =>
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d.day)
  );
  const weekends = daySchedules.filter((d) => ['saturday', 'sunday'].includes(d.day));

  const weekdaysSame = weekdays.length > 0 && weekdays.every((d) => d.time === weekdays[0].time);
  const weekendsSame = weekends.length > 0 && weekends.every((d) => d.time === weekends[0].time);

  if (weekdaysSame && weekendsSame && weekdays[0].time !== weekends[0].time) {
    return `Mon - Fri: ${weekdays[0].time} | Sat - Sun: ${weekends[0].time}`;
  }

  return `${daySchedules[0].label} - ${daySchedules[daySchedules.length - 1].label}: ${daySchedules[0].time}`;
}

// ─── Skeleton for gym detail ─────────────────────────────────────────────────
function GymDetailSkeletonBox({ style }: { style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  return (
    <Animated.View
      style={[{ backgroundColor: '#E2E8F0', borderRadius: 8, opacity }, style]}
    />
  );
}

function GymDetailSkeletonScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Top Header Placeholder */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          }}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-back" size={22} color="#475569" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#F1F5F9',
              }}
            />
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#F1F5F9',
              }}
            />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Hero Banner Skeleton */}
          <View style={{ width: '100%', height: 280, backgroundColor: '#F8FAFC', position: 'relative' }}>
            <GymDetailSkeletonBox style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            {/* Carousel indicator dots */}
            <View
              style={{
                position: 'absolute',
                bottom: 14,
                alignSelf: 'center',
                flexDirection: 'row',
                gap: 6,
              }}>
              <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
            </View>
          </View>

          {/* Main Content Details */}
          <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
            {/* Title & Badge */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <GymDetailSkeletonBox style={{ height: 26, width: '68%', borderRadius: 6 }} />
              <GymDetailSkeletonBox style={{ height: 24, width: 65, borderRadius: 12 }} />
            </View>

            {/* Rating & Review Count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <GymDetailSkeletonBox style={{ height: 18, width: 65, borderRadius: 4 }} />
              <GymDetailSkeletonBox style={{ height: 18, width: 95, borderRadius: 4 }} />
            </View>

            {/* Timings row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <GymDetailSkeletonBox style={{ height: 16, width: 16, borderRadius: 8 }} />
              <GymDetailSkeletonBox style={{ height: 14, width: '55%', borderRadius: 4 }} />
            </View>

            {/* Address row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <GymDetailSkeletonBox style={{ height: 16, width: 16, borderRadius: 8 }} />
              <GymDetailSkeletonBox style={{ height: 14, width: '75%', borderRadius: 4 }} />
            </View>

            {/* Action buttons row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              {[1, 2, 3].map((_, i) => (
                <GymDetailSkeletonBox key={i} style={{ flex: 1, height: 42, borderRadius: 12 }} />
              ))}
            </View>

            {/* Amenities Section */}
            <GymDetailSkeletonBox style={{ height: 20, width: 110, borderRadius: 4, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {[80, 95, 75, 110, 85].map((w, i) => (
                <GymDetailSkeletonBox key={i} style={{ height: 34, width: w, borderRadius: 17 }} />
              ))}
            </View>

            {/* About / Description */}
            <GymDetailSkeletonBox style={{ height: 20, width: 90, borderRadius: 4, marginBottom: 12 }} />
            <GymDetailSkeletonBox style={{ height: 14, width: '100%', borderRadius: 4, marginBottom: 8 }} />
            <GymDetailSkeletonBox style={{ height: 14, width: '92%', borderRadius: 4, marginBottom: 8 }} />
            <GymDetailSkeletonBox style={{ height: 14, width: '70%', borderRadius: 4, marginBottom: 24 }} />

            {/* Location Map Preview Skeleton */}
            <GymDetailSkeletonBox style={{ height: 20, width: 110, borderRadius: 4, marginBottom: 12 }} />
            <GymDetailSkeletonBox style={{ height: 150, width: '100%', borderRadius: 18, marginBottom: 24 }} />
          </View>
        </ScrollView>

        {/* Bottom Bar Skeleton */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 76,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
          }}>
          <View>
            <GymDetailSkeletonBox style={{ height: 12, width: 50, borderRadius: 4, marginBottom: 6 }} />
            <GymDetailSkeletonBox style={{ height: 22, width: 95, borderRadius: 4 }} />
          </View>
          <GymDetailSkeletonBox style={{ height: 48, width: 160, borderRadius: 24 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function GymDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const gymId = params.id || '';

  const queryClient = useQueryClient();
  const { toggleFavorite, isPending: isTogglingFav } = useToggleFavorite();
  const { data: favoritesData } = useGetFavorites();
  const favoriteIds = useMemo(() => extractFavoriteIds(favoritesData), [favoritesData]);

  // ── Live API data ──────────────────────────────────────────────────────────
  const { data: apiData, isLoading: isDetailLoading, isPending } = useGymDetail(gymId || undefined);
  const isGymLoading = (isDetailLoading || isPending) && !apiData;

  useEffect(() => {
    if (apiData) {
      console.log('📋 [GymDetail Screen] Received apiData for gymId:', gymId);
      console.log('📦 [GymDetail Screen Data]:', JSON.stringify(apiData, null, 2));
    }
  }, [apiData, gymId]);

  // Map backend response to the shape this screen expects (NO DUMMY DATA)
  const gym = useMemo(() => {
    const raw = apiData?.data ?? apiData;
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const d = raw?.attributes ? { id: raw.id, ...raw.attributes } : raw;

    // Real photos extracted from backend response
    const rawPhotos =
      d.club_photos ||
      d.clubPhotos ||
      d.photos ||
      d.images ||
      d.gallery ||
      [];
    const photos: GymPhotoItem[] = Array.isArray(rawPhotos)
      ? (rawPhotos
          .map((p: any) => {
            const url =
              p?.url ||
              p?.formats?.large?.url ||
              p?.formats?.medium?.url ||
              p?.formats?.small?.url ||
              (typeof p === 'string' ? p : null);
            if (!url) return null;
            const fullUrl = url.startsWith('http') ? url : `${process.env.EXPO_PUBLIC_API_URL}${url}`;
            return {
              url: fullUrl,
              imageInfo: p?.imageInfo || p?.title || p?.caption || undefined,
            };
          })
          .filter(Boolean) as GymPhotoItem[])
      : [];

    const images: string[] = photos.map((p) => p.url);

    // Real gym logo
    const rawLogo = d.logo || d.clubLogo || d.thumbnail || d.thumbnail_photo || '';
    const logo: string =
      typeof rawLogo === 'string'
        ? rawLogo.startsWith('http') || !rawLogo
          ? rawLogo
          : `${process.env.EXPO_PUBLIC_API_URL}${rawLogo}`
        : rawLogo?.url
        ? (rawLogo.url.startsWith('http') ? rawLogo.url : `${process.env.EXPO_PUBLIC_API_URL}${rawLogo.url}`)
        : '';

    const clubId: string = String(d.clubId || d.club_id || '');
    const ownerName: string = String(d.ownerName || d.owner || d.manager || '');
    const clubCategory: string = String(d.clubCategory || d.club_category || '');

    const extractList = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val
          .map((v) => (typeof v === 'string' ? v.trim() : String(v?.name || v?.title || '').trim()))
          .filter(Boolean);
      }
      if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const getAmenityIcon = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes('ac') || n.includes('air')) return 'snow-outline';
      if (n.includes('wifi') || n.includes('wi-fi')) return 'wifi-outline';
      if (n.includes('park')) return 'car-outline';
      if (n.includes('train')) return 'barbell-outline';
      if (n.includes('shower') || n.includes('bath')) return 'water-outline';
      if (n.includes('yoga') || n.includes('meditat')) return 'body-outline';
      if (n.includes('box')) return 'flame-outline';
      if (n.includes('dance') || n.includes('zumba')) return 'musical-notes-outline';
      if (n.includes('pool') || n.includes('swim')) return 'water-outline';
      if (n.includes('sauna') || n.includes('steam')) return 'thermometer-outline';
      if (n.includes('lock')) return 'lock-closed-outline';
      return 'checkmark-circle-outline';
    };

    const rawServices = extractList(d.services || d.service);
    const rawCategories = extractList(d.categories || d.category);
    const rawFacilities = extractList(d.facilities || d.facility);
    const rawAmenitiesList = extractList(d.amenities);

    const title = d.clubName || d.businessName || d.gymName || d.name || d.title || 'Fitness Club';
    const lowerT = title.toLowerCase();

    let category = '';
    if (rawCategories.length > 0) category = rawCategories[0];
    else if (rawServices.length > 0) category = rawServices[0];
    else if (d.clubType || d.club_type) category = d.clubType || d.club_type;
    else if (lowerT.includes('yoga')) category = 'Yoga';
    else if (lowerT.includes('box')) category = 'Boxing';
    else if (lowerT.includes('dance')) category = 'Dance';
    else if (lowerT.includes('crossfit')) category = 'CrossFit';
    else if (lowerT.includes('zumba')) category = 'Zumba';
    else if (lowerT.includes('pilates')) category = 'Pilates';
    else category = 'Gym';

    const combinedAmenityNames = Array.from(
      new Set([...rawAmenitiesList, ...rawFacilities, ...rawServices])
    );

    const amenities: AmenityItem[] = combinedAmenityNames.map((name) => ({
      name,
      icon: getAmenityIcon(name),
      library: 'ionicons',
    }));

    // Real reviews from backend only
    const rawReviews = Array.isArray(d.reviews) ? d.reviews : [];
    const reviews: ReviewItem[] = rawReviews.map((r: any, idx: number) => ({
      id: String(r?.id || r?._id || `r-${idx}`),
      name: r?.name || r?.userName || r?.user?.name || 'Member',
      avatar: r?.avatar || r?.user?.avatar || r?.user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
      rating: Number(r?.rating || 5),
      time: r?.time || (r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently'),
      comment: r?.comment || r?.text || r?.review || '',
    }));

    // Rating value
    let ratingVal = d.rating ?? d.avgRating;
    if (ratingVal === undefined || ratingVal === null) {
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        ratingVal = (sum / reviews.length).toFixed(1);
      } else {
        ratingVal = 0;
      }
    }

    const totalReviews = d.totalReviews || d.reviewCount || reviews.length;

    // Real rating breakdown (only if provided or derived from real reviews)
    let ratingBreakdown: RatingBreakdownItem[] = [];
    if (Array.isArray(d.ratingBreakdown) && d.ratingBreakdown.length > 0) {
      ratingBreakdown = d.ratingBreakdown;
    } else if (reviews.length > 0) {
      const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach((r) => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        counts[star] = (counts[star] || 0) + 1;
      });
      ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
        star,
        pct: `${Math.round(((counts[star] || 0) / reviews.length) * 100)}%`,
      }));
    }

    // Exercise zones from explicit zones or photos with imageInfo
    const exerciseZones: ExerciseZoneItem[] =
      Array.isArray(d.exerciseZones) && d.exerciseZones.length > 0
        ? d.exerciseZones
        : photos
            .filter((p) => Boolean(p.imageInfo))
            .map((p) => ({
              title: p.imageInfo!,
              image: p.url,
            }));

    const coordinate = {
      latitude: Number(d.latitude || d.lat || d.location?.latitude || d.coordinate?.latitude || 30.7046),
      longitude: Number(d.longitude || d.lng || d.location?.longitude || d.coordinate?.longitude || 76.7179),
    };

    const openHours =
      d.openHours ||
      d.workingHours ||
      d.timings ||
      formatWeekdayScheduling(d.weekdayScheduling) ||
      '';

    const holidays = Array.isArray(d.holidays) ? d.holidays : [];

    const clubDocumentId = String(d.documentId || d._id || d.id || gymId);

    // Prefer explicit isFav from details response ("isFav": false / true),
    // fallback to favorites query list if isFav not directly present
    const isFavFromResponse =
      d.isFav !== undefined
        ? Boolean(d.isFav)
        : d.isFavorite !== undefined
          ? Boolean(d.isFavorite)
          : undefined;

    const isFav =
      isFavFromResponse !== undefined
        ? isFavFromResponse
        : favoriteIds.has(clubDocumentId) || favoriteIds.has(String(d.id));

    return {
      id: clubDocumentId,
      documentId: clubDocumentId,
      clubId,
      ownerName,
      logo,
      clubCategory,
      title,
      category,
      services: Array.from(new Set([...rawServices, ...rawCategories, category].filter(Boolean))),
      address: d.address || d.clubAddress || d.location?.address || '',
      coordinate,
      branches: Array.isArray(d.branches) ? d.branches : [],
      rating: typeof ratingVal === 'string' && ratingVal.includes('/') ? ratingVal.split('/')[0] : String(ratingVal),
      totalReviews,
      openHours,
      holidays,
      description: d.description || d.about || d.bio || '',
      amenities,
      exerciseZones,
      ratingBreakdown,
      reviews,
      images,
      photos,
      isFav,
    };
  }, [apiData, gymId, favoriteIds]);
  // ──────────────────────────────────────────────────────────────────────────

  const { width: screenWidth } = useWindowDimensions();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<GymBranchItem | null>(null);
  const mapInteractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const HERO_HEIGHT = 330;

  // Sync isFavorite state whenever gym.isFav changes
  useEffect(() => {
    if (gym?.isFav !== undefined) {
      setIsFavorite(Boolean(gym.isFav));
    }
  }, [gym?.isFav]);

  // Handle Add/Remove Favorite action and update details query cache
  const handleToggleFavorite = async () => {
    if (!gym || isTogglingFav) return;
    const clubDocumentId = gym.documentId || gym.id || gymId;
    if (!clubDocumentId) return;

    const currentFav = isFavorite;
    const nextFav = !currentFav;

    // 1. Optimistic UI state update
    setIsFavorite(nextFav);

    // 2. Optimistic update of gym-detail query cache ("isFav": false / true)
    const updateCache = (favVal: boolean) => {
      const updater = (oldData: any) => {
        if (!oldData) return oldData;
        if (oldData.data && typeof oldData.data === 'object' && !Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              isFav: favVal,
              isFavorite: favVal,
            },
          };
        }
        return {
          ...oldData,
          isFav: favVal,
          isFavorite: favVal,
        };
      };

      if (gymId) queryClient.setQueryData(['gym-detail', gymId], updater);
      if (gym.documentId && gym.documentId !== gymId) {
        queryClient.setQueryData(['gym-detail', gym.documentId], updater);
      }
    };

    updateCache(nextFav);

    // 3. Call backend API to add or remove favorite
    try {
      await toggleFavorite(clubDocumentId, currentFav);
      // Invalidate queries so server state is synchronized
      if (gymId) queryClient.invalidateQueries({ queryKey: ['gym-detail', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gym-detail'] });
      queryClient.invalidateQueries({ queryKey: ['client-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['nearby-gyms'] });
    } catch (err) {
      console.error('Failed to toggle favorite on gym-detail:', err);
      // Revert local state and query cache on error
      setIsFavorite(currentFav);
      updateCache(currentFav);
    }
  };

  useEffect(() => {
    setSelectedBranch(null);
  }, [gymId]);

  // Fetch user GPS location to show on the map and display nearby area gyms
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
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            .then((fresh) => {
              if (fresh && isMounted) {
                setUserLocation({
                  latitude: fresh.coords.latitude,
                  longitude: fresh.coords.longitude,
                });
              }
            })
            .catch(() => {});
        }
      } catch (e) {
        // ignore location error
      }
    })();
    return () => {
      isMounted = false;
      if (mapInteractionTimerRef.current) {
        clearTimeout(mapInteractionTimerRef.current);
      }
    };
  }, []);

  const handleMapTouchStart = () => {
    if (mapInteractionTimerRef.current) {
      clearTimeout(mapInteractionTimerRef.current);
    }
    setIsMapInteracting(true);
  };

  const handleMapTouchEnd = () => {
    if (mapInteractionTimerRef.current) {
      clearTimeout(mapInteractionTimerRef.current);
    }
    setIsMapInteracting(false);
  };

  const handleSelectGym = (selectedId: string) => {
    if (selectedId && selectedId !== gym?.id) {
      router.push({
        pathname: '/gym/gym-detail' as any,
        params: { id: selectedId },
      });
    }
  };

  const slides: GymPhotoItem[] =
    gym?.photos && gym.photos.length > 1
      ? [...gym.photos, gym.photos[0]]
      : gym?.photos || [];

  // Pull-down elastic zoom effect
  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  // Header background fade-in when sheet reaches the top
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 130, HERO_HEIGHT - 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Header title fade-in
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 90, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Auto-scroll hero carousel
  useEffect(() => {
    if (!screenWidth || !gym?.photos || gym.photos.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;
      scrollRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });

      if (nextIndex >= gym.photos.length) {
        setActiveImageIndex(0);
        currentIndexRef.current = 0;
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: 0, animated: false });
        }, 450);
      } else {
        currentIndexRef.current = nextIndex;
        setActiveImageIndex(nextIndex);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [screenWidth, gym?.photos]);

  // Review Carousel State & Infinite Circular Auto-Scroll
  const reviewScrollRef = useRef<ScrollView>(null);
  const reviewIndexRef = useRef(0);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewScrollX = useRef(new Animated.Value(0)).current;

  const reviewCardWidth = screenWidth * 0.74;
  const reviewCardGap = 16;
  const reviewCardStep = reviewCardWidth + reviewCardGap;
  const sideInset = (screenWidth - reviewCardWidth) / 2;

  const reviewCount = gym?.reviews?.length || 0;
  const reviewSlides = useMemo(() => {
    if (!gym?.reviews || gym.reviews.length === 0) return [];
    const repeatCount = gym.reviews.length > 1 ? 5 : 1;
    return Array.from({ length: repeatCount }, () => gym.reviews).flat();
  }, [gym?.reviews]);

  useEffect(() => {
    if (!reviewCardWidth || reviewCount <= 1) return;

    const interval = setInterval(() => {
      reviewIndexRef.current += 1;
      const currentPos = reviewIndexRef.current;

      reviewScrollRef.current?.scrollTo({
        x: currentPos * reviewCardStep,
        animated: true,
      });

      setActiveReviewIndex(currentPos % reviewCount);

      if (currentPos >= reviewCount * 4) {
        setTimeout(() => {
          const resetPos = currentPos - reviewCount * 2;
          reviewIndexRef.current = resetPos;
          reviewScrollRef.current?.scrollTo({
            x: resetPos * reviewCardStep,
            animated: false,
          });
        }, 500);
      }
    }, 3600);

    return () => clearInterval(interval);
  }, [reviewCount, reviewCardStep, reviewCardWidth]);

  const handleShare = async () => {
    if (!gym) return;
    try {
      await Share.share({
        message: `Check out ${gym.title} on FitFob! Located at ${gym.address}. Join today!`,
      });
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  const handleGetDirections = (targetBranch?: GymBranchItem) => {
    if (!gym) return;
    const branchToUse = targetBranch || selectedBranch;
    const lat = branchToUse ? branchToUse.coordinate.latitude : gym.coordinate?.latitude || 30.7046;
    const lng = branchToUse ? branchToUse.coordinate.longitude : gym.coordinate?.longitude || 76.7179;
    const branchName = branchToUse ? branchToUse.name : gym.title;
    const encodedName = encodeURIComponent(branchName);

    const googleMapsAppUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
    });

    const nativeMapScheme = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${encodedName}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
    });

    const webGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`;

    (async () => {
      try {
        if (googleMapsAppUrl && (await Linking.canOpenURL(googleMapsAppUrl))) {
          await Linking.openURL(googleMapsAppUrl);
          return;
        }
      } catch {}

      try {
        if (nativeMapScheme && (await Linking.canOpenURL(nativeMapScheme))) {
          await Linking.openURL(nativeMapScheme);
          return;
        }
      } catch {}

      Linking.openURL(webGoogleMapsUrl).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    })();
  };

  if (isGymLoading) {
    return <GymDetailSkeletonScreen onBack={() => router.back()} />;
  }

  if (!gym) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="barbell-outline" size={64} color="#94A3B8" />
        <Text className="mt-4 font-bold text-xl text-slate-800">Gym Not Found</Text>
        <Text className="mt-1 text-center font-medium text-sm text-slate-400">
          The fitness club details could not be loaded or this gym does not exist.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 rounded-2xl bg-[#E23744] px-6 py-3.5">
          <Text className="font-bold text-sm text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* 1. Sticky Floating Top Navigation Header */}
      <View className="absolute left-0 right-0 top-0 z-50">
        <Animated.View
          style={{ opacity: headerBackgroundOpacity }}
          className="absolute inset-0 border-b border-slate-100 bg-white shadow-xs"
        />

        <SafeAreaView
          edges={['top']}
          className="flex-row items-center justify-between px-4 pb-2.5 pt-2">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center overflow-hidden rounded-full">
            <Animated.View
              style={{
                opacity: headerBackgroundOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                backgroundColor: 'rgba(0, 0, 0, 0.32)',
                borderRadius: 39,
              }}
              className="absolute inset-0"
            />
            <Animated.View
              style={{ opacity: headerBackgroundOpacity }}
              className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100"
            />

            <Animated.View
              style={{
                opacity: headerBackgroundOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }}
              className="absolute items-center justify-center">
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Animated.View>
            <Animated.View
              style={{ opacity: headerBackgroundOpacity }}
              className="absolute items-center justify-center">
              <Ionicons name="chevron-back" size={22} color="#1E293B" />
            </Animated.View>
          </TouchableOpacity>

          {/* Center Gym Title & Mini Logo */}
          <Animated.View
            style={{ opacity: headerTitleOpacity }}
            className="mx-3 flex-1 flex-row items-center justify-center gap-2">
            {Boolean(gym.logo) && (
              <Image
                source={{ uri: gym.logo }}
                className="h-6 w-6 rounded-full border border-slate-200 bg-white"
                resizeMode="cover"
              />
            )}
            <Text numberOfLines={1} className="font-bold text-base text-slate-900">
              {gym.title}
            </Text>
          </Animated.View>

          {/* Right Action Icons (Favorite & Verified Badge) */}
          <View className="flex-row items-center space-x-2.5">
            <TouchableOpacity
              onPress={handleToggleFavorite}
              disabled={isTogglingFav}
              activeOpacity={0.8}
              className="h-10 w-10 items-center justify-center overflow-hidden rounded-full">
              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  backgroundColor: 'rgba(0, 0, 0, 0.32)',
                  borderRadius: 39,
                }}
                className="absolute inset-0"
              />
              <Animated.View
                style={{ opacity: headerBackgroundOpacity }}
                className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100"
              />

              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                }}
                className="absolute items-center justify-center">
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? '#E23744' : '#FFFFFF'}
                />
              </Animated.View>

              <Animated.View
                style={{ opacity: headerBackgroundOpacity }}
                className="absolute items-center justify-center">
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#E23744"
                />
              </Animated.View>
            </TouchableOpacity>

            <View className="ml-2.5 h-10 w-10 items-center justify-center overflow-hidden rounded-full">
              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  backgroundColor: 'rgba(0, 0, 0, 0.32)',
                  borderRadius: 39,
                }}
                className="absolute inset-0"
              />
              <Animated.View
                style={{ opacity: headerBackgroundOpacity }}
                className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100"
              />

              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                }}
                className="absolute items-center justify-center">
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M19.1712 9.99989L17.1379 7.68322L17.4212 4.61655L14.4129 3.93322L12.8379 1.28322L10.0046 2.49989L7.17123 1.28322L5.59622 3.93322L2.58789 4.60822L2.87122 7.67489L0.837891 9.99989L2.87122 12.3166L2.58789 15.3916L5.59622 16.0749L7.17123 18.7249L10.0046 17.4999L12.8379 18.7166L14.4129 16.0666L17.4212 15.3832L17.1379 12.3166L19.1712 9.99989ZM8.33789 14.1666L5.00456 10.8332L6.17956 9.65822L8.33789 11.8082L13.8296 6.31655L15.0046 7.49989L8.33789 14.1666Z"
                    fill="white"
                  />
                </Svg>
              </Animated.View>

              <Animated.View
                style={{ opacity: headerBackgroundOpacity }}
                className="absolute items-center justify-center">
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M19.1712 9.99989L17.1379 7.68322L17.4212 4.61655L14.4129 3.93322L12.8379 1.28322L10.0046 2.49989L7.17123 1.28322L5.59622 3.93322L2.58789 4.60822L2.87122 7.67489L0.837891 9.99989L2.87122 12.3166L2.58789 15.3916L5.59622 16.0749L7.17123 18.7249L10.0046 17.4999L12.8379 18.7166L14.4129 16.0666L17.4212 15.3832L17.1379 12.3166L19.1712 9.99989ZM8.33789 14.1666L5.00456 10.8332L6.17956 9.65822L8.33789 11.8082L13.8296 6.31655L15.0046 7.49989L8.33789 14.1666Z"
                    fill="#E23744"
                  />
                </Svg>
              </Animated.View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* 2. Scrollable Bottom Sheet Content */}
      <Animated.ScrollView
        scrollEnabled={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        className="flex-1">
        {/* 1. Hero Image Carousel */}
        <Animated.View
          style={{
            height: HERO_HEIGHT,
            transform: [{ scale: heroScale }],
          }}
          className="relative w-full bg-slate-900">
          {gym.photos.length > 0 ? (
            <>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  let idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  if (idx >= gym.photos.length) {
                    scrollRef.current?.scrollTo({ x: 0, animated: false });
                    idx = 0;
                  }
                  currentIndexRef.current = idx;
                  setActiveImageIndex(idx);
                }}
                scrollEventThrottle={16}>
                {slides.map((photo, idx) => (
                  <View
                    key={idx}
                    style={{ width: screenWidth, height: HERO_HEIGHT }}
                    className="relative">
                    <Image
                      source={{ uri: photo.url }}
                      style={{ width: screenWidth, height: HERO_HEIGHT }}
                      resizeMode="cover"
                    />
                    {/* Dark gradient overlay at bottom for badge legibility */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 90,
                        backgroundColor: 'rgba(0,0,0,0.28)',
                      }}
                    />

                    {/* Image Info Tag / Badge on the active photo */}
                    {Boolean(photo.imageInfo) && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 48,
                          right: 16,
                          backgroundColor: 'rgba(15, 23, 42, 0.78)',
                          borderRadius: 20,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.25)',
                          maxWidth: screenWidth * 0.65,
                        }}>
                        <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
                        <Text
                          numberOfLines={1}
                          style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                          {photo.imageInfo}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* Slide Indicators on the bottom left */}
              {gym.photos.length > 1 && (
                <View className="absolute bottom-12 left-5 flex-row items-center">
                  {gym.photos.length <= 6 ? (
                    gym.photos.map((_, idx) => (
                      <View
                        key={idx}
                        style={{ marginRight: idx === gym.photos.length - 1 ? 0 : 6 }}
                        className={`h-1.5 rounded-full ${
                          idx === activeImageIndex ? 'w-6 bg-[#E23744]' : 'w-1.5 bg-white/80'
                        }`}
                      />
                    ))
                  ) : (
                    <View
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      }}
                      className="flex-row items-center gap-1.5 rounded-full border px-2.5 py-1">
                      <Ionicons name="images-outline" size={12} color="#FFFFFF" />
                      <Text className="text-[11px] font-bold text-white">
                        {activeImageIndex + 1}/{gym.photos.length}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View className="h-full w-full items-center justify-center bg-slate-800">
              <Ionicons name="barbell-outline" size={56} color="#64748B" />
              <Text className="mt-2 text-xs font-semibold text-slate-400">FitFob Partner Gym</Text>
            </View>
          )}
        </Animated.View>

        {/* 2. Curved Bottom Sheet Card */}
        <View
          style={Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
            android: {
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            },
          })}
          className="-mt-9 min-h-screen rounded-t-[36px] bg-white px-5 pb-32 pt-3">
          {/* Bottom Sheet Pull Handle */}
          <View pointerEvents="none" className="mb-3 mt-1 items-center">
            <View className="h-1.5 w-12 rounded-full bg-slate-300" />
          </View>

          {/* Gym Header: Logo, Badges, Title, Owner, Address & Chat Button */}
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              {/* Badges: Category, Club Category, Club ID */}
              <View className="mb-2 flex-row flex-wrap items-center gap-1.5">
                {Boolean(gym.clubCategory) && (
                  <View className="flex-row items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 border border-amber-500/20">
                    <Ionicons name="sparkles" size={11} color="#D97706" />
                    <Text className="text-[11px] font-bold text-amber-700">
                      {gym.clubCategory}
                    </Text>
                  </View>
                )}
                {Boolean(gym.category) && gym.category !== gym.clubCategory && (
                  <View className="rounded-full bg-[#FFEAEF] px-2.5 py-0.5">
                    <Text className="text-[11px] font-bold text-[#E23744]">
                      {gym.category}
                    </Text>
                  </View>
                )}
                {/* {Boolean(gym.clubId) && (
                  <View className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 border border-slate-200">
                    <Ionicons name="qr-code-outline" size={11} color="#64748B" />
                    <Text className="text-[11px] font-semibold text-slate-600">
                      ID: {gym.clubId}
                    </Text>
                  </View>
                )} */}
              </View>

              {/* Title with Logo */}
              <View className="flex-row items-center gap-3">
                {Boolean(gym.logo) && (
                  <Image
                    source={{ uri: gym.logo }}
                    className="h-14 w-14 rounded-2xl border border-slate-200 bg-white"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1">
                  <Text className="font-bold text-2xl text-slate-900 leading-tight">
                    {gym.title}
                  </Text>
                  {Boolean(gym.ownerName) && (
                    <View className="mt-1 flex-row items-center gap-1">
                      <Ionicons name="person-outline" size={12} color="#64748B" />
                      <Text className="text-xs font-medium text-slate-500">
                        Owner: <Text className="font-semibold text-slate-700">{gym.ownerName}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Address */}
              {Boolean(gym.address) && (
                <View className="mt-2.5 flex-row items-center gap-1.5">
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text className="flex-1 font-medium text-xs text-slate-500 leading-4">
                    {gym.address}
                  </Text>
                </View>
              )}

              {/* Star Rating Badge (Only if ratings exist) */}
              {Number(gym.rating) > 0 ? (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/gym/reviews' as any,
                      params: { id: gym.id },
                    })
                  }
                  activeOpacity={0.7}
                  className="mt-2.5 flex-row items-center space-x-1.5">
                  <Ionicons name="star" size={15} color="#F59E0B" />
                  <Text className="ml-1 font-bold text-xs text-slate-800">
                    {gym.rating}/5
                    {gym.totalReviews > 0 && (
                      <Text className="font-normal text-slate-400">
                        {'  '}({gym.totalReviews} Reviews)
                      </Text>
                    )}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Red Circular Chat Button */}
            <TouchableOpacity
              onPress={() => router.push('/support/help-support' as any)}
              activeOpacity={0.85}
              className="h-12 w-12 items-center justify-center rounded-full bg-[#FFEAEF] shadow-xs">
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 18H6V22.081L11.101 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18Z"
                  fill="#E23744"
                />
                <Path
                  d="M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z"
                  fill="#E23744"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Description Paragraph (Only if real description provided) */}
          {Boolean(gym.description) && (
            <Text className="mt-4 font-sans text-xs leading-5 text-slate-600">
              {gym.description}
            </Text>
          )}

          {/* 3. Where you'll exercise (Only if zones exist) */}
          {gym.exerciseZones.length > 0 && (
            <View className="mt-6">
              <Text className="font-bold text-base text-slate-900">Where you'll exercise</Text>

              <ScrollView
                horizontal
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                className="mt-3 -mx-5 px-5">
                {gym.exerciseZones.map((zone: ExerciseZoneItem, idx: number) => (
                  <View key={idx} className="mr-3 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    {Boolean(zone.image) && (
                      <Image
                        source={{ uri: zone.image }}
                        className="h-28 w-full"
                        resizeMode="cover"
                      />
                    )}
                    <View className="p-2.5">
                      <Text className="font-bold text-xs text-slate-800" numberOfLines={1}>
                        {zone.title}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 4. Key Features / Amenities (Only if amenities exist) */}
          {gym.amenities.length > 0 && (
            <View className="mt-6">
              <Text className="font-bold text-base text-slate-900">Key Features</Text>

              <View className="mt-3 flex-row flex-wrap gap-2.5">
                {gym.amenities.map((item, idx) => (
                  <View
                    key={idx}
                    className="w-[48%] flex-row items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 px-3.5 py-3">
                    <Ionicons name={item.icon as any} size={18} color="#E23744" />
                    <Text className="font-semibold text-xs text-slate-800">{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 5. Open Hours (Only if timings provided) */}
          {Boolean(gym.openHours) && (
            <View className="mt-6">
              <Text className="font-bold text-base text-slate-900">Open Hours</Text>

              <View className="mt-2.5 flex-row items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3.5">
                <Ionicons name="time-outline" size={19} color="#64748B" />
                <Text className="font-semibold text-xs text-slate-700">{gym.openHours}</Text>
              </View>

              {/* Holidays list if any */}
              {gym.holidays.length > 0 && (
                <View className="mt-2.5 space-y-2">
                  {gym.holidays.map((h: any, i: number) => (
                    <View
                      key={i}
                      className="flex-row items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                      <Ionicons name="calendar-outline" size={14} color="#D97706" />
                      <Text className="text-xs font-semibold text-amber-800">
                        Holiday: {h.title} ({h.startDate}) -{' '}
                        {h.closureType === 'full_day' ? 'Closed All Day' : 'Special Hours'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 6. Where you'll be (Location & Map) */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-bold text-base text-slate-900">Where you'll be</Text>
                {Boolean(gym.address) && (
                  <Text className="mt-1 font-medium text-xs text-slate-500" numberOfLines={2}>
                    {gym.address}
                  </Text>
                )}
              </View>

              {/* Right Side Directions Button */}
              <TouchableOpacity
                onPress={() => handleGetDirections()}
                activeOpacity={0.85}
                className="flex-row items-center gap-1.5 rounded-xl border border-[#E23744]/25 bg-[#FFEAEF] px-3.5 py-2 shadow-xs">
                <Ionicons name="navigate" size={14} color="#E23744" />
                <Text className="font-bold text-xs text-[#E23744]">Directions</Text>
              </TouchableOpacity>
            </View>

            {/* Live Interactive Dedicated Gym Map */}
            <View className="mt-3 overflow-hidden rounded-[10px] border border-slate-200 shadow-sm" style={{ height: 260 }}>
              <GymDetailMapView
                title={gym.title}
                address={gym.address}
                coordinate={gym.coordinate}
                userLocation={userLocation}
                height={260}
                onGetDirections={() => handleGetDirections()}
                onOpenAllGymsMap={() => router.push('/gym/Mapviewscreen' as any)}
              />
            </View>
          </View>

          {/* 7. Reviews and Ratings (Only if ratings or reviews exist) */}
          {gym.totalReviews > 0 || gym.reviews.length > 0 ? (
            <View className="mt-6">
              <Text className="font-bold text-base text-slate-900">Reviews and Ratings</Text>

              {/* Ratings Breakdown Card */}
              {gym.ratingBreakdown.length > 0 && (
                <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  {/* Left: Star percentage bars */}
                  <View className="flex-1 pr-6 space-y-1.5">
                    {gym.ratingBreakdown.map((r: RatingBreakdownItem) => (
                      <View key={r.star} className="flex-row items-center">
                        <Text className="w-3 font-semibold text-[11px] text-slate-500">{r.star}</Text>
                        <Ionicons name="star" size={10} color="#F59E0B" className="mx-1" />
                        <View className="h-1.5 flex-1 rounded-full bg-slate-200 ml-1">
                          <View
                            style={{ width: r.pct as any }}
                            className="h-full rounded-full bg-[#E23744]"
                          />
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Right: Big rating and total reviews */}
                  <View className="items-center border-l border-slate-200 pl-6">
                    <Text className="font-extrabold text-3xl text-slate-900">{gym.rating}</Text>
                    <View className="my-1 flex-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name="star"
                          size={12}
                          color={s <= Math.round(Number(gym.rating)) ? '#F59E0B' : '#CBD5E1'}
                        />
                      ))}
                    </View>
                    <Text className="font-medium text-[11px] text-slate-500">
                      {gym.totalReviews} Reviews
                    </Text>
                  </View>
                </View>
              )}

              {/* Centered Coverflow Reviews Carousel */}
              {gym.reviews.length > 0 && (
                <View className="mt-4 -mx-5">
                  <Animated.ScrollView
                    ref={reviewScrollRef as any}
                    horizontal
                    nestedScrollEnabled={true}
                    pagingEnabled={false}
                    decelerationRate="fast"
                    snapToInterval={reviewCardStep}
                    snapToAlignment="center"
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                      [{ nativeEvent: { contentOffset: { y: reviewScrollX } } }],
                      { useNativeDriver: true }
                    )}
                    onMomentumScrollEnd={(e) => {
                      let idx = Math.round(e.nativeEvent.contentOffset.x / reviewCardStep);
                      reviewIndexRef.current = idx;
                      setActiveReviewIndex(idx % gym.reviews.length);
                    }}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingHorizontal: sideInset, paddingVertical: 12 }}>
                    {reviewSlides.map((rev, idx) => {
                      const inputRange = [
                        (idx - 1) * reviewCardStep,
                        idx * reviewCardStep,
                        (idx + 1) * reviewCardStep,
                      ];

                      const scale = reviewScrollX.interpolate({
                        inputRange,
                        outputRange: [0.91, 1, 0.91],
                        extrapolate: 'clamp',
                      });

                      const opacity = reviewScrollX.interpolate({
                        inputRange,
                        outputRange: [0.62, 1, 0.62],
                        extrapolate: 'clamp',
                      });

                      return (
                        <Animated.View
                          key={idx}
                          style={{
                            width: reviewCardWidth,
                            minHeight: 145,
                            marginRight: reviewCardGap,
                            padding: 18,
                            transform: [{ scale }],
                            opacity,
                          }}
                          className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                          {/* Header: Avatar, Name, Rating & Time */}
                          <View className="flex-row items-center gap-3">
                            <Image
                              source={{ uri: rev.avatar }}
                              className="h-12 w-12 rounded-full border border-slate-200 bg-slate-200"
                            />
                            <View className="flex-1">
                              <Text className="font-bold text-sm text-slate-900" numberOfLines={1}>
                                {rev.name}
                              </Text>
                              <View className="mt-1 flex-row items-center">
                                <View className="flex-row items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                      key={star}
                                      name="star"
                                      size={12}
                                      color={star <= rev.rating ? '#F59E0B' : '#CBD5E1'}
                                    />
                                  ))}
                                </View>
                                <Text className="ml-2 text-xs text-slate-400">
                                  {rev.time}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Review Comment */}
                          <Text className="mt-3 text-xs leading-5 text-slate-600">
                            {rev.comment}
                          </Text>
                        </Animated.View>
                      );
                    })}
                  </Animated.ScrollView>
                </View>
              )}

              {/* Show All Reviews Button */}
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/gym/reviews' as any,
                    params: { id: gym.id },
                  })
                }
                activeOpacity={0.8}
                className="mt-3 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-3.5">
                <Text className="font-bold text-xs text-slate-700">
                  Show {gym.totalReviews} Reviews
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* 8. Club Details & Contact Info */}
          <View className="mt-6">
            <Text className="font-bold text-base text-slate-900">Club Details</Text>

            <View className="mt-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-200/60">
                <Text className="text-xs font-medium text-slate-500">Club ID</Text>
                <Text className="text-xs font-bold text-slate-800">{gym.clubId || gym.id}</Text>
              </View>
              {Boolean(gym.ownerName) && (
                <View className="flex-row items-center justify-between py-3 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Owner / Manager</Text>
                  <Text className="text-xs font-bold text-slate-800">{gym.ownerName}</Text>
                </View>
              )}
              {Boolean(gym.clubCategory) && (
                <View className="flex-row items-center justify-between py-3 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Category</Text>
                  <Text className="text-xs font-bold text-amber-700">{gym.clubCategory}</Text>
                </View>
              )}
              <View className="flex-row items-center justify-between pt-3">
                <Text className="text-xs font-medium text-slate-500">Direct Contact</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/membership/buy-membership' as any,
                      params: { gymName: gym.title, gymId: gym.id },
                    })
                  }
                  activeOpacity={0.8}
                  className="flex-row items-center gap-1.5 rounded-xl border border-[#E23744]/25 bg-[#FFEAEF] px-3 py-1.5">
                  <Ionicons name="lock-closed" size={13} color="#E23744" />
                  <Text className="text-xs font-bold text-[#E23744]">Unlock to View Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* 9. Sticky Bottom Action Bar */}
      <View
        style={{
          paddingBottom: Platform.OS === 'ios' ? 24 : 14,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
            },
            android: {
              elevation: 0,
            },
          }),
        }}
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-slate-100 bg-white px-4 pt-3">
        {/* Buy Membership Button */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/membership/buy-membership' as any,
              params: { gymName: gym.title, gymId: gym.id },
            })
          }
          activeOpacity={0.85}
          className="flex-1 items-center justify-center rounded-2xl bg-[#E23744] py-3.5 shadow-md shadow-[#E23744]/25">
          <Text className="font-bold text-sm text-white">Buy Membership</Text>
        </TouchableOpacity>

        {/* Use Outdoor Pass Button */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/outdoor-pass')}
          activeOpacity={0.85}
          className="flex-1 items-center justify-center rounded-2xl border-2 border-[#E23744] bg-white py-3.5">
          <Text className="font-bold text-sm text-[#E23744]">Use Outdoor Pass</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
