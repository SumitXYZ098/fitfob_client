import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Container } from '@/components/modules/Container';
import { useAuthStore } from '@/store/useAuthStore';
import { checkUserStep } from '@/api/clientApi';
import { useGetFavorites, useClientSubscriptions } from '@/hook/useClient';
import { useQueryClient } from '@tanstack/react-query';
import { formatGymTitle, formatPersonName } from '@/components/GymCard';

interface MenuItem {
  id: string;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badge?: React.ReactNode;
  route?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logOut } = useAuthStore();
  const { data: favData } = useGetFavorites();
  const { data: subscriptionsData } = useClientSubscriptions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const favList = Array.isArray(favData)
    ? favData
    : Array.isArray(favData?.data)
      ? favData.data
      : Array.isArray(favData?.favorites)
        ? favData.favorites
        : [];
  const favCount = favList.length;

  const subscriptions = useMemo(() => {
    if (!subscriptionsData) return [];
    if (Array.isArray(subscriptionsData?.data)) return subscriptionsData.data;
    if (Array.isArray(subscriptionsData)) return subscriptionsData;
    return [];
  }, [subscriptionsData]);

  const activeSubscription = useMemo(() => {
    const active = subscriptions.find(
      (s: any) => (s.membershipStatus || '').toLowerCase() === 'active'
    );
    if (active) return active;

    const paused = subscriptions.find(
      (s: any) => (s.membershipStatus || '').toLowerCase() === 'paused'
    );
    if (paused) return paused;

    return subscriptions[0] || null;
  }, [subscriptions]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatPlanName = (plan?: string) => {
    if (!plan) return 'Membership Plan';
    const clean = plan.toLowerCase().replace(/_/g, ' ').trim();
    if (clean === 'twelve months' || clean === '12 months' || clean === 'annual') return '12 Months Plan';
    if (clean === 'six months' || clean === '6 months') return '6 Months Plan';
    if (clean === 'three months' || clean === '3 months') return '3 Months Plan';
    if (clean === 'monthly' || clean === '1 month' || clean === 'one month') return 'Monthly Plan';
    return (
      clean
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') + (clean.endsWith('plan') ? '' : ' Plan')
    );
  };

  useEffect(() => {
    const fetchLatestProfile = async () => {
      if (!user?.clientDetail?.name && !user?.name) {
        try {
          const res = await checkUserStep();
          if (res?.details?.name && user) {
            await setUser(
              {
                ...user,
                name: res.details.name,
                clientDetail: {
                  ...(user?.clientDetail || {}),
                  name: res.details.name,
                  phoneNumber: res.details.phoneNumber || user?.clientDetail?.phoneNumber,
                  email: res.details.email || user?.clientDetail?.email,
                  gender: res.details.gender || user?.clientDetail?.gender,
                  clientId: res.details.clientId || res.details.id || user?.clientDetail?.clientId,
                  selfieUrl: res.details.selfieUpload?.url || user?.clientDetail?.selfieUrl,
                },
              },
              true
            );
          }
        } catch (e) {
          console.log('Error refreshing profile in ProfileScreen:', e);
        }
      }
    };
    fetchLatestProfile();
  }, [setUser, user, user?.clientDetail?.name, user?.name]);

  const isDummyPhoneEmail = Boolean(
    user?.email && (
      user.email.endsWith('@phone.user') ||
      user.email.includes('phone.user') ||
      user.email.startsWith('+')
    )
  );

  const userPhone =
    user?.clientDetail?.phoneNumber ||
    user?.phoneNumber ||
    (isDummyPhoneEmail ? user?.email?.split('@')[0] : null) ||
    '';

  const displayContact = isDummyPhoneEmail ? userPhone : user?.email || userPhone || '';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logOut();
      queryClient.clear();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
      });
      router.replace('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'membership',
      title: 'Membership Plans',
      iconName: 'card-outline',
      route: '/(tabs)/membership',
    },
    {
      id: 'free-trials',
      title: 'Free Trials',
      iconName: 'ticket-outline',
      badge: (
        <View className="mr-2 h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-[#E23744]">
          <Text className="font-bold text-[11px] text-white">1</Text>
        </View>
      ),
      route: '/account/my-free-trials',
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      iconName: 'document-text-outline',
      badge: (
        <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-[#F6163C]">
          <Text className="font-bold text-[11px] text-white">5</Text>
        </View>
      ),
      route: '/(tabs)/transactions',
    },
    {
      id: 'visited-clubs',
      title: 'Visited Clubs',
      iconName: 'location-outline',
      badge: (
        <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-[#F6163C]">
          <Text className="font-bold text-[11px] text-white">5</Text>
        </View>
      ),
      route: '/(tabs)/transactions',
    },
    {
      id: 'id-verification',
      title: 'ID Verification',
      iconName: 'id-card-outline',
      badge: <Ionicons name="checkmark-circle" size={20} color="#10B981" className="mr-2" />,
      route: '/account/id-verification',
    },
    {
      id: 'favorites',
      title: 'Favorites',
      iconName: 'heart-outline',
      badge: favCount > 0 ? (
        <View className="mr-2 h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-[#E23744]">
          <Text className="font-bold text-[11px] text-white">{favCount}</Text>
        </View>
      ) : undefined,
      route: '/account/favorites',
    },
    {
      id: 'saved-cards',
      title: 'Saved Cards',
      iconName: 'wallet-outline',
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      iconName: 'help-circle-outline',
      route: '/support/help-support',
    },
  ];

  const handleItemPress = (item: MenuItem) => {
    if (item.route) {
      if (item.route.startsWith('/(tabs)')) {
        router.navigate(item.route as any);
      } else {
        router.push(item.route as any);
      }
    } else {
      Toast.show({
        type: 'info',
        text1: item.title,
        text2: 'This feature will be available soon.',
      });
    }
  };

  return (
    <Container>
      {/* 1. Header */}
      <View className="flex-row items-center justify-between pb-3 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-bold text-lg text-slate-800">Profile</Text>

        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingBottom: 16,
        }}>
        {/* Top Content: Profile Card & Menu Items */}
        <View>
          {/* 2. Top Profile Card */}
          <View className="my-4 overflow-hidden rounded-[28px] shadow-lg">
            <ImageBackground
              source={require('../../assets/images/Bg.png')}
              resizeMode="cover"
              className="p-5">
              {/* User Info Row */}
              <View className="flex-row items-center space-x-3.5">
                {/* Avatar with Edit Badge */}
                <View className="relative">
                  <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-white">
                    <Image
                      source={
                        user?.clientDetail?.selfieUrl
                          ? { uri: user.clientDetail.selfieUrl }
                          : require('../../assets/images/male.png')
                      }
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                </View>

                {/* Name & Email / Phone */}
                <View className="ml-3 flex-1 justify-center">
                  <View className="flex-row items-center">
                    <Text className="font-bold text-xl text-white">
                      {formatPersonName(
                        user?.clientDetail?.name ||
                        user?.name ||
                        user?.fullName ||
                        (user?.username &&
                          !user.username.includes('phone.user') &&
                          !user.username.startsWith('+')
                          ? user.username
                          : 'Member')
                      )}
                    </Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" className="ml-1.5" />
                  </View>
                  <Text className="font-regular mt-0.5 text-xs text-white/80">
                    {displayContact}
                  </Text>
                </View>
              </View>

              {/* Divider Line */}
              <View className="my-4 h-[1px] w-full bg-white/20" />

              {/* Bottom Pass Status Row */}
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/membership')}
                activeOpacity={0.85}
                className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="font-bold text-base text-white" numberOfLines={1}>
                    {activeSubscription?.clubName
                      ? formatGymTitle(activeSubscription.clubName)
                      : activeSubscription?.plan
                        ? formatPlanName(activeSubscription.plan)
                        : 'No Active Membership'}
                  </Text>
                  <Text className="mt-1 font-medium text-xs leading-tight text-white/80" numberOfLines={2}>
                    {activeSubscription
                      ? `${formatPlanName(activeSubscription.plan)}${activeSubscription.endDate
                        ? ` • Valid until ${formatDate(activeSubscription.endDate)}`
                        : ' • Unlimited Access'
                      }`
                      : 'Explore clubs and get unlimited gym access'}
                  </Text>
                </View>

                <View className="rounded-full bg-white px-3.5 py-1.5 shadow-sm">
                  <Text className="font-semibold text-xs text-slate-700">
                    {activeSubscription
                      ? (activeSubscription.membershipStatus
                        ? activeSubscription.membershipStatus.charAt(0).toUpperCase() +
                        activeSubscription.membershipStatus.slice(1).toLowerCase()
                        : 'Subscribed')
                      : 'Explore'}
                  </Text>
                </View>
              </TouchableOpacity>
            </ImageBackground>
          </View>

          {/* 3. Menu Items List */}
          <View className="mt-2 space-y-1">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item)}
                className="flex-row items-center justify-between border-b border-slate-100 px-1 py-3.5">
                <View className="flex-row items-center space-x-3.5">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#FFEAEF]">
                    <Ionicons name={item.iconName} size={20} color="#F6163C" />
                  </View>
                  <Text className="ml-3 font-semibold text-base text-slate-800">{item.title}</Text>
                </View>

                <View className="flex-row items-center">
                  {item.badge}
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Logout Button (Anchored to the very bottom of the screen) */}
        <View className="pt-6 pb-2">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoggingOut}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center rounded-2xl border border-slate-100 bg-[#F8FAFC] py-4 ${isLoggingOut ? 'opacity-60' : ''
              }`}>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#64748B" />
                <Text className="ml-2 font-bold text-base text-[#64748B]">Logout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}
