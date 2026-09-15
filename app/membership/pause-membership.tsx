import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';

export default function PauseMembershipScreen() {
  const router = useRouter();
  const { togglePausePass } = useOutdoorPassStore();

  const [startDate, setStartDate] = useState('Apr 26, 2025');
  const [endDate, setEndDate] = useState('May 26, 2025');

  const handlePause = () => {
    togglePausePass();
    Toast.show({
      type: 'success',
      text1: 'Membership Paused',
      text2: `Paused from ${startDate} to ${endDate}`,
    });
    router.back();
  };

  const handleGoToCancel = () => {
    router.push('/membership/cancel-membership' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center -ml-2"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-semibold text-[17px] text-slate-800 tracking-tight">
          Membership
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        }}>
        {/* 2. Main Pause Membership Card */}
        <View className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-xs">
          <Text className="font-bold text-[20px] text-slate-900 tracking-tight">
            Pause Membership
          </Text>
          <Text className="mt-1.5 text-[13px] leading-5 text-slate-500">
            Temporarily pause your membership without losing any benefits, then resume when you're ready.
          </Text>

          {/* Start Date */}
          <View className="mt-4">
            <Text className="font-medium text-[12px] text-slate-500 mb-1.5">
              Start Date
            </Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="e.g. Apr 26, 2025"
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800"
            />
          </View>

          {/* End Date */}
          <View className="mt-3.5">
            <Text className="font-medium text-[12px] text-slate-500 mb-1.5">
              End Date
            </Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="e.g. May 26, 2025"
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800"
            />
          </View>

          {/* Subtext info */}
          <View className="mt-3.5 items-center justify-center">
            <Text className="text-center text-[12px] text-slate-500 leading-4.5">
              Membership will resume on {endDate} Intro{'\n'}Payment due: $0
            </Text>
          </View>

          {/* Red Pause Membership Action Button */}
          <TouchableOpacity
            onPress={handlePause}
            activeOpacity={0.88}
            style={{ borderRadius: 16 }}
            className="mt-4 w-full items-center justify-center bg-[#E23744] py-3.5">
            <Text className="font-bold text-[15px] text-white">
              Pause Membership
            </Text>
          </TouchableOpacity>

          {/* Grey Cancel Membership Secondary Button */}
          <TouchableOpacity
            onPress={handleGoToCancel}
            activeOpacity={0.8}
            style={{ borderRadius: 16 }}
            className="mt-2.5 w-full items-center justify-center bg-slate-100 py-3.5">
            <Text className="font-semibold text-[15px] text-slate-700">
              Cancel Membership
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Tip Card */}
        <View className="mt-4 flex-row items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50 mr-3">
            <Ionicons name="bulb-outline" size={20} color="#E23744" />
          </View>
          <Text className="flex-1 text-[13px] text-slate-600 leading-4.5">
            <Text className="font-bold text-slate-900">TIP: </Text>
            You can pause for 7 to 90 day with no extra cost
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
