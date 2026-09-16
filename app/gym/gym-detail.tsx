import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import GymDetailMapView from '@/components/modules/GymDetailMapView';

export interface GymBranchItem {
  id: string;
  name: string;
  address?: string;
  coordinate: { latitude: number; longitude: number };
  isMain?: boolean;
}

export const GYM_DETAILS = {
  '1': {
    id: '1',
    title: 'Anytime Fitness Gym',
    address: 'Sector 71, Mohali, Punjab',
    coordinate: { latitude: 30.7046, longitude: 76.7179 },
    branches: [
      {
        id: 'b1-1',
        name: 'Anytime Fitness - Sector 71 (Selected)',
        address: 'Sector 71, Mohali, Punjab',
        coordinate: { latitude: 30.7046, longitude: 76.7179 },
        isMain: true,
      },
      {
        id: 'b1-2',
        name: 'Anytime Fitness - Phase 5 Branch',
        address: 'SCF 32, Phase 5, Mohali, Punjab',
        coordinate: { latitude: 30.7188, longitude: 76.7145 },
      },
      {
        id: 'b1-3',
        name: 'Anytime Fitness - Phase 8B Industrial Branch',
        address: 'Plot 42, Phase 8B, Industrial Area, Mohali',
        coordinate: { latitude: 30.7090, longitude: 76.6960 },
      },
      {
        id: 'b1-4',
        name: 'Anytime Fitness - Sector 68 Branch',
        address: 'SCO 55, Sector 68, Mohali, Punjab',
        coordinate: { latitude: 30.6970, longitude: 76.7260 },
      },
      {
        id: 'b1-5',
        name: 'Anytime Fitness - Sector 82 JLPL Branch',
        address: 'Commercial Hub, Sector 82, Mohali, Punjab',
        coordinate: { latitude: 30.6720, longitude: 76.7350 },
      },
    ],
    rating: '4.5',
    totalReviews: 52,
    openHours: 'Mon - Sun: 06:00 AM - 10:00 PM',
    description:
      'Experience elite fitness training with state-of-the-art strength machinery, certified personal trainers, dedicated cardio arenas, and a rejuvenating steam/sauna experience tailored to help you crush your daily fitness goals.',
    amenities: [
      { name: 'AC', icon: 'snow-outline', library: 'ionicons' },
      { name: 'Parking', icon: 'car-outline', library: 'ionicons' },
      { name: 'Trainers', icon: 'barbell-outline', library: 'ionicons' },
      { name: 'Shower', icon: 'water-outline', library: 'ionicons' },
      { name: 'Wi-Fi', icon: 'wifi-outline', library: 'ionicons' },
    ],
    exerciseZones: [
      {
        title: 'Cardio & Machines Zone',
        image:
          'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=600&auto=format&fit=crop',
      },
      {
        title: 'Free Weights & Strength Arena',
        image:
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
      },
      {
        title: 'CrossFit & Functional Floor',
        image:
          'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop',
      },
    ],
    ratingBreakdown: [
      { star: 5, pct: '75%' },
      { star: 4, pct: '55%' },
      { star: 3, pct: '30%' },
      { star: 2, pct: '12%' },
      { star: 1, pct: '5%' },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Courtney Henry',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '2 mins ago',
        comment:
          'Superb gym with brand new equipment, very clean locker rooms, and extremely friendly certified trainers.',
      },
      {
        id: 'r2',
        name: 'Alex Mercer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '1 day ago',
        comment:
          'Spacious crossfit floor and top-notch ventilation. Easily the best fitness club in Sector 71!',
      },
      {
        id: 'r3',
        name: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '3 days ago',
        comment:
          'The trainers are super supportive and push you towards real transformation. Great community energy!',
      },
      {
        id: 'r4',
        name: 'David Miller',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '1 week ago',
        comment:
          'Cleanest shower facilities and the steam bath is amazing after heavy lifting. 10/10 recommend!',
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  '2': {
    id: '2',
    title: 'Gold’s Fitness Club',
    address: 'Phase 5, Mohali, Punjab',
    coordinate: { latitude: 30.7188, longitude: 76.7145 },
    branches: [
      {
        id: 'b2-1',
        name: 'Gold’s Fitness Club - Phase 5 (Selected)',
        address: 'Phase 5, Mohali, Punjab',
        coordinate: { latitude: 30.7188, longitude: 76.7145 },
        isMain: true,
      },
      {
        id: 'b2-2',
        name: 'Gold’s Fitness Club - Sector 70 Branch',
        address: 'SCO 21, Sector 70, Mohali, Punjab',
        coordinate: { latitude: 30.6980, longitude: 76.7120 },
      },
      {
        id: 'b2-3',
        name: 'Gold’s Fitness Club - Phase 3B2 Branch',
        address: 'Market Complex, Phase 3B2, Mohali, Punjab',
        coordinate: { latitude: 30.7135, longitude: 76.7235 },
      },
      {
        id: 'b2-4',
        name: 'Gold’s Fitness Club - Sector 80 Branch',
        address: 'Near IT City Road, Sector 80, Mohali, Punjab',
        coordinate: { latitude: 30.6860, longitude: 76.7240 },
      },
    ],
    rating: '4.8',
    totalReviews: 68,
    openHours: 'Mon - Sun: 05:30 AM - 10:30 PM',
    description:
      'Premier bodybuilding and lifestyle fitness hub featuring heavy Olympic powerlifting platforms, dedicated spin studio, licensed nutrition counselors, and luxurious sauna suites.',
    amenities: [
      { name: 'AC', icon: 'snow-outline', library: 'ionicons' },
      { name: 'Parking', icon: 'car-outline', library: 'ionicons' },
      { name: 'Personal Trainer', icon: 'barbell-outline', library: 'ionicons' },
      { name: 'Sauna', icon: 'water-outline', library: 'ionicons' },
      { name: 'Locker', icon: 'lock-closed-outline', library: 'ionicons' },
      { name: 'Wi-Fi', icon: 'wifi-outline', library: 'ionicons' },
    ],
    exerciseZones: [
      {
        title: 'Olympic Weightlifting Arena',
        image:
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=600&auto=format&fit=crop',
      },
      {
        title: 'HIIT & Functional Floor',
        image:
          'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=600&auto=format&fit=crop',
      },
      {
        title: 'Sauna & Recovery Lounge',
        image:
          'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=600&auto=format&fit=crop',
      },
    ],
    ratingBreakdown: [
      { star: 5, pct: '82%' },
      { star: 4, pct: '48%' },
      { star: 3, pct: '20%' },
      { star: 2, pct: '8%' },
      { star: 1, pct: '3%' },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '1 hour ago',
        comment:
          'Amazing atmosphere and supportive community. Trainers push you to reach your real potential!',
      },
      {
        id: 'r2',
        name: 'Rohan Sharma',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '3 days ago',
        comment: 'Top-tier equipment and peaceful sauna to relax post-workout.',
      },
      {
        id: 'r3',
        name: 'Simran Kaur',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '5 days ago',
        comment:
          'Incredible spin studio with electrifying playlists. Best workout of my week every week!',
      },
      {
        id: 'r4',
        name: 'Karan Mehra',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '1 week ago',
        comment:
          'Heavy dumbbells up to 60kg and competition squat racks. A real lifter’s paradise.',
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  '3': {
    id: '3',
    title: 'Cult.Fit Elite Center',
    address: 'Phase 7, Mohali, Punjab',
    coordinate: { latitude: 30.7095, longitude: 76.7095 },
    branches: [
      {
        id: 'b3-1',
        name: 'Cult.Fit - Phase 7 Center (Selected)',
        address: 'Phase 7, Mohali, Punjab',
        coordinate: { latitude: 30.7095, longitude: 76.7095 },
        isMain: true,
      },
      {
        id: 'b3-2',
        name: 'Cult.Fit - Sector 67 Center',
        address: 'SCO 18, Sector 67, Mohali, Punjab',
        coordinate: { latitude: 30.6880, longitude: 76.7340 },
      },
      {
        id: 'b3-3',
        name: 'Cult.Fit - Phase 3B2 Center',
        address: 'Phase 3B2, Mohali, Punjab',
        coordinate: { latitude: 30.7140, longitude: 76.7220 },
      },
    ],
    rating: '4.7',
    totalReviews: 44,
    openHours: 'Mon - Sun: 06:00 AM - 10:00 PM',
    description:
      'State-of-the-art functional fitness, high-intensity boxing arenas, CrossFit rigs, and recovery steam amenities coached by certified elite masters.',
    amenities: [
      { name: 'Boxing', icon: 'fitness-outline', library: 'ionicons' },
      { name: 'CrossFit', icon: 'barbell-outline', library: 'ionicons' },
      { name: 'Steam', icon: 'water-outline', library: 'ionicons' },
      { name: 'Shower', icon: 'water-outline', library: 'ionicons' },
      { name: 'Wi-Fi', icon: 'wifi-outline', library: 'ionicons' },
    ],
    exerciseZones: [
      {
        title: 'CrossFit Rig & Turf',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
      },
      {
        title: 'Combat & Boxing Ring',
        image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=600&auto=format&fit=crop',
      },
    ],
    ratingBreakdown: [
      { star: 5, pct: '78%' },
      { star: 4, pct: '50%' },
      { star: 3, pct: '25%' },
      { star: 2, pct: '10%' },
      { star: 1, pct: '4%' },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Amanpreet Singh',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '2 hours ago',
        comment: 'Best CrossFit facility in Phase 7 Mohali. Coaches are world class!',
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  '4': {
    id: '4',
    title: 'Prana Yoga & Wellness',
    address: 'Phase 3B2, Mohali, Punjab',
    coordinate: { latitude: 30.7135, longitude: 76.7235 },
    rating: '4.9',
    totalReviews: 89,
    openHours: 'Mon - Sat: 06:00 AM - 08:30 PM',
    description:
      'Holistic mind and body wellness sanctuary offering traditional Ashtanga, Hatha Yoga, calming sound baths, and natural detox tea lounge.',
    amenities: [
      { name: 'Meditation', icon: 'flower-outline', library: 'ionicons' },
      { name: 'AC', icon: 'snow-outline', library: 'ionicons' },
      { name: 'Locker', icon: 'lock-closed-outline', library: 'ionicons' },
      { name: 'Wi-Fi', icon: 'wifi-outline', library: 'ionicons' },
    ],
    exerciseZones: [
      {
        title: 'Zen Meditation Studio',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
      },
    ],
    ratingBreakdown: [
      { star: 5, pct: '90%' },
      { star: 4, pct: '40%' },
      { star: 3, pct: '15%' },
      { star: 2, pct: '5%' },
      { star: 1, pct: '2%' },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Neha Verma',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '1 day ago',
        comment: 'Peaceful ambience and authentic yoga masters. Recharges your soul!',
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  '5': {
    id: '5',
    title: 'Powerhouse Gym & Spa',
    address: 'Sector 70, Mohali, Punjab',
    coordinate: { latitude: 30.6980, longitude: 76.7120 },
    rating: '4.6',
    totalReviews: 61,
    openHours: 'Mon - Sun: 05:30 AM - 10:30 PM',
    description:
      'Heavy duty weight training, Olympic lifting platforms, luxury pool, and Scandinavian sauna facilities.',
    amenities: [
      { name: 'Pool', icon: 'water-outline', library: 'ionicons' },
      { name: 'Sauna', icon: 'flame-outline', library: 'ionicons' },
      { name: 'Trainers', icon: 'barbell-outline', library: 'ionicons' },
      { name: 'Parking', icon: 'car-outline', library: 'ionicons' },
    ],
    exerciseZones: [
      {
        title: 'Olympic Free Weights',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop',
      },
    ],
    ratingBreakdown: [
      { star: 5, pct: '70%' },
      { star: 4, pct: '50%' },
      { star: 3, pct: '28%' },
      { star: 2, pct: '12%' },
      { star: 1, pct: '5%' },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Jasmeet Dhillon',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '3 days ago',
        comment: 'Fantastic gym with great pool and sauna. Highly recommended!',
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  '6': {
    id: '6',
    title: 'Ozone Fitness Club',
    address: 'Phase 9, Mohali, Punjab',
    coordinate: { latitude: 30.6890, longitude: 76.7310 },
    rating: '4.6',
    totalReviews: 38,
    openHours: 'Mon - Sun: 06:00 AM - 10:00 PM',
    description:
      'Premier fitness club offering high-performance functional fitness, spinning studios, and expert nutritional guidance.',
    amenities: [
      { name: 'AC', icon: 'snow-outline', library: 'ionicons' },
      { name: 'Spinning', icon: 'bicycle-outline', library: 'ionicons' },
      { name: 'Shower', icon: 'water-outline', library: 'ionicons' },
      { name: 'Wi-Fi', icon: 'wifi-outline', library: 'ionicons' },
    ],
    exerciseZones: [
      {
        title: 'Cardio & Strength',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop',
      },
    ],
    ratingBreakdown: [
      { star: 5, pct: '75%' },
      { star: 4, pct: '45%' },
      { star: 3, pct: '20%' },
      { star: 2, pct: '8%' },
      { star: 1, pct: '3%' },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Ritu Sen',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
        rating: 5,
        time: '5 days ago',
        comment: 'Super clean and great community vibe in Phase 9!',
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop',
    ],
  },
};

export default function GymDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const gymId = params.id || '1';
  const gym = GYM_DETAILS[gymId as keyof typeof GYM_DETAILS] || GYM_DETAILS['1'];

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
    if (selectedId && selectedId !== gym.id) {
      router.push({
        pathname: '/gym/gym-detail' as any,
        params: { id: selectedId },
      });
    }
  };

  // 5 slides + 1 cloned slide for continuous forward loop
  const slides = [...gym.images, gym.images[0]];


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
    if (!screenWidth || gym.images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;
      scrollRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });

      if (nextIndex >= gym.images.length) {
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
  }, [screenWidth, gym.images.length]);

  // Review Carousel State & Infinite Circular Auto-Scroll (Centered Coverflow)
  const reviewScrollRef = useRef<ScrollView>(null);
  const reviewIndexRef = useRef(0);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewScrollX = useRef(new Animated.Value(0)).current;

  const reviewCardWidth = screenWidth * 0.74;
  const reviewCardGap = 16;
  const reviewCardStep = reviewCardWidth + reviewCardGap;
  const sideInset = (screenWidth - reviewCardWidth) / 2;

  // Infinite repeating sets for seamless circular scroll (never bounces back)
  const REPEAT_SETS = 10;
  const reviewSlides = Array.from({ length: REPEAT_SETS }, () => gym.reviews).flat();

  useEffect(() => {
    if (!reviewCardWidth || gym.reviews.length <= 1) return;

    const interval = setInterval(() => {
      reviewIndexRef.current += 1;
      const currentPos = reviewIndexRef.current;

      reviewScrollRef.current?.scrollTo({
        x: currentPos * reviewCardStep,
        animated: true,
      });

      setActiveReviewIndex(currentPos % gym.reviews.length);

      // Silently reset offset back by 2 full sets without any animation
      // when we reach set 5, so the user NEVER reaches the end and it never jerks backwards!
      if (currentPos >= gym.reviews.length * 5) {
        setTimeout(() => {
          const resetPos = currentPos - gym.reviews.length * 2;
          reviewIndexRef.current = resetPos;
          reviewScrollRef.current?.scrollTo({
            x: resetPos * reviewCardStep,
            animated: false,
          });
        }, 500);
      }
    }, 3600);

    return () => clearInterval(interval);
  }, [gym.reviews.length, reviewCardStep, reviewCardWidth]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${gym.title} on FitFob! Located at ${gym.address}. Join today!`,
      });
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  const handleGetDirections = (targetBranch?: GymBranchItem) => {
    const branchToUse = targetBranch || selectedBranch;
    const lat = branchToUse ? branchToUse.coordinate.latitude : (gym as any).coordinate?.latitude || 30.7046;
    const lng = branchToUse ? branchToUse.coordinate.longitude : (gym as any).coordinate?.longitude || 76.7179;
    const branchName = branchToUse ? branchToUse.name : gym.title;
    const encodedName = encodeURIComponent(branchName);

    // Direct Google Maps navigation URLs (opens Google Maps App directly in turn-by-turn navigation mode)
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

      // Reliable universal fallback
      Linking.openURL(webGoogleMapsUrl).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    })();
  };

  return (
    <View className="flex-1 bg-white">
      {/* 1. Sticky Floating Top Navigation Header */}
      <View className="absolute left-0 right-0 top-0 z-50">
        {/* Solid white background layer that fades in when bottom sheet reaches top */}
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
            {/* Dark glass background (on photo) */}
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
            {/* Light gray background (on white header) */}
            <Animated.View
              style={{
                opacity: headerBackgroundOpacity,
              }}
              className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100"
            />

            {/* Chevron Icons */}
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
              style={{
                opacity: headerBackgroundOpacity,
              }}
              className="absolute items-center justify-center">
              <Ionicons name="chevron-back" size={22} color="#1E293B" />
            </Animated.View>
          </TouchableOpacity>

          {/* Center Gym Title (fades in as sheet scrolls up) */}
          <Animated.View
            style={{ opacity: headerTitleOpacity }}
            className="mx-3 flex-1 items-center">
            <Text numberOfLines={1} className="font-bold text-base text-slate-900">
              {gym.title}
            </Text>
          </Animated.View>

          {/* Right Action Icons (Favorite & Verified Badge) */}
          <View className="flex-row items-center space-x-2.5">
            {/* Favorite Heart Button */}
            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              activeOpacity={0.8}
              className="h-10 w-10 items-center justify-center overflow-hidden rounded-full">
              {/* Dark glass background (on photo) */}
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
              {/* Light gray background (on white header) */}
              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity,
                }}
                className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100"
              />

              {/* White heart icon (on dark photo) */}
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

              {/* Red heart icon (on white header) */}
              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity,
                }}
                className="absolute items-center justify-center">
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#E23744"
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Verified Badge */}
            <View className="ml-2.5 h-10 w-10 items-center justify-center overflow-hidden rounded-full">
              {/* Dark glass background (on photo) */}
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
              {/* Light gray background (on white header) */}
              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity,
                }}
                className="absolute inset-0 rounded-full border border-slate-200 bg-slate-100"
              />

              {/* White SVG icon (on dark photo) */}
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

              {/* Red SVG icon (on white header) */}
              <Animated.View
                style={{
                  opacity: headerBackgroundOpacity,
                }}
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
        {/* 1. Hero Image Carousel (with Zoom) */}
        <Animated.View
          style={{
            height: HERO_HEIGHT,
            transform: [
              { scale: heroScale },
            ],
          }}
          className="relative w-full bg-slate-900">
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              let idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              if (idx >= gym.images.length) {
                scrollRef.current?.scrollTo({ x: 0, animated: false });
                idx = 0;
              }
              currentIndexRef.current = idx;
              setActiveImageIndex(idx);
            }}
            scrollEventThrottle={16}>
            {slides.map((imgUrl, idx) => (
              <Image
                key={idx}
                source={{ uri: imgUrl }}
                style={{ width: screenWidth, height: HERO_HEIGHT }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Bottom Left: Carousel Pagination Dots */}
          <View className="absolute bottom-12 left-5 flex-row items-center">
            {gym.images.map((_, idx) => (
              <View
                key={idx}
                style={{ marginRight: idx === gym.images.length - 1 ? 0 : 6 }}
                className={`h-1.5 rounded-full ${
                  idx === activeImageIndex ? 'w-6 bg-[#E23744]' : 'w-1.5 bg-white/80'
                }`}
              />
            ))}
          </View>
        </Animated.View>

        {/* 2. Curved Bottom Sheet Card (Overlapping Hero & Sliding Up) */}
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

          {/* Gym Title, Location & Chat Button */}
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="font-bold text-2xl text-slate-900">{gym.title}</Text>
              <Text className="mt-1 font-medium text-xs text-slate-500">{gym.address}</Text>

              {/* Star Rating Badge (Clickable to open all reviews) */}
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/gym/reviews' as any,
                    params: { id: gym.id },
                  })
                }
                activeOpacity={0.7}
                className="mt-2 flex-row items-center space-x-1.5">
                <Ionicons name="star" size={15} color="#F59E0B" />
                <Text className="ml-1 font-bold text-xs text-slate-800">
                  {gym.rating}/5
                  <Text className="font-normal text-slate-400">
                    {'  '}({gym.totalReviews} Reviews)
                  </Text>
                </Text>
              </TouchableOpacity>
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

          {/* Description Paragraph */}
          <Text className="mt-4 font-sans text-xs leading-5 text-slate-600">
            {gym.description}
          </Text>

          {/* 3. Where you'll exercise */}
          <View className="mt-6">
            <Text className="font-bold text-base text-slate-900">Where you'll exercise</Text>

            <ScrollView
              horizontal
              nestedScrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              className="mt-3 -mx-5 px-5">
              {gym.exerciseZones.map((zone, idx) => (
                <View key={idx} className="mr-3 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <Image
                    source={{ uri: zone.image }}
                    className="h-28 w-full"
                    resizeMode="cover"
                  />
                  <View className="p-2.5">
                    <Text className="font-bold text-xs text-slate-800" numberOfLines={1}>
                      {zone.title}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* 4. Key Features / Amenities */}
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

          {/* 5. Open Hours */}
          <View className="mt-6">
            <Text className="font-bold text-base text-slate-900">Open Hours</Text>

            <View className="mt-2.5 flex-row items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3.5">
              <Ionicons name="time-outline" size={19} color="#64748B" />
              <Text className="font-semibold text-xs text-slate-700">{gym.openHours}</Text>
            </View>
          </View>

          {/* 6. Where you'll be (Location & Map) */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-bold text-base text-slate-900">Where you'll be</Text>
                <Text className="mt-1 font-medium text-xs text-slate-500" numberOfLines={2}>
                  {gym.address}
                </Text>
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

          {/* 7. Reviews and Ratings */}
          <View className="mt-6">
            <Text className="font-bold text-base text-slate-900">Reviews and Ratings</Text>

            {/* Ratings Breakdown Card */}
            <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {/* Left: Star percentage bars */}
              <View className="flex-1 pr-6 space-y-1.5">
                {gym.ratingBreakdown.map((r) => (
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

              {/* Right: Big 4.5 and total reviews */}
              <View className="items-center border-l border-slate-200 pl-6">
                <Text className="font-extrabold text-3xl text-slate-900">{gym.rating}</Text>
                <View className="my-1 flex-row">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={12} color="#F59E0B" />
                  ))}
                </View>
                <Text className="font-medium text-[11px] text-slate-500">
                  {gym.totalReviews} Reviews
                </Text>
              </View>
            </View>

            {/* Centered Coverflow Reviews Carousel */}
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
                  [{ nativeEvent: { contentOffset: { x: reviewScrollX } } }],
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

          {/* 8. Upgrade to Unlock (Contact Lock) */}
          <View className="mt-6">
            <Text className="font-bold text-base text-slate-900">Upgrade to unlock</Text>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/membership/buy-membership' as any,
                  params: { gymName: gym.title, gymId: gym.id },
                })
              }
              activeOpacity={0.85}
              className="mt-2.5 flex-row items-center justify-center gap-2 rounded-2xl border border-[#E23744]/25 bg-[#FFEAEF] py-3.5">
              <Ionicons name="lock-closed" size={16} color="#E23744" />
              <Text className="font-bold text-xs text-[#E23744]">
                Unlock to View Contact
              </Text>
            </TouchableOpacity>
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
    </View>
  );
}
