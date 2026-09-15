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

interface VisitOption {
  id: string;
  visits: number;
  title: string;
  price: number;
  formattedPrice: string;
  popular?: boolean;
  validityDays: number;
}

const VISIT_OPTIONS: VisitOption[] = [
  {
    id: '3-visits',
    visits: 3,
    title: '3 Visits',
    price: 999,
    formattedPrice: '₹999',
    validityDays: 15,
  },
  {
    id: '7-visits',
    visits: 7,
    title: '7 Visits',
    price: 2199,
    formattedPrice: '₹2,199',
    popular: true,
    validityDays: 30,
  },
  {
    id: '10-visits',
    visits: 10,
    title: '10 Visits',
    price: 2799,
    formattedPrice: '₹2,799',
    validityDays: 45,
  },
];

export default function SelectVisitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const passTier = (params.passTier as string) || 'premium';
  const passName = (params.passName as string) || 'Premium Pass';

  const [selectedVisitId, setSelectedVisitId] = useState<string>('7-visits');

  const selectedVisit =
    VISIT_OPTIONS.find((v) => v.id === selectedVisitId) || VISIT_OPTIONS[1];

  const handleContinue = () => {
    router.push({
      pathname: '/outdoorPass/review-outdoor-pass' as any,
      params: {
        passTier,
        passName,
        visits: selectedVisit.visits.toString(),
        validityDays: selectedVisit.validityDays.toString(),
        totalPrice: selectedVisit.price.toString(),
        location: 'Sector 71',
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

        <Text className="font-medium text-[16px] text-slate-800 tracking-tight">
          Visits
        </Text>

        <View className="w-8" />
      </View>
      <GradientDivider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 }}>
        {/* 2. Screen Title & Subtitle */}
        <View className="mb-5">
          <Text className="font-bold text-[22px] text-slate-900 tracking-tight">
            Select Number of Visits
          </Text>
          <Text className="mt-1 text-[13px] leading-5 text-slate-500">
            Choose the number of visits
          </Text>
        </View>

        {/* 3. Visit Options */}
        <View>
          {VISIT_OPTIONS.map((item) => {
            const isSelected = selectedVisitId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedVisitId(item.id)}
                activeOpacity={0.88}
                style={{
                  borderRadius: 16,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? '#E23744' : '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
                className="p-4 mb-4">
                {/* Header Row: Visits + Popular Badge + Price */}
                <View className="flex-row items-center justify-between pb-3">
                  <View className="flex-row items-center">
                    <Text className="font-semibold text-[16px] text-slate-900 mr-2.5">
                      {item.title}
                    </Text>
                    {item.popular && (
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
                    {item.formattedPrice}
                  </Text>
                </View>

                {/* Gradient Divider */}
                <GradientDivider />

                {/* Benefits */}
                <View className="pt-3">
                  <Text className="font-normal text-[12px] text-slate-500 mb-2.5">
                    You Get
                  </Text>

                  <View className="flex-row items-center">
                    <View className="h-4 w-4 items-center justify-center rounded-[4px] bg-rose-100/70 mr-2.5">
                      <Ionicons name="checkmark-done" size={11} color="#E23744" />
                    </View>
                    <Text className="font-normal text-[12.5px] text-slate-600 leading-4">
                      Valid for {item.validityDays} Days
                    </Text>
                  </View>
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
            onPress={handleContinue}
            activeOpacity={0.88}
            style={{ borderRadius: 13 }}
            className="w-full items-center justify-center bg-[#E23744] py-3.5">
            <Text className="font-bold text-[16px] text-white">Outdoor Pass</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
