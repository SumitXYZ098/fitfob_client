import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';
import { useOutdoorMembershipPlans, OutdoorMembershipClub } from '@/hook/useClient';
import * as Location from 'expo-location';

export default function OutdoorPassScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const { activePass } = useOutdoorPassStore();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getLastKnownPositionAsync();
          if (loc) {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      } catch {}
    })();
  }, []);

  const { data: outdoorClubs, isLoading: isOutdoorLoading } = useOutdoorMembershipPlans({
    latitude: userLocation?.latitude,
    longitude: userLocation?.longitude,
  });

  // Smooth floating, breathing & gentle tilt animation so the 3D pass moves like a live GIF!
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatSequence = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: -12,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.04,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    floatSequence.start();

    return () => floatSequence.stop();
  }, [floatAnim, scaleAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '3deg'],
  });

  const activePassCount = activePass ? 1 : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]" edges={['top']}>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between border-b border-slate-100  px-5 py-3.5">
        <View>
          <Text className="font-extrabold text-2xl text-slate-900">Outdoor Pass</Text>
          <Text className="font-medium text-xs text-slate-500">
            Access outdoor gym turfs & park facilities
          </Text>
        </View>

        {/* Info Help Button */}
        <TouchableOpacity
          onPress={() => router.push('/support/help-support' as any)}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs"
          activeOpacity={0.7}>
          <Ionicons name="help-circle-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 2. Active / History Tab Switcher */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row rounded-2xl bg-slate-200/60 p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
              activeTab === 'active' ? 'bg-white shadow-xs' : ''
            }`}
            activeOpacity={0.8}>
            <Text
              className={`font-bold text-xs ${
                activeTab === 'active' ? 'text-slate-900' : 'text-slate-500'
              }`}>
              Active Passes ({activePassCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
              activeTab === 'history' ? 'bg-white shadow-xs' : ''
            }`}
            activeOpacity={0.8}>
            <Text
              className={`font-bold text-xs ${
                activeTab === 'history' ? 'text-slate-900' : 'text-slate-500'
              }`}>
              Expired & Used (0)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 20 }}>
        {/* If user has an active pass and selected 'active' tab, show their active pass card! */}
        {activeTab === 'active' && activePass ? (
          <View className="mt-4">
            <TouchableOpacity
              onPress={() => router.push('/membership/your-outdoor-pass' as any)}
              activeOpacity={0.9}
              className="relative overflow-hidden rounded-3xl bg-[#E23744] p-5 shadow-sm">
              <View className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10" />

              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="font-extrabold text-lg text-white">
                    {activePass.passName}
                  </Text>
                  <Text className="mt-1 font-medium text-xs text-white/80">
                    Expires on {activePass.expiresOn}
                  </Text>
                </View>

                <View className="flex-row items-center rounded-full bg-[#FEF3C7] px-2.5 py-1">
                  <Ionicons name="shield-checkmark" size={12} color="#B45309" />
                  <Text className="ml-1 font-bold text-[11px] text-[#B45309]">
                    {activePass.isPaused ? 'Paused' : 'Active'}
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
                <Text className="font-bold text-xs text-slate-800">
                  ID: {activePass.id}
                </Text>
                <View className="flex-row items-center">
                  <Text className="mr-1 font-bold text-xs text-[#E23744]">
                    View Pass
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#E23744" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Quick action to buy another pass */}
            <TouchableOpacity
              onPress={() => router.push('/outdoorPass/buy-outdoor-pass' as any)}
              activeOpacity={0.88}
              style={{ borderRadius: 13 }}
              className="mt-3 w-full flex-row items-center justify-center bg-rose-50 border border-rose-200 py-3">
              <Ionicons name="add-circle-outline" size={18} color="#E23744" />
              <Text className="ml-2 font-bold text-xs text-[#E23744]">
                Buy Another Outdoor Pass
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 3. Empty State Graphic Card (Animated Floating 3D Pass GIF Effect) */
          <View className="mt-4 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            {/* Floating Animated 3D Graphic */}
            <View className="items-center justify-center">
              <Animated.View
                style={{
                  transform: [
                    { translateY: floatAnim },
                    { scale: scaleAnim },
                    { rotate: spin },
                  ],
                }}>
                <Image
                  source={require('../../assets/images/empty-outdoor-pass.png')}
                  style={{ width: 235, height: 235 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            {/* Title & Description */}
            <Text className="text-center font-extrabold text-xl text-slate-900">
              {activeTab === 'active' ? 'No Active Passes' : 'No Pass History'}
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-slate-500 px-2">
              {activeTab === 'active'
                ? "You don't have any active outdoor gym passes right now. Grab a single-day or multi-day pass to access outdoor functional fitness arenas!"
                : 'You have not used any outdoor passes yet. When you buy or complete a session, it will show up here.'}
            </Text>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={() => router.push('/outdoorPass/buy-outdoor-pass' as any)}
              activeOpacity={0.88}
              style={{ borderRadius: 13 }}
              className="mt-6 w-full flex-row items-center justify-center bg-[#E23744] py-3.5">
              <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
              <Text className="ml-2 font-bold text-sm text-white">
                Explore Outdoor Passes
              </Text>
            </TouchableOpacity>

            {/* Secondary Map Navigation */}
            <TouchableOpacity
              onPress={() => router.push('/gym/Mapviewscreen' as any)}
              activeOpacity={0.7}
              className="mt-3 flex-row items-center justify-center py-1.5">
              <Ionicons name="map-outline" size={14} color="#E23744" />
              <Text className="ml-1.5 font-bold text-xs text-[#E23744]">
                View Outdoor Gyms on Map
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. How Outdoor Pass Works Section */}
        <View className="mt-6">
          <Text className="font-bold text-base text-slate-900">How Outdoor Pass Works</Text>

          <View className="mt-3">
            {[
              {
                step: '1',
                title: 'Pick Any Fitness Club',
                desc: 'Select from certified partner gyms offering outdoor workout turfs and crossfit floors.',
                icon: 'fitness-outline',
                color: '#E23744',
                bg: '#FFEAEF',
              },
              {
                step: '2',
                title: 'Instant 1-Tap Pass',
                desc: 'Buy a single workout day-pass without long subscriptions or hidden joining fees.',
                icon: 'flash-outline',
                color: '#F59E0B',
                bg: '#FEF3C7',
              },
              {
                step: '3',
                title: 'Scan QR & Sweat It Out',
                desc: 'Show your digital QR pass at the gate, scan via the Scan tab, and start your workout immediately!',
                icon: 'qr-code-outline',
                color: '#10B981',
                bg: '#D1FAE5',
              },
            ].map((item) => (
              <View
                key={item.step}
                className="flex-row items-start rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-xs mb-2.5">
                <View
                  style={{ backgroundColor: item.bg }}
                  className="h-10 w-10 items-center justify-center rounded-xl mr-3">
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-xs text-slate-800">{item.title}</Text>
                  <Text className="mt-0.5 text-[11px] leading-4 text-slate-500">{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Live Outdoor Clubs & Arenas Near You */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="font-extrabold text-base text-slate-900">Available Near You</Text>
              <Text className="text-[11px] font-medium text-slate-500">
                Partner fitness clubs accepting outdoor passes
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/gym/ViewAllScreen' as any)}>
              <Text className="font-bold text-xs text-[#E23744]">View All</Text>
            </TouchableOpacity>
          </View>

          {isOutdoorLoading ? (
            <View className="space-y-2.5">
              {[1, 2].map((_, i) => (
                <View
                  key={i}
                  className="flex-row items-center rounded-2xl border border-slate-200/60 bg-white p-3">
                  <View className="h-16 w-16 rounded-xl bg-slate-200 animate-pulse" />
                  <View className="ml-3 flex-1 space-y-1.5">
                    <View className="h-3.5 w-3/4 rounded bg-slate-200 animate-pulse" />
                    <View className="h-2.5 w-1/2 rounded bg-slate-100 animate-pulse" />
                    <View className="h-3 w-1/3 rounded bg-slate-200 animate-pulse" />
                  </View>
                </View>
              ))}
            </View>
          ) : outdoorClubs && outdoorClubs.length > 0 ? (
            <View className="space-y-2.5">
              {outdoorClubs.map((club: OutdoorMembershipClub, idx: number) => {
                const photoUrl =
                  club.club_photos?.[0]?.url ||
                  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop';
                const displayPhoto = photoUrl.startsWith('http')
                  ? photoUrl
                  : `${process.env.EXPO_PUBLIC_API_URL}${photoUrl}`;

                const activePlans = (club.membershipPlans || []).filter(
                  (p) => p.isActive === undefined || p.isActive === true
                );
                const lowestPrice =
                  activePlans.length > 0
                    ? Math.min(
                        ...activePlans.map((p) => {
                          const duration = p.monthDuration || 1;
                          return duration > 1 ? Math.round(p.price / duration) : p.price;
                        })
                      )
                    : 0;
                const priceLabel =
                  lowestPrice > 0 ? `From ₹${lowestPrice.toLocaleString('en-IN')}/mo` : 'Pass Available';

                return (
                  <TouchableOpacity
                    key={club.documentId || club.id || idx}
                    onPress={() =>
                      router.push({
                        pathname: '/gym/gym-detail' as any,
                        params: {
                          id: club.documentId || String(club.id),
                          initialTitle: club.clubName,
                          initialAddress: club.address || '',
                          initialCity: club.city || '',
                          initialImages: JSON.stringify(club.club_photos?.map((p) => p.url) || []),
                          initialAmenities: JSON.stringify([
                            ...(club.facilities || []),
                            ...(club.services || []),
                          ]),
                          initialLat: club.latitude?.toString(),
                          initialLng: club.longitude?.toString(),
                          initialMembershipPlans: JSON.stringify(club.membershipPlans || []),
                        },
                      })
                    }
                    activeOpacity={0.88}
                    className="flex-row items-center rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
                    <Image
                      source={{ uri: displayPhoto }}
                      className="h-16 w-16 rounded-xl bg-slate-100"
                      resizeMode="cover"
                    />
                    <View className="ml-3 flex-1 pr-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className="font-extrabold text-[13.5px] text-slate-900 flex-1 mr-1"
                          numberOfLines={1}>
                          {club.clubName}
                        </Text>
                        {club.distance !== undefined && club.distance !== null && (
                          <View className="flex-row items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5">
                            <Ionicons name="location-sharp" size={10} color="#E23744" />
                            <Text className="text-[10px] font-bold text-slate-600">
                              {typeof club.distance === 'number'
                                ? club.distance.toFixed(1)
                                : club.distance}{' '}
                              {club.distanceUnit || 'km'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text className="mt-0.5 text-[11px] text-slate-500" numberOfLines={1}>
                        {club.address || club.city || 'Verified Outdoor Partner Gym'}
                      </Text>

                      {/* Services Chips */}
                      {club.services && club.services.length > 0 && (
                        <View className="mt-1 flex-row flex-wrap gap-1">
                          {club.services.slice(0, 3).map((s, sIdx) => (
                            <View key={sIdx} className="rounded-md bg-slate-100 px-1.5 py-0.5">
                              <Text className="text-[9.5px] font-semibold text-slate-600">{s}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Price & Action */}
                      <View className="mt-1.5 flex-row items-center justify-between">
                        <Text className="font-bold text-xs text-[#E23744]">{priceLabel}</Text>
                        <View className="flex-row items-center">
                          <Text className="text-[11px] font-semibold text-slate-700 mr-0.5">
                            View Details
                          </Text>
                          <Ionicons name="chevron-forward" size={12} color="#E23744" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="rounded-2xl border border-slate-200 bg-white p-5 items-center">
              <Ionicons name="barbell-outline" size={32} color="#94A3B8" />
              <Text className="font-bold text-xs text-slate-700 mt-1">
                No Partner Clubs Near You
              </Text>
              <Text className="text-[11px] text-slate-400 text-center mt-0.5">
                New outdoor fitness arenas and clubs are joining daily!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
