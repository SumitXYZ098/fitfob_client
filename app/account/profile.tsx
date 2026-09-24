import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Container } from '@/components/modules/Container';
import { useAuthStore } from '@/store/useAuthStore';

interface MenuItem {
  id: string;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badge?: React.ReactNode;
  route?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logOut } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logOut();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
      });
      router.replace('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
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
      router.push(item.route as any);
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
        contentContainerStyle={{ paddingBottom: 40 }}>
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
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full border border-[#FFEAEF] bg-white shadow-sm">
                  <Ionicons name="pencil" size={12} color="#F6163C" />
                </TouchableOpacity>
              </View>

              {/* Name & Email */}
              <View className="ml-3 flex-1 justify-center">
                <View className="flex-row items-center">
                  <Text className="font-bold text-xl text-white">
                    {user?.clientDetail?.name || user?.username || 'Alex Carter'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" className="ml-1.5" />
                </View>
                <Text className="font-regular mt-0.5 text-xs text-white/80">
                  {user?.email || 'alexcarter@gmail.com'}
                </Text>
              </View>
            </View>

            {/* Divider Line */}
            <View className="my-4 h-[1px] w-full bg-white/20" />

            {/* Bottom Pass Status Row */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-bold text-base text-white">Outdoor pass</Text>
                <Text className="mt-1 font-medium text-xs leading-tight text-white/80">
                  24–day unlimited access(Fair Usage Limit: 8 visits left)
                </Text>
              </View>

              <View className="rounded-full bg-white px-4 py-2 shadow-sm">
                <Text className="font-semibold text-xs text-slate-700">Subscribed</Text>
              </View>
            </View>
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

        {/* 4. Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          className="mb-6 mt-8 flex-row items-center justify-center rounded-2xl border border-slate-100 bg-[#F8FAFC] py-4">
          <Ionicons name="log-out-outline" size={20} color="#64748B" />
          <Text className="ml-2 font-bold text-base text-[#64748B]">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
}
