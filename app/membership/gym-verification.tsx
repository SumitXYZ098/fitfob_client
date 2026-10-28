import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

export default function GymVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const gymName = (params.gymName as string) || 'Anytime Fitness Gym';
  const location = (params.location as string) || 'Sector 71';
  const passId = (params.passId as string) || 'FF-7829-X';

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(passId);
    Toast.show({
      type: 'success',
      text1: 'Copied to Clipboard!',
      text2: `ID ${passId} copied`,
    });
  };

  const handleGoToCheckin = () => {
    router.replace('/(tabs)/scan' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-3 border-b border-slate-50">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center -ml-2"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-semibold text-[17px] text-slate-800 tracking-tight">
          Membership Verification
        </Text>

        <View className="w-8" />
      </View>

      {/* 2. Scrollable Center Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
          alignItems: 'center',
        }}>
        {/* 3D Fitness Girl & Man Duo Illustration */}
        <View className="items-center justify-center my-1">
          <Image
            source={require('@/assets/images/gym_verified_duo_3d.jpg')}
            style={{ width: 260, height: 260 }}
            resizeMode="contain"
            className="rounded-3xl"
          />
        </View>

        {/* Thank You & Active Status */}
        <Text className="font-bold text-[24px] text-slate-900 mt-2 tracking-tight text-center">
          Thank You!
        </Text>

        <View className="flex-row items-center gap-1.5 mt-1 bg-emerald-50 border border-emerald-200/80 rounded-full px-3.5 py-1">
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text className="font-semibold text-[13px] text-emerald-700">
            Your Membership is Active
          </Text>
        </View>

        <Text className="text-center font-normal text-[13px] text-slate-500 mt-2.5 leading-5 px-3">
          Show this pass or scan at the gym turnstile to verify your membership and start your workout.
        </Text>

        {/* Gym & Pass Details Card */}
        <View className="mt-5 w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <View className="flex-row items-center justify-between pb-2.5 border-b border-slate-200/60">
            <View className="flex-1 pr-2">
              <Text className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider">
                Gym Club
              </Text>
              <Text className="font-bold text-[14.5px] text-slate-800 mt-0.5" numberOfLines={1}>
                {gymName}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider">
                Location
              </Text>
              <Text className="font-medium text-[13.5px] text-slate-700 mt-0.5">
                {location}
              </Text>
            </View>
          </View>

          {/* Pass ID with Copy Button */}
          <View className="flex-row items-center justify-between pt-3">
            <View>
              <Text className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider">
                Pass ID
              </Text>
              <Text className="font-bold text-[15px] text-slate-900 mt-0.5">
                {passId}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCopyId}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-100 px-3 py-1.5">
              <Ionicons name="copy-outline" size={15} color="#E23744" />
              <Text className="font-semibold text-[12px] text-[#E23744]">Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 3. Sticky Bottom Action Button */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        className="border-t border-slate-100 bg-white px-5 pt-3 shadow-lg">
        <TouchableOpacity
          onPress={handleGoToCheckin}
          activeOpacity={0.88}
          style={{ borderRadius: 16 }}
          className="w-full items-center justify-center bg-[#E23744] py-3.5 shadow-sm shadow-[#E23744]/25">
          <Text className="font-bold text-[16px] text-white">
            Go to Checkin
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
