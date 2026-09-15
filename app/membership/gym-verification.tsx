import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import Svg, { Rect, Path } from 'react-native-svg';

export default function GymVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const gymName = (params.gymName as string) || 'Any Fitness gym';
  const location = (params.location as string) || 'Sector 71';
  const passId = (params.passId as string) || '123-456-789';

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(passId);
    Toast.show({
      type: 'success',
      text1: 'Copied to Clipboard!',
      text2: `ID ${passId} copied`,
    });
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)');
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
          Membership Verification
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 10,
          paddingBottom: 40,
          alignItems: 'center',
        }}>
        {/* 2. Success Check Circle */}
        <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E23744] shadow-md shadow-[#E23744]/30 mt-2">
          <Ionicons name="checkmark" size={42} color="#FFFFFF" />
        </View>

        {/* 3. Thank You & Subtitles */}
        <Text className="font-bold text-[24px] text-[#10B981] mt-3 tracking-tight">
          Thank You!
        </Text>

        <Text className="font-medium text-[12.5px] text-slate-500 mt-0.5">
          Your Gym Membership is Active
        </Text>

        <Text className="text-center font-normal text-[13.5px] text-slate-500 mt-2 leading-5 px-3">
          Show this code at the gym reception to verify your membership.
        </Text>

        {/* 4. Styled QR Code with Red Accent Finder Eyes */}
        <View className="my-5 p-3 rounded-2xl bg-white shadow-xs border border-slate-100">
          <Svg width={200} height={200} viewBox="0 0 200 200">
            {/* Top-Left Finder Eye */}
            <Rect x={10} y={10} width={50} height={50} rx={14} fill="none" stroke="#1E293B" strokeWidth={8} />
            <Rect x={22} y={22} width={26} height={26} rx={7} fill="#E23744" />

            {/* Top-Right Finder Eye */}
            <Rect x={140} y={10} width={50} height={50} rx={14} fill="none" stroke="#1E293B" strokeWidth={8} />
            <Rect x={152} y={22} width={26} height={26} rx={7} fill="#E23744" />

            {/* Bottom-Left Finder Eye */}
            <Rect x={10} y={140} width={50} height={50} rx={14} fill="none" stroke="#1E293B" strokeWidth={8} />
            <Rect x={22} y={152} width={26} height={26} rx={7} fill="#E23744" />

            {/* Simulated Realistic QR Data Matrix Dots & Paths */}
            <Path
              d="
                M 70,15 H 85 V 30 H 70 Z
                M 95,15 H 115 V 25 H 95 Z
                M 125,20 H 132 V 45 H 125 Z
                M 70,38 H 90 V 46 H 70 Z
                M 100,35 H 115 V 55 H 100 Z
                M 70,55 H 80 V 70 H 70 Z
                M 88,58 H 105 V 66 H 88 Z
                M 15,70 H 30 V 85 H 15 Z
                M 38,70 H 55 V 78 H 38 Z
                M 70,78 H 85 V 95 H 70 Z
                M 92,75 H 115 V 85 H 92 Z
                M 125,70 H 145 V 82 H 125 Z
                M 155,70 H 180 V 78 H 155 Z
                M 15,95 H 35 V 105 H 15 Z
                M 42,90 H 60 V 110 H 42 Z
                M 70,105 H 82 V 125 H 70 Z
                M 90,95 H 110 V 105 H 90 Z
                M 118,92 H 135 V 110 H 118 Z
                M 145,90 H 160 V 100 H 145 Z
                M 170,90 H 185 V 110 H 170 Z
                M 15,115 H 30 V 130 H 15 Z
                M 38,118 H 58 V 126 H 38 Z
                M 90,115 H 105 V 135 H 90 Z
                M 112,120 H 130 V 128 H 112 Z
                M 140,115 H 155 V 135 H 140 Z
                M 165,118 H 185 V 128 H 165 Z
                M 70,140 H 85 V 155 H 70 Z
                M 95,145 H 115 V 155 H 95 Z
                M 125,140 H 135 V 160 H 125 Z
                M 70,165 H 90 V 175 H 70 Z
                M 100,165 H 120 V 185 H 100 Z
                M 130,168 H 145 V 185 H 130 Z
                M 155,145 H 175 V 155 H 155 Z
                M 160,165 H 180 V 175 H 160 Z
                M 150,178 H 165 V 188 H 150 Z
                M 172,180 H 185 V 190 H 172 Z
              "
              fill="#1E293B"
            />
          </Svg>
        </View>

        {/* Location & Gym Name */}
        <Text className="font-medium text-[13.5px] text-slate-600">
          {location}, {gymName}
        </Text>

        {/* 5. Use your ID Box */}
        <View className="mt-5 w-full">
          <Text className="font-medium text-[12px] text-slate-500 mb-1.5 pl-1">
            Use your ID
          </Text>

          <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-3 px-4 shadow-xs">
            <Text className="font-medium text-[14.5px] text-slate-700">
              ID: {passId}
            </Text>

            <TouchableOpacity
              onPress={handleCopyId}
              activeOpacity={0.7}
              className="h-9 w-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
              <Ionicons name="copy" size={16} color="#E23744" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Back to Home Action Button */}
        <TouchableOpacity
          onPress={handleBackToHome}
          activeOpacity={0.88}
          style={{ borderRadius: 16 }}
          className="mt-6 w-full items-center justify-center bg-[#E23744] py-3.5 shadow-sm shadow-[#E23744]/25">
          <Text className="font-bold text-[16px] text-white">
            Back to Home
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
