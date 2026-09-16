import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Polygon, Line, Circle } from 'react-native-svg';
import CategoryPillItem, { CATEGORIES } from '@/components/CategoryPillItem';

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
  coordinate?: { latitude: number; longitude: number };
}

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

function GymCard({
  gym,
  isFav,
  onToggleFavorite,
}: {
  gym: GymItem;
  isFav: boolean;
  onToggleFavorite: () => void;
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
    <View className="mb-5 overflow-hidden rounded-3xl border border-[#F3F4F6] bg-white shadow-sm">
      {/* Image Carousel & Badges */}
      <View className="relative h-60 w-full bg-gray-200">
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
                style={{ width: cardWidth, height: 240 }}
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
          <Text className="mr-2 flex-1 font-bold text-lg text-darkText">{gym.title}</Text>
          <View className="flex-row items-center space-x-1">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text className="ml-1 font-medium text-xs text-secondaryText">{gym.rating}</Text>
          </View>
        </View>

        {/* Amenities */}
        <Text className="font-regular mt-1.5 text-sm text-secondaryText">
          {gym.amenities.map((item) => `• ${item}`).join('  ')}
        </Text>

        {/* Pricing */}
        <Text className="mt-2 font-bold text-base text-darkText">{gym.price}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ViewAllScreen() {
  const router = useRouter();
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
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'all'>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter and sort gyms
  const filteredGyms = ALL_GYMS.filter((gym) => {
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

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]" edges={['top']}>
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
          className={`flex-row items-center rounded-full border px-4 py-1.5 shadow-sm ${
            sortBy !== 'all' || onlyOpen ? 'border-[#E23744] bg-[#FFEAEF]' : 'border-[#E5E7EB] bg-white'
          }`}>
          <Ionicons name="options-outline" size={16} color="#E23744" />
          <Text className="ml-1.5 font-semibold text-sm text-darkText">Filter</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Content: Gym List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 110,
        }}>
        {filteredGyms.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="fitness-outline" size={48} color="#D1D5DB" />
            <Text className="mt-3 font-semibold text-base text-gray-500">
              No gyms found matching your criteria
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('Gyms');
                setSortBy('all');
                setOnlyOpen(false);
              }}
              className="mt-4 rounded-full bg-[#E23744] px-5 py-2">
              <Text className="font-semibold text-sm text-white">Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredGyms.map((gym) => (
            <GymCard
              key={gym.id}
              gym={gym}
              isFav={!!favorites[gym.id]}
              onToggleFavorite={() => toggleFavorite(gym.id)}
            />
          ))
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
