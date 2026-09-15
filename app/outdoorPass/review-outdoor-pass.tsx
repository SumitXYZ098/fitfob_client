import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';
import GradientDivider from '@/components/GradientDivider';

export default function ReviewOutdoorPassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setActivePass = useOutdoorPassStore((state) => state.setActivePass);

  const passTier = (params.passTier as string) || 'premium';
  const passName = (params.passName as string) || 'Premium Pass';
  const visits = parseInt((params.visits as string) || '7', 10);
  const validityDays = parseInt((params.validityDays as string) || '30', 10);
  const totalPrice = parseFloat((params.totalPrice as string) || '2199');
  const location = (params.location as string) || 'Sector 71';

  const [isProcessing, setIsProcessing] = useState(false);

  // Compute expiry date string
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validityDays);
  const formattedExpiry = `${String(expiryDate.getDate()).padStart(2, '0')}/${String(
    expiryDate.getMonth() + 1
  ).padStart(2, '0')}/${expiryDate.getFullYear()}`;

  const handlePayAndActivate = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      // Save pass into store
      setActivePass({
        id: '123-456-789',
        passName: `${passTier.charAt(0).toUpperCase() + passTier.slice(1)} Outdoor Pass`,
        tierId: (passTier as any) || 'premium',
        visits,
        totalVisits: visits,
        expiresOn: formattedExpiry,
        price: totalPrice,
        location,
        isPaused: false,
        purchasedAt: new Date().toISOString(),
      });

      Toast.show({
        type: 'success',
        text1: 'Pass Activated Successfully! 🎉',
        text2: `${visits} Visits Outdoor Pass is active until ${formattedExpiry}`,
      });

      router.replace('/membership/your-outdoor-pass' as any);
    }, 1200);
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

        <Text className="font-medium text-[16px] text-slate-800 tracking-tight">
          Review & Pay
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130 }}>
        {/* 2. Top Summary Card */}
        <View className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
          <Text className="font-bold text-base text-slate-900 pb-3">
            Outdoor Pass
          </Text>
          <GradientDivider />

          <View className="pt-3.5 space-y-2.5">
            {/* Tier */}
            <View className="flex-row items-center mb-2">
              <View className="h-4 w-4 items-center justify-center rounded-sm bg-rose-100/70 mr-2.5">
                <Ionicons name="checkmark-done" size={11} color="#E23744" />
              </View>
              <Text className="font-normal text-[14px]  text-slate-700">
                {passName}
              </Text>
            </View>

            {/* Visits & Location */}
            <View className="flex-row items-center mb-2">
              <View className="h-4 w-4 items-center justify-center rounded-sm bg-rose-100/70 mr-2.5">
                <Ionicons name="checkmark-done" size={11} color="#E23744" />
              </View>
              <Text className="font-normal text-[14px] text-slate-700">
                {visits} Visits- {location}
              </Text>
            </View>

            {/* Access tier */}
            <View className="flex-row items-center mb-2">
              <View className="h-4 w-4 items-center justify-center rounded-sm bg-rose-100/70 mr-2.5">
                <Ionicons name="checkmark-done" size={11} color="#E23744" />
              </View>
              <Text className="font-normal text-[14px]  text-slate-700">
                Basic Pass
              </Text>
            </View>

            {/* Validity */}
            <View className="flex-row items-center mb-1">
              <View className="h-4 w-4 items-center justify-center rounded-sm bg-rose-100/70 mr-2.5">
                <Ionicons name="checkmark-done" size={11} color="#E23744" />
              </View>
              <Text className="font-normal text-[14px]  text-slate-700">
                Expires in {validityDays} days
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Pricing Breakdown Card */}
        <View className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <Text className="font-normal text-[14px]  text-slate-600">Outdoor Pass</Text>
            <Text className="font-medium text-[14px]  text-slate-800">
              ₹{totalPrice.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between pt-3">
            <Text className="font-bold text-[14px]  text-slate-800">Total Amount</Text>
            <Text className="font-bold text-[14px]  text-slate-900">
              ₹{totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 4. Bottom Pay Button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-5 py-4">
        <TouchableOpacity
          onPress={handlePayAndActivate}
          disabled={isProcessing}
          activeOpacity={0.88}
          style={{ borderRadius: 13 }}
          className="w-full flex-row items-center justify-center bg-[#E23744] py-3.5">
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="font-bold text-base text-white">
              Pay & Activate Pass
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
