import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import CategoryPillItem, { CATEGORIES } from '@/components/CategoryPillItem';

interface GymItem {
  id: string;
  title: string;
  rating: string;
  amenities: string[];
  price: string;
  isOpen: boolean;
  isVerified: boolean;
  images: string[];
}

const GYM_DATA: GymItem[] = [
  {
    id: '1',
    title: 'Anytime Fitness Gym',
    rating: '4.5/5',
    amenities: ['AC', 'Wi-Fi', 'Trainers', 'SPA', 'Shower', 'Parking'],
    price: '₹1200/Monthly',
    isOpen: true,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
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
    images: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
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

  // Infinite forward loop: append first image at the end
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
        // Forward scroll to clone completes, set dot to 0 and silently reset position
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
              className={`h-1.5 rounded-full ${idx === activeIndex ? 'w-5 bg-[#E23744]' : 'w-1.5 bg-white/70'
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

export default function HomeScreen() {
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
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E23744']} />
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 90 : 70 }}>
        {/* 1. Header Bar */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          {/* Location selector */}
          <TouchableOpacity className="flex-row items-center space-x-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#FFEAEF]">
              <Ionicons name="location" size={20} color="#E23744" />
            </View>
            <Text className="ml-2 font-bold text-lg text-darkText">Chandigarh</Text>
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
            <TextInput
              placeholder="Search gyms, yoga...."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="font-regular flex-1 py-1 pr-2 text-base text-darkText"
            />
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-[#E23744]">
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
          {GYM_DATA.map((gym) => (
            <GymCard
              key={gym.id}
              gym={gym}
              isFav={!!favorites[gym.id]}
              onToggleFavorite={() => toggleFavorite(gym.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
