import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  Modal,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';

export interface GymItem {
  id: string;
  title: string;
  rating: string;
  amenities: string[];
  price: string;
  isOpen: boolean;
  isVerified: boolean;
  category: string;
  images: string[];
  coordinate: { latitude: number; longitude: number };
}

import CategoryPillItem, { CATEGORIES, CategoryOption } from '@/components/CategoryPillItem';

const GYMS_LIST: GymItem[] = [
  {
    id: '1',
    title: 'Anytime Fitness Gym',
    rating: '4.5/5',
    amenities: ['AC', 'Wi-Fi', 'Trainers', 'SPA', 'Shower', 'Parking'],
    price: '₹1200/Monthly',
    isOpen: true,
    isVerified: true,
    category: 'Gyms',
    coordinate: { latitude: 30.7355, longitude: 76.7782 },
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
    coordinate: { latitude: 30.7392, longitude: 76.7845 },
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
    coordinate: { latitude: 30.7295, longitude: 76.7695 },
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
    coordinate: { latitude: 30.7435, longitude: 76.7735 },
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
    coordinate: { latitude: 30.7320, longitude: 76.7885 },
    images: [
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    ],
  },
];

function GymCardItem({
  gym,
  isFav,
  isSelected,
  onToggleFavorite,
  onFocusOnMap,
}: {
  gym: GymItem;
  isFav: boolean;
  isSelected: boolean;
  onToggleFavorite: () => void;
  onFocusOnMap: () => void;
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(0);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32;

  const slides = [...gym.images, gym.images[0]];

  useEffect(() => {
    if (!cardWidth || gym.images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * cardWidth,
        animated: true,
      });

      if (nextIndex >= gym.images.length) {
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
    }, 3500);

    return () => clearInterval(interval);
  }, [cardWidth, gym.images.length]);

  const handleMomentumScrollEnd = (e: any) => {
    const scrollX = e.nativeEvent.contentOffset.x;
    let newIndex = Math.round(scrollX / cardWidth);
    if (newIndex >= gym.images.length) {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      newIndex = 0;
    }
    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);
  };

  const handleOpenDetail = () => {
    router.push({
      pathname: '/gym/gym-detail' as any,
      params: { id: gym.id },
    });
  };

  return (
    <View
      className={`mb-4 overflow-hidden rounded-3xl bg-[#F8FAFC] shadow-sm ${
        isSelected ? 'border-2 border-[#E23744]' : 'border-[1.5px] border-[#CBD5E1]'
      }`}>
      {/* Top Banner if selected on map */}
      {isSelected && (
        <View className="flex-row items-center justify-between bg-[#FFEAEF] px-4 py-1.5">
          <View className="flex-row items-center">
            <Ionicons name="location" size={14} color="#E23744" />
            <Text className="ml-1 text-xs font-bold text-[#E23744]">Selected on Map</Text>
          </View>
          <TouchableOpacity onPress={onFocusOnMap}>
            <Text className="text-xs font-semibold text-[#E23744]">Center Map</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Carousel */}
      <View className="relative h-52 w-full bg-gray-200">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}>
          {slides.map((imgUrl, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.95}
              onPress={handleOpenDetail}>
              <Image
                source={{ uri: imgUrl }}
                style={{ width: cardWidth, height: 208 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top Left: Heart Favorite Button */}
        <TouchableOpacity
          onPress={onToggleFavorite}
          className="absolute left-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-black/30">
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? '#E23744' : '#FFF'}
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

        {/* Bottom Left: Open Now Badge */}
        {gym.isOpen && (
          <View className="absolute bottom-3 left-3 z-10 rounded-full bg-white px-3 py-1 shadow-sm">
            <Text className="font-semibold text-xs text-[#E23744]">Open now</Text>
          </View>
        )}

        {/* Bottom Right: Dynamic Carousel Pagination Dots */}
        <View className="absolute bottom-3 right-3 z-10 flex-row items-center">
          {gym.images.map((_, idx) => (
            <View
              key={idx}
              style={{ marginRight: idx === gym.images.length - 1 ? 0 : 6 }}
              className={`h-1.5 rounded-full ${
                idx === activeIndex ? 'w-5 bg-[#E23744]' : 'w-1.5 bg-white/70'
              }`}
            />
          ))}
        </View>
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

        {/* Amenities */}
        <Text className="font-regular mt-1.5 text-sm text-secondaryText" numberOfLines={1}>
          {gym.amenities.map((item) => `• ${item}`).join('  ')}
        </Text>

        {/* Pricing & Locate Button */}
        <View className="mt-2.5 flex-row items-center justify-between">
          <Text className="font-bold text-base text-darkText">{gym.price}</Text>

          <TouchableOpacity
            onPress={onFocusOnMap}
            className="flex-row items-center rounded-full bg-[#FFEAEF] px-3.5 py-1.5">
            <Ionicons name="navigate-outline" size={14} color="#E23744" />
            <Text className="ml-1 font-semibold text-xs text-[#E23744]">Locate</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function Mapviewscreen() {
  const router = useRouter();
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

  const [selectedCategory, setSelectedCategory] = useState('Gyms');
  const [categoryAnimTrigger, setCategoryAnimTrigger] = useState<{ id: string; time: number }>({
    id: 'Gyms',
    time: 0,
  });

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setCategoryAnimTrigger({ id: catId, time: Date.now() });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGymId, setSelectedGymId] = useState<string>('1');
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'all'>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const webViewRef = useRef<WebView>(null);

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
    return GYMS_LIST.filter((gym) => {
      const matchesCategory =
        selectedCategory === 'Gyms' || gym.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        gym.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.amenities.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesOpen = !onlyOpen || gym.isOpen;
      return matchesCategory && matchesSearch && matchesOpen;
    }).sort((a, b) => {
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
  }, [selectedCategory, searchQuery, onlyOpen, sortBy]);

  // Leaflet HTML source for map with custom red gym markers
  const mapHtml = useMemo(() => {
    const markersData = JSON.stringify(
      filteredGyms.map((g) => ({
        id: g.id,
        title: g.title,
        lat: g.coordinate.latitude,
        lng: g.coordinate.longitude,
      }))
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossOrigin=""></script>
        <style>
          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #F8F9FA;
            -webkit-user-select: none;
            user-select: none;
          }
          .leaflet-container {
            background: #F8F9FA !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .leaflet-control-attribution {
            display: none !important;
          }
          .custom-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .custom-pin:active {
            transform: scale(0.92);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <script>
          var gyms = ${markersData};
          var centerLat = 30.7355;
          var centerLng = 76.7782;

          var map = L.map('map', {
            center: [centerLat, centerLng],
            zoom: 14.5,
            zoomControl: false,
            attributionControl: false
          });

          // Soft aesthetic street tiles
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
          }).addTo(map);

          var markers = {};

          function createPinSvg(isSelected) {
            var bg = isSelected ? '#991B1B' : '#E23744';
            var scale = isSelected ? 1.25 : 1.0;
            return '<div class="custom-pin" style="transform: scale(' + scale + ');">' +
              '<svg width="34" height="42" viewBox="0 0 34 42" fill="none">' +
                '<path d="M17 0C7.61 0 0 7.61 0 17C0 26.5 15.2 41 16.2 41.9C16.6 42.3 17.4 42.3 17.8 41.9C18.8 41 34 26.5 34 17C34 7.61 26.39 0 17 0Z" fill="' + bg + '"/>' +
                '<circle cx="17" cy="16" r="10" fill="' + bg + '"/>' +
                '<path d="M11 16H23M13 13V19M21 13V19M10 14H12V18H10ZM22 14H24V18H22Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>' +
              '</svg>' +
            '</div>';
          }

          gyms.forEach(function(gym, idx) {
            var isSelected = (idx === 0);
            var icon = L.divIcon({
              html: createPinSvg(isSelected),
              className: 'gym-marker-icon',
              iconSize: [34, 42],
              iconAnchor: [17, 42]
            });

            var marker = L.marker([gym.lat, gym.lng], { icon: icon }).addTo(map);
            markers[gym.id] = marker;

            // When marker is clicked
            marker.on('click', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SELECT_GYM',
                  gymId: gym.id
                }));
              }
              selectPin(gym.id);
            });
          });

          function selectPin(selectedId) {
            gyms.forEach(function(gym) {
              if (markers[gym.id]) {
                var isSelected = (gym.id === selectedId);
                var newIcon = L.divIcon({
                  html: createPinSvg(isSelected),
                  className: 'gym-marker-icon',
                  iconSize: isSelected ? [40, 50] : [34, 42],
                  iconAnchor: isSelected ? [20, 50] : [17, 42]
                });
                markers[gym.id].setIcon(newIcon);
                if (isSelected) {
                  map.panTo([gym.lat, gym.lng], { animate: true });
                }
              }
            });
          }

          window.focusGym = function(gymId) {
            selectPin(gymId);
          };
        </script>
      </body>
      </html>
    `;
  }, [filteredGyms]);

  // When user clicks a pin on the map
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_GYM' && data.gymId) {
        setSelectedGymId(data.gymId);
        // If sheet is minimized, bring to half state so card is visible!
        if (sheetState === 'minimized') {
          snapTo('half');
        }
        const index = filteredGyms.findIndex((g) => g.id === data.gymId);
        if (index >= 0) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: index * 340,
              animated: true,
            });
          }, 200);
        }
      }
    } catch (err) {
      // Ignore parse error
    }
  };

  const focusGymOnMap = (gym: GymItem) => {
    setSelectedGymId(gym.id);
    // Snap to minimized so map is completely full screen!
    snapTo('minimized');
    webViewRef.current?.injectJavaScript(
      `if (window.focusGym) { window.focusGym("${gym.id}"); } true;`
    );
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
            placeholder="Search gyms, yoga...."
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
          className={`ml-2 h-11 w-11 items-center justify-center rounded-full shadow-sm ${
            sortBy !== 'all' || onlyOpen ? 'border border-[#E23744] bg-[#FFEAEF]' : 'bg-[#FFEAEF]'
          }`}
          activeOpacity={0.8}>
          <Ionicons name="options-outline" size={20} color="#E23744" />
        </TouchableOpacity>
      </View>

      {/* 2. FULL MAP AREA (Extends full screen behind the sliding bottom sheet) */}
      <View className="flex-1 w-full overflow-hidden bg-[#F8F9FA]">
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          onMessage={handleWebViewMessage}
          style={{ flex: 1, backgroundColor: '#F8F9FA' }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
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
              {filteredGyms.length} Gym's in Near You
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
          {filteredGyms.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="fitness-outline" size={44} color="#D1D5DB" />
              <Text className="mt-2 font-medium text-sm text-gray-400">No gyms found</Text>
            </View>
          ) : (
            filteredGyms.map((gym) => (
              <GymCardItem
                key={gym.id}
                gym={gym}
                isFav={!!favorites[gym.id]}
                isSelected={selectedGymId === gym.id}
                onToggleFavorite={() => toggleFavorite(gym.id)}
                onFocusOnMap={() => focusGymOnMap(gym)}
              />
            ))
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
                  className={`mr-2 rounded-full border px-4 py-2 ${
                    sortBy === opt.value
                      ? 'border-[#E23744] bg-[#FFEAEF]'
                      : 'border-gray-200 bg-white'
                  }`}>
                  <Text
                    className={`font-semibold text-xs ${
                      sortBy === opt.value ? 'text-[#E23744]' : 'text-gray-700'
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
              className={`mb-6 flex-row items-center rounded-xl border p-3 ${
                onlyOpen ? 'border-[#E23744] bg-[#FFEAEF]' : 'border-gray-200 bg-white'
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
