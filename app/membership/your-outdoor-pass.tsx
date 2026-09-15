import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';
import GradientDivider from '@/components/GradientDivider';

export default function YourOutdoorPassScreen() {
  const router = useRouter();
  const { activePass, togglePausePass } = useOutdoorPassStore();

  const gymName = 'Anytime Fitness Gym';
  const expiresOn = activePass?.expiresOn || '02/02/2026';
  const passId = activePass?.id || '123-456-789';
  const isPaused = activePass?.isPaused || false;

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(passId);
    Toast.show({
      type: 'success',
      text1: 'Copied to Clipboard!',
      text2: `ID ${passId} is ready to paste`,
    });
  };

  const handleTogglePause = () => {
    if (isPaused) {
      Alert.alert(
        'Resume Pass?',
        'Your membership will be reactivated immediately.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resume',
            onPress: () => {
              togglePausePass();
              Toast.show({
                type: 'info',
                text1: 'Membership Resumed',
                text2: 'Your membership is active again.',
              });
            },
          },
        ]
      );
    } else {
      router.push('/membership/pause-membership' as any);
    }
  };

  const benefits = [
    'ANY Fitness gym Sector 71',
    'Premium Membership',
    'Monthly',
    'Weekly',
    'Quarterly',
    'Annually',
    'Bi-Monthly',
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 1. Top Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center -ml-2"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-semibold text-[17px] text-slate-800 tracking-tight">
          Your Membership
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 120,
        }}>
        {/* 2. Top Red Membership Card with Organic Waves */}
        <View className="relative overflow-hidden rounded-[26px] bg-[#E23744] p-5 shadow-sm">
          {/* Decorative Waves Matching Reference */}
          <Svg
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 220,
              height: '100%',
            }}
            viewBox="0 0 220 180"
            preserveAspectRatio="none">
            <Path
              d="M 50,0 C 130,40 60,110 220,130 L 220,0 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
            <Path
              d="M 100,0 C 170,55 110,125 220,165 L 220,0 Z"
              fill="rgba(255, 255, 255, 0.12)"
            />
            <Path
              d="M 150,0 C 205,65 170,135 220,180 L 220,0 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
          </Svg>

          {/* Card Header: Gym Name, Expiry + Luxury Badge */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-bold text-[18px] text-white tracking-tight">
                {gymName}
              </Text>
              <Text className="mt-1 text-[12px] font-normal text-white/90">
                Expires on {expiresOn}
              </Text>
            </View>

            {/* Luxury Pill Badge */}
            <View className="flex-row items-center rounded-full bg-white px-3 py-1 shadow-xs">
              <Ionicons name="diamond" size={13} color="#E23744" />
              <Text className="ml-1.5 font-semibold text-[12px] text-[#E23744]">
                Luxury
              </Text>
            </View>
          </View>

          {/* White Pass ID Box with Copy Button */}
          <TouchableOpacity
            onPress={handleCopyId}
            activeOpacity={0.88}
            className="mt-5 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-xs">
            <Text className="font-medium text-[14.5px] text-slate-700">
              ID: {passId}
            </Text>

            <View className="flex-row items-center">
              {isPaused && (
                <View className="mr-2 rounded-full bg-amber-100 px-2 py-0.5">
                  <Text className="font-semibold text-[10px] text-amber-800">
                    PAUSED
                  </Text>
                </View>
              )}
              <Ionicons name="copy" size={18} color="#E23744" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. Luxury Membership Benefits Card */}
        <View className="mt-5 rounded-[24px] bg-[#F8FAFC] p-5 border border-slate-100">
          <Text className="font-bold text-[15px] text-slate-800 pb-3">
            Luxury Membership of your benefits
          </Text>

          <GradientDivider />

          <View className="pt-3.5">
            {benefits.map((benefit, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="h-5 w-5 items-center justify-center rounded-[6px] bg-[#DCFCE7] mr-3">
                  <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                </View>
                <Text className="font-normal text-[13.5px] text-slate-600">
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Pause / Resume Button */}
        <TouchableOpacity
          onPress={handleTogglePause}
          activeOpacity={0.8}
          style={{ borderRadius: 16 }}
          className="mt-5 w-full items-center justify-center border border-[#E23744] bg-white py-3.5">
          <Text className="font-bold text-[15px] text-[#E23744]">
            {isPaused ? 'Resume Pass' : 'Pause'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
