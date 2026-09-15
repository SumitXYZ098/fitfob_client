import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Container } from '@/components/modules/Container';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  isUnread?: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Booked for Tomorrow Morning',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et...',
    date: '15 Oct 2024',
    time: '9:30 AM',
    isUnread: true,
  },
  {
    id: '2',
    title: 'Personal training sessions available!',
    description:
      'Engage with our certified trainers for personalized workouts tailored to your fitness goals. Experience...',
    date: '17 Oct 2024',
    time: '10:00 AM',
    isUnread: false,
  },
  {
    id: '3',
    title: 'Unlimited gyms with anywhere pass!',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et...',
    date: '15 Oct 2024',
    time: '9:30 AM',
    isUnread: false,
  },
  {
    id: '4',
    title: 'Nutrition counseling sessions offered!',
    description:
      'Transform your health with our nutrition experts who provide guidance on meal planning and healthy eat...',
    date: '21 Oct 2024',
    time: '1:00 PM',
    isUnread: false,
  },
  {
    id: '5',
    title: 'Group fitness classes every week!',
    description:
      'Join our vibrant community in various group classes ranging from yoga to high-intensity interval training...',
    date: '19 Oct 2024',
    time: '5:30 PM',
    isUnread: false,
  },
  {
    id: '6',
    title: 'Access to wellness workshops!',
    description:
      'Enhance your mind and body connection through workshops on stress management, meditation, an...',
    date: '18 Oct 2024',
    time: '4:00 PM',
    isUnread: false,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnread: false } : item))
    );
  };

  return (
    <Container>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between pb-3 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-bold text-lg text-slate-800">Notification</Text>

        <View className="w-10" />
      </View>

      {/* 2. Notifications List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F6163C']} />
        }>
        <View className="space-y-3">
          {notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => handleMarkAsRead(item.id)}
              className={`rounded-2xl p-4 transition-all ${
                item.isUnread ? 'bg-[#FFF0F2]' : 'bg-transparent'
              }`}>
              {/* Title Header with optional Red Dot */}
              <View className="flex-row items-center">
                {item.isUnread && (
                  <View className="mr-2.5 h-3 w-3 rounded-full bg-[#F6163C]" />
                )}
                <Text className="flex-1 font-bold text-base text-slate-800">
                  {item.title}
                </Text>
              </View>

              {/* Description Body */}
              <Text className="mt-1.5 font-regular text-sm leading-relaxed text-slate-500">
                {item.description}
              </Text>

              {/* Timestamp */}
              <Text className="mt-2.5 font-medium text-xs text-slate-400">
                {item.date} • {item.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}
