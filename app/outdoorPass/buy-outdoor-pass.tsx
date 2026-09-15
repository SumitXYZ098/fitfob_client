import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GradientDivider from '@/components/GradientDivider';

interface PassOption {
  id: 'basic' | 'premium' | 'luxury';
  title: string;
  price: number;
  formattedPrice: string;
  popular?: boolean;
  benefits: string[];
}

const PASS_OPTIONS: PassOption[] = [
  {
    id: 'basic',
    title: 'Basic Pass',
    price: 399,
    formattedPrice: '₹399',
    benefits: [
      'Access to selected local gyms',
      'Perfect for occasional workouts',
    ],
  },
  {
    id: 'premium',
    title: 'Premium Pass',
    price: 1599,
    formattedPrice: '₹1,599',
    popular: true,
    benefits: [
      'Wider access to multiple partner gyms',
      'Priority check-in & support',
      'Weekend outdoor pass included',
    ],
  },
  {
    id: 'luxury',
    title: 'Luxury Pass',
    price: 2999,
    formattedPrice: '₹2,999',
    benefits: [
      'Access to elite club gyms & outdoor arenas',
      'Unlimited access premium fitness spaces',
      'Best for daily training & priority experience',
    ],
  },
];

export default function BuyOutdoorPassScreen() {
  const router = useRouter();
  const { gymName, gymAddress, gymImage, gymRating } = useLocalSearchParams<{
    gymName?: string;
    gymAddress?: string;
    gymImage?: string;
    gymRating?: string;
  }>();
  const [selectedPassId, setSelectedPassId] = useState<'basic' | 'premium' | 'luxury'>('premium');

  const selectedPass = PASS_OPTIONS.find((p) => p.id === selectedPassId) || PASS_OPTIONS[1];

  const handleNext = () => {
    router.push({
      pathname: '/outdoorPass/select-visits' as any,
      params: {
        gymName,
        gymAddress,
        gymImage,
        gymRating,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900">Outdoor Gym Pass</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/account/notifications' as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/account/profile' as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="person-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>
      <GradientDivider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 120,
        }}>
        {/* 2. Screen Title & Subtitle */}
        <View className="mb-5">
          <Text className="font-bold text-[22px] text-slate-900 tracking-tight">
            Choose Outdoor Pass
          </Text>
          <Text className="mt-1 text-[13px] leading-5 text-slate-500">
            Access any partner gym without a membership Flexible Visit-based pass
          </Text>
        </View>

        {/* 3. Pass Option Cards */}
        <View>
          {PASS_OPTIONS.map((pass) => {
            const isSelected = selectedPassId === pass.id;

            return (
              <TouchableOpacity
                key={pass.id}
                onPress={() => setSelectedPassId(pass.id)}
                activeOpacity={0.88}
                style={{
                  borderRadius: 16,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? '#E23744' : '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
                className="p-4 mb-4">
                {/* Header Row: Title + Popular Badge + Price */}
                <View className="flex-row items-center justify-between pb-3">
                  <View className="flex-row items-center">
                    <Text className="font-semibold text-[16px] text-slate-900 mr-2.5">
                      {pass.title}
                    </Text>
                    {pass.popular && (
                      <View className="rounded-full bg-rose-50 px-2.5 py-0.5">
                        <Text className="font-medium text-[11px] text-[#E23744]">
                          Popular
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    className={`font-semibold text-[17px] ${
                      isSelected ? 'text-[#E23744]' : 'text-slate-600'
                    }`}>
                    {pass.formattedPrice}
                  </Text>
                </View>

                {/* Gradient Divider */}
                <GradientDivider />

                {/* Benefits Section */}
                <View className="pt-3">
                  <Text className="font-normal text-[12px] text-slate-500 mb-2.5">
                    You Get
                  </Text>

                  {pass.benefits.map((benefit, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      {/* Double pink check icon badge squircle */}
                      <View className="h-4 w-4 items-center justify-center rounded-[4px] bg-rose-100/70 mr-2.5">
                        <Ionicons name="checkmark-done" size={11} color="#E23744" />
                      </View>
                      <Text className="flex-1 font-normal text-[12.5px] text-slate-600 leading-4">
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 4. Bottom Sticky Action Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white">
        <GradientDivider />
        <View className="px-5 pt-3 pb-6">
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.88}
            style={{ borderRadius: 13 }}
            className="w-full items-center justify-center bg-[#E23744] py-3.5">
            <Text className="font-bold text-[16px] text-white">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
