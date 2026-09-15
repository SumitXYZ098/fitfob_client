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
import GradientDivider from '@/components/GradientDivider';

export default function ReviewAndBuyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const gymName = (params.gymName as string) || 'ANY Fitness gym Sector 71';
  const membershipTier = (params.membershipTier as string) || 'Premium Membership';
  const duration = (params.duration as string) || 'Monthly';
  const membershipPrice = parseFloat((params.membershipPrice as string) || '1899');

  const passTitle = (params.passTitle as string) || 'Premium Pass';
  const visits = (params.visits as string) || '7';
  const validityDays = (params.validityDays as string) || '15';
  const outdoorPassPrice = parseFloat((params.outdoorPassPrice as string) || '1399');

  const hasOutdoorPass = outdoorPassPrice > 0;
  const totalAmount = membershipPrice + outdoorPassPrice;

  const handlePayAndActivate = () => {
    router.push({
      pathname: '/membership/payment' as any,
      params: {
        totalAmount: totalAmount.toString(),
        gymName,
        membershipTier,
        passTitle,
        visits,
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
          Review & Buy
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 120,
        }}>
        {/* 2. Regular Membership Card */}
        <View className="rounded-[22px] bg-[#F8FAFC] p-5 border border-slate-100 shadow-xs mb-4">
          <Text className="font-bold text-[15px] text-slate-800 pb-3">
            Regular Membership
          </Text>

          <GradientDivider />

          <View className="pt-3.5 space-y-2.5">
            {[
              gymName,
              membershipTier,
              duration,
            ].map((item, idx) => (
              <View key={idx} className="flex-row items-center mb-2.5">
                <View className="h-4 w-4 items-center justify-center rounded-[4px] bg-[#DCFCE7] mr-2.5">
                  <Ionicons name="checkmark-done" size={11} color="#16A34A" />
                </View>
                <Text className="font-normal text-[13px] text-slate-700">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Outdoor Add-on Card (Shown if outdoor pass selected) */}
        {hasOutdoorPass && (
          <View className="rounded-[22px] bg-[#F8FAFC] p-5 border border-slate-100 shadow-xs mb-5">
            <Text className="font-bold text-[15px] text-slate-800 pb-3">
              Outdoor Add-on
            </Text>

            <GradientDivider />

            <View className="pt-3.5 space-y-2.5">
              {[
                passTitle,
                `${visits} Visits`,
                `Expires in ${validityDays} days`,
              ].map((item, idx) => (
                <View key={idx} className="flex-row items-center mb-2.5">
                  <View className="h-4 w-4 items-center justify-center rounded-[4px] bg-[#DCFCE7] mr-2.5">
                    <Ionicons name="checkmark-done" size={11} color="#16A34A" />
                  </View>
                  <Text className="font-normal text-[13px] text-slate-700">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 4. Pricing Breakdown Card */}
        <View className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-xs">
          <View className="flex-row items-center justify-between pb-2.5">
            <Text className="font-normal text-[13.5px] text-slate-600">
              Membership
            </Text>
            <Text className="font-medium text-[13.5px] text-slate-800">
              ₹{membershipPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {hasOutdoorPass && (
            <View className="flex-row items-center justify-between pb-3">
              <Text className="font-normal text-[13.5px] text-slate-600">
                Outdoor Pass
              </Text>
              <Text className="font-medium text-[13.5px] text-slate-800">
                ₹{outdoorPassPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          <GradientDivider />

          <View className="flex-row items-center justify-between pt-3">
            <Text className="font-bold text-[14.5px] text-slate-800">
              Total Amount
            </Text>
            <Text className="font-bold text-[16px] text-slate-900">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Action Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white">
        <GradientDivider />
        <View className="px-5 pt-3 pb-6">
          <TouchableOpacity
            onPress={handlePayAndActivate}
            activeOpacity={0.88}
            style={{ borderRadius: 14 }}
            className="w-full items-center justify-center bg-[#E23744] py-3.5">
            <Text className="font-bold text-[16px] text-white">
              Pay & Activate Membership
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
