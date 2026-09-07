import React, { useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Container } from '@/components/modules/Container';
import { Button } from '@/components/modules/Button';
import { useAuthStore } from '@/store/useAuthStore';

export default function Congratulations() {
  const router = useRouter();
  const { user } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const cardSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  console.log(user)
  const displayName = user?.name || user?.username?.split('@')[0] || '';

  return (
    <Container>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="flex-1 items-center justify-center pt-2">
          {/* Top Success Badge */}
          <View className="mb-4 flex-row items-center rounded-full bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 shadow-sm">
            <View className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="font-bold text-xs uppercase tracking-wider text-emerald-700">
              Profile Verified • All Set!
            </Text>
          </View>

          {/* Celebration GIF with glowing circular backdrop */}
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }] }}
            className="relative mb-4 items-center justify-center">
            <View
              className="absolute h-48 w-48 rounded-full"
              style={{
                shadowColor: '#fff',
                shadowOpacity: 0.15,
                shadowRadius: 25,
                elevation: 6,
              }}
            />
            <Image
              source={require('../../assets/gif/congrat.gif')}
              style={{ width: 200, height: 170 }}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Heading */}
          <Text className="mb-2 text-center font-black text-3xl tracking-tight text-slate-900">
            Congratulations{displayName ? `, ${displayName}!` : '!'}
          </Text>

          <Text className="mb-6 px-4 text-center text-[15px] leading-relaxed text-slate-500">
            Your profile has been verified and your account is completely set up. You are ready to crush your fitness goals!
          </Text>

          {/* What's Next / Feature Unlock Cards */}
          <Animated.View
            style={{
              transform: [{ translateY: cardSlideAnim }],
              width: '100%',
            }}
            className="px-1">
            <View className="mb-4 rounded-3xl bg-slate-50/90 border border-slate-100 p-5 shadow-sm">
              <Text className="mb-3 font-bold text-xs uppercase tracking-wider text-slate-400">
                What's Unlocked For You
              </Text>

              {/* Feature 1 */}
              <View className="mb-3.5 flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
                  <MaterialCommunityIcons name="dumbbell" size={20} color="#F6163C" />
                </View>
                <View className="ml-3.5 flex-1">
                  <Text className="font-bold text-sm text-slate-900">Explore Nearby Gyms</Text>
                  <Text className="text-xs text-slate-500">
                    Access premium gyms and fitness studios around you
                  </Text>
                </View>
              </View>

              {/* Feature 2 */}
              <View className="mb-3.5 flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                  <Ionicons name="qr-code-outline" size={20} color="#10B981" />
                </View>
                <View className="ml-3.5 flex-1">
                  <Text className="font-bold text-sm text-slate-900">Instant QR Entry</Text>
                  <Text className="text-xs text-slate-500">
                    Scan your personal QR code for seamless contactless entry
                  </Text>
                </View>
              </View>

              {/* Feature 3 */}
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                  <Feather name="trending-up" size={19} color="#6366F1" />
                </View>
                <View className="ml-3.5 flex-1">
                  <Text className="font-bold text-sm text-slate-900">Track Workouts & History</Text>
                  <Text className="text-xs text-slate-500">
                    Monitor attendance, activity logs, and gym sessions
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Bottom CTA Area */}
        <View className="pt-2">
          <Button title="Explore FitFob 🚀" onPress={handleFinish} />
        </View>
      </ScrollView>
    </Container>
  );
}
