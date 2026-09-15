import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GradientDivider from '@/components/GradientDivider';

type DurationTab = 'monthly' | '3months' | '6months' | 'annual';

interface MembershipPlan {
  id: string;
  title: string;
  popular?: boolean;
  monthlyPrice: number;
  benefits: string[];
}

const PLANS: MembershipPlan[] = [
  {
    id: 'basic',
    title: 'Basic Membership',
    popular: true,
    monthlyPrice: 999,
    benefits: [
      'Access to selected local gyms',
      'Perfect for occasional workouts',
      'Standard locker access',
    ],
  },
  {
    id: 'premium',
    title: 'Premium Membership',
    monthlyPrice: 1299,
    benefits: [
      'Wider access to multiple partner gyms',
      'Ideal for regular workouts',
      'Free group fitness classes',
    ],
  },
  {
    id: 'luxury',
    title: 'Luxury Membership',
    monthlyPrice: 1899,
    benefits: [
      'Unlimited access premium fitness spaces',
      'Best for daily training & priority experience',
      'Complimentary personal trainer session',
    ],
  },
];

export default function BuyMembershipScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const gymName = (params.gymName as string) || 'Anytime Fitness Gym';
  const [selectedDuration, setSelectedDuration] = useState<DurationTab>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('basic');
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);

  const durationMultiplier: Record<DurationTab, number> = {
    monthly: 1,
    '3months': 0.95,
    '6months': 0.9,
    annual: 0.8,
  };

  const getFormattedPrice = (baseMonthly: number) => {
    const adjusted = Math.round(baseMonthly * durationMultiplier[selectedDuration]);
    return `₹${adjusted.toLocaleString('en-IN')}`;
  };

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];

  const handleContinue = () => {
    setIsAddOnModalOpen(true);
  };

  const handleAddOutdoorPass = () => {
    setIsAddOnModalOpen(false);
    router.push({
      pathname: '/membership/select-outdoor-pass' as any,
      params: {
        gymName,
        membershipTier: selectedPlan.title,
        membershipPrice: selectedPlan.monthlyPrice.toString(),
      },
    });
  };

  const handleSkipAddOn = () => {
    setIsAddOnModalOpen(false);
    router.push({
      pathname: '/membership/review-and-buy' as any,
      params: {
        gymName,
        membershipTier: selectedPlan.title,
        membershipPrice: selectedPlan.monthlyPrice.toString(),
        passTitle: 'None',
        visits: '0',
        outdoorPassPrice: '0',
        validityDays: '0',
      },
    });
  };

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
          Membership
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 120,
        }}>
        {/* 2. Gym Name & Subtitle */}
        <View className="mb-4">
          <Text className="font-bold text-[22px] text-slate-900 tracking-tight">
            {gymName}
          </Text>
          <Text className="mt-1 text-[13px] text-slate-500">
            You are buying membership for this gym
          </Text>
        </View>

        {/* 3. Duration Segment Bar */}
        <View className="flex-row rounded-xl bg-slate-100 p-1 mb-5">
          {(
            [
              { id: 'monthly', label: 'Monthly' },
              { id: '3months', label: '3 Months' },
              { id: '6months', label: '6 Months' },
              { id: 'annual', label: 'Annual' },
            ] as const
          ).map((tab) => {
            const isActive = selectedDuration === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedDuration(tab.id)}
                activeOpacity={0.8}
                className={`flex-1 items-center justify-center py-2 rounded-lg ${
                  isActive ? 'bg-white shadow-xs' : ''
                }`}>
                <Text
                  className={`text-[12.5px] ${
                    isActive
                      ? 'font-semibold text-slate-800'
                      : 'font-medium text-slate-500'
                  }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Plan Option Cards */}
        <View>
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const priceStr = getFormattedPrice(plan.monthlyPrice);

            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
                activeOpacity={0.88}
                style={{
                  borderRadius: 16,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? '#E23744' : '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
                className="p-4 mb-4 shadow-xs">
                {/* Plan Header: Title + Popular Badge + Price */}
                <View className="flex-row items-center justify-between pb-3">
                  <View className="flex-row items-center">
                    <Text className="font-semibold text-[16px] text-slate-900 mr-2.5">
                      {plan.title}
                    </Text>
                    {plan.popular && (
                      <View className="rounded-full bg-rose-50 px-2.5 py-0.5">
                        <Text className="font-medium text-[11px] text-[#E23744]">
                          Popular
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-baseline">
                    <Text
                      className={`font-bold text-[18px] ${
                        isSelected ? 'text-[#E23744]' : 'text-slate-800'
                      }`}>
                      {priceStr}
                    </Text>
                    <Text className="text-[12px] text-slate-400 font-normal ml-0.5">
                      /m
                    </Text>
                  </View>
                </View>

                {/* Subtle Gradient Divider */}
                <GradientDivider />

                {/* Benefits Section */}
                <View className="pt-3">
                  <Text className="font-normal text-[12px] text-slate-500 mb-2.5">
                    You Get
                  </Text>

                  {plan.benefits.map((benefit, index) => (
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
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Action Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white">
        <GradientDivider />
        <View className="px-5 pt-3 pb-6">
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.88}
            style={{ borderRadius: 14 }}
            className="w-full items-center justify-center bg-[#E23744] py-3.5">
            <Text className="font-bold text-[16px] text-white">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Add-on Outdoor Pass Bottom Sheet Modal */}
      <Modal
        visible={isAddOnModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddOnModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsAddOnModalOpen(false)}
            className="flex-1"
          />
          <View className="rounded-t-[32px] bg-white px-6 pt-4 pb-8 shadow-2xl">
            {/* Modal Drag Handle */}
            <View className="mb-3 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-300" />
            </View>

            {/* Header Text */}
            <Text className="text-center text-[12.5px] font-medium text-slate-600">
              Add-on Outdoor Pass
            </Text>

            {/* Big Title */}
            <Text className="text-center font-bold text-[20px] text-slate-900 mt-2">
              Add an outdoor Pass?
            </Text>

            {/* Description */}
            <Text className="text-center text-[13px] text-slate-500 leading-5 mt-1.5 px-3">
              Train at other gyms from ₹399 while keeping your main membership at{' '}
              <Text className="font-semibold text-slate-800">{gymName}</Text>
            </Text>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handleAddOutdoorPass}
              activeOpacity={0.88}
              style={{ borderRadius: 16 }}
              className="mt-6 w-full items-center justify-center bg-[#E23744] py-3.5">
              <Text className="font-bold text-[15px] text-white">
                Yes, Add Outdoor Pass
              </Text>
            </TouchableOpacity>

            {/* Skip Action Button */}
            <TouchableOpacity
              onPress={handleSkipAddOn}
              activeOpacity={0.8}
              style={{ borderRadius: 16 }}
              className="mt-3 w-full items-center justify-center bg-slate-100 py-3.5">
              <Text className="font-semibold text-[15px] text-slate-700">
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
