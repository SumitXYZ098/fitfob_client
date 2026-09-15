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
  id: string;
  title: string;
  price: number;
  popular?: boolean;
  benefits: string[];
}

const PASS_OPTIONS: PassOption[] = [
  {
    id: 'basic',
    title: 'Basic Pass',
    price: 399,
    benefits: [
      'Access to selected local gyms',
      'Perfect for occasional workouts',
    ],
  },
  {
    id: 'premium',
    title: 'Premium Pass',
    popular: true,
    price: 699,
    benefits: [
      'Wider access to multiple partner gyms',
      'Ideal for regular workouts',
    ],
  },
  {
    id: 'luxury',
    title: 'Luxury Pass',
    price: 1199,
    benefits: [
      'Unlimited access premium fitness spaces',
      'Best for daily training & priority experience',
    ],
  },
];

const VISIT_CHOICES = [
  { visits: 3, label: '3 Visits', multiplier: 1 },
  { visits: 7, label: '7 Visits', multiplier: 2.1 },
  { visits: 10, label: '10 Visits', multiplier: 2.9 },
];

export default function SelectOutdoorPassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const gymName = (params.gymName as string) || 'Anytime Fitness Gym';
  const membershipTier = (params.membershipTier as string) || 'Premium Membership';
  const membershipPrice = parseFloat((params.membershipPrice as string) || '1899');

  const [selectedPassId, setSelectedPassId] = useState<string>('basic');
  const [selectedVisits, setSelectedVisits] = useState<number>(3);

  const selectedPass =
    PASS_OPTIONS.find((p) => p.id === selectedPassId) || PASS_OPTIONS[0];
  const visitChoice =
    VISIT_CHOICES.find((v) => v.visits === selectedVisits) || VISIT_CHOICES[0];

  const outdoorPassPrice = Math.round(selectedPass.price * visitChoice.multiplier);

  const handleContinue = () => {
    router.push({
      pathname: '/membership/review-and-buy' as any,
      params: {
        gymName,
        membershipTier,
        membershipPrice: membershipPrice.toString(),
        passTitle: selectedPass.title,
        visits: selectedVisits.toString(),
        outdoorPassPrice: outdoorPassPrice.toString(),
        validityDays: selectedVisits === 3 ? '15' : selectedVisits === 7 ? '30' : '45',
      },
    });
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
          Select outdoor Pass
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 130,
        }}>
        {/* 2. Pass Option Cards */}
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
              className="p-4 mb-4 shadow-xs">
              {/* Card Header: Title + Popular Badge + Price */}
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
                  className={`font-bold text-[18px] ${
                    isSelected ? 'text-[#E23744]' : 'text-slate-700'
                  }`}>
                  ₹{pass.price}
                </Text>
              </View>

              {/* Fading Gradient Divider */}
              <GradientDivider />

              {/* Benefits */}
              <View className="pt-3">
                <Text className="font-normal text-[12px] text-slate-500 mb-2.5">
                  You Get
                </Text>

                {pass.benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <View className="h-4 w-4 items-center justify-center rounded-[4px] bg-[#DCFCE7] mr-2.5">
                      <Ionicons name="checkmark-done" size={11} color="#16A34A" />
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

        {/* 3. Visits Selector (3 / 7 / 10 Visits) */}
        <View className="mt-2 flex-row gap-3">
          {VISIT_CHOICES.map((choice) => {
            const isVisitsSelected = selectedVisits === choice.visits;
            return (
              <TouchableOpacity
                key={choice.visits}
                onPress={() => setSelectedVisits(choice.visits)}
                activeOpacity={0.8}
                style={{
                  borderRadius: 14,
                  borderWidth: isVisitsSelected ? 1.5 : 1,
                  borderColor: isVisitsSelected ? '#E23744' : '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
                className="flex-1 items-center justify-center py-3.5 shadow-xs">
                <Text
                  className={`font-semibold text-[14px] ${
                    isVisitsSelected ? 'text-[#E23744]' : 'text-slate-700'
                  }`}>
                  {choice.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 4. Sticky Bottom Action Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white">
        <GradientDivider />
        <View className="px-5 pt-3 pb-6">
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.88}
            style={{ borderRadius: 14 }}
            className="w-full items-center justify-center bg-[#E23744] py-3.5">
            <Text className="font-bold text-[16px] text-white">
              Outdoor Pass: ₹{outdoorPassPrice.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
