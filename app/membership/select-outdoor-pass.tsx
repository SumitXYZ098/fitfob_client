import React, { useState, useMemo, useEffect } from 'react';
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
import GradientDivider from '@/components/GradientDivider';
import { useOutdoorMembershipPlans } from '@/hook/useClient';

interface PassOption {
  id: string;
  documentId?: string;
  title: string;
  price: number;
  visitAllowed: number;
  popular?: boolean;
  benefits: string[];
  _sortOrder?: number;
}

export default function SelectOutdoorPassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const gymName = (params.gymName as string) || 'Anytime Fitness Gym';
  const membershipTier = (params.membershipTier as string) || 'Premium Membership';
  const duration = (params.duration as string) || 'Monthly';
  const membershipPrice = parseFloat((params.membershipPrice as string) || '1899');
  const planDocumentId = (params.planDocumentId as string) || '';

  // Fetch outdoor membership plans directly from API /api/outdoor-membership-plans
  const { data: plansData, isLoading, isError, refetch } = useOutdoorMembershipPlans();

  useEffect(() => {
    console.log('📡 [select-outdoor-pass] Status => isLoading:', isLoading, '| isError:', isError);
    if (plansData !== undefined) {
      console.log('📦 [select-outdoor-pass] plansData from useOutdoorMembershipPlans():', JSON.stringify(plansData, null, 2));
    }
  }, [plansData, isLoading, isError]);

  // Dynamically map API response to pass options
  const passOptions = useMemo<PassOption[]>(() => {
    if (!plansData) return [];

    const rawList = Array.isArray(plansData) ? plansData : [];
    const rawPlans: any[] = [];

    rawList.forEach((item: any) => {
      if (!item) return;
      if (item.planName !== undefined || item.price !== undefined) {
        // Direct OutdoorPlanItem
        rawPlans.push(item);
      } else if (Array.isArray(item.membershipPlans)) {
        // Club containing membershipPlans
        item.membershipPlans.forEach((p: any) => {
          if (p) rawPlans.push(p);
        });
      }
    });

    // Deduplicate by documentId or planName+price
    const seen = new Set<string>();
    const uniquePlans: any[] = [];
    rawPlans.forEach((plan) => {
      const key = plan.documentId || `${plan.planName}-${plan.price}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePlans.push(plan);
      }
    });

    const orderMap: Record<string, number> = {
      basic: 1,
      standard: 2,
      premium: 3,
      luxury: 4,
    };

    return uniquePlans
      .filter((item: any) => item && item.isActive !== false)
      .map((item: any) => {
        const rawName = (item.planName || item.title || '').trim();
        const lowerName = rawName.toLowerCase();
        const visits =
          Number(item.visitAllowed) ||
          (lowerName.includes('luxury') ? 15 : lowerName.includes('premium') ? 10 : 5);

        const title = lowerName.includes('pass')
          ? rawName
          : `${rawName || 'Outdoor'} Pass`;

        let benefits: string[] = [];
        if (Array.isArray(item.benefits) && item.benefits.length > 0) {
          benefits = item.benefits;
        } else if (
          item.description &&
          typeof item.description === 'string' &&
          item.description.trim()
        ) {
          benefits = item.description
            .split(/[\r\n,•;]+/)
            .map((s: string) => s.trim())
            .filter(Boolean);
        }

        if (benefits.length === 0) {
          if (lowerName.includes('luxury')) {
            benefits = [
              `${visits} Visits Included`,
              'Unlimited access premium fitness spaces',
              'Best for daily training & priority experience',
            ];
          } else if (lowerName.includes('premium')) {
            benefits = [
              `${visits} Visits Included`,
              'Wider access to multiple partner gyms',
              'Ideal for regular workouts',
            ];
          } else {
            benefits = [
              `${visits} Visits Included`,
              'Access to selected local gyms',
              'Perfect for occasional workouts',
            ];
          }
        }

        let sortOrder = 99;
        for (const [key, order] of Object.entries(orderMap)) {
          if (lowerName.includes(key)) {
            sortOrder = order;
            break;
          }
        }

        return {
          id: item.documentId || String(item.id || item.planName),
          documentId: item.documentId,
          title,
          price: Number(item.price) || 0,
          visitAllowed: visits,
          popular: item.popular ?? lowerName.includes('premium'),
          benefits,
          _sortOrder: sortOrder,
        };
      })
      .sort((a, b) => (a._sortOrder || 99) - (b._sortOrder || 99));
  }, [plansData]);

  const [selectedPassId, setSelectedPassId] = useState<string>('');

  // Automatically select the popular pass or the first available pass once loaded
  useEffect(() => {
    console.log('🎯 [select-outdoor-pass] Final mapped passOptions count:', passOptions.length);
    console.log('🎯 [select-outdoor-pass] Final mapped passOptions:', JSON.stringify(passOptions, null, 2));

    if (passOptions.length > 0 && !passOptions.some((p) => p.id === selectedPassId)) {
      const defaultPass = passOptions.find((p) => p.popular) || passOptions[0];
      if (defaultPass) {
        setSelectedPassId(defaultPass.id);
      }
    }
  }, [passOptions, selectedPassId]);

  const selectedPass = passOptions.find((p) => p.id === selectedPassId) || passOptions[0];

  const handleContinue = () => {
    if (!selectedPass) return;
    router.push({
      pathname: '/membership/review-and-buy' as any,
      params: {
        gymName,
        membershipTier,
        membershipPrice: membershipPrice.toString(),
        duration,
        passTitle: selectedPass.title,
        visits: (selectedPass.visitAllowed || 0).toString(),
        outdoorPassPrice: (selectedPass.price || 0).toString(),
        validityDays: '30',
        planDocumentId,
        outdoorPlanDocumentId: selectedPass.documentId || '',
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
        {isLoading ? (
          // Loading Skeletons
          <View className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="rounded-2xl border border-slate-200/70 bg-white p-4">
                <View className="flex-row items-center justify-between pb-3">
                  <View className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
                  <View className="h-5 w-16 rounded bg-slate-200 animate-pulse" />
                </View>
                <View className="h-px w-full bg-slate-100 my-2" />
                <View className="space-y-2 pt-2">
                  <View className="h-3 w-44 rounded bg-slate-100 animate-pulse" />
                  <View className="h-3 w-52 rounded bg-slate-100 animate-pulse" />
                  <View className="h-3 w-36 rounded bg-slate-100 animate-pulse" />
                </View>
              </View>
            ))}
          </View>
        ) : isError ? (
          // Error State
          <View className="items-center justify-center py-16 px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="mt-3 font-bold text-slate-800 text-[16px]">
              Failed to Load Passes
            </Text>
            <Text className="mt-1 text-center text-slate-500 text-[13px]">
              Could not fetch outdoor membership plans from the server.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              activeOpacity={0.8}
              className="mt-5 rounded-xl bg-[#E23744] px-5 py-2.5">
              <Text className="font-semibold text-white text-[13px]">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : passOptions.length === 0 ? (
          // Empty State
          <View className="items-center justify-center py-16 px-6">
            <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            <Text className="mt-3 font-bold text-slate-800 text-[16px]">
              No Outdoor Passes Available
            </Text>
            <Text className="mt-1 text-center text-slate-500 text-[13px]">
              There are currently no active outdoor membership plans.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              activeOpacity={0.8}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5">
              <Text className="font-semibold text-white text-[13px]">Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // 2. Pass Option Cards from API
          passOptions.map((pass) => {
            const isSelected = selectedPass?.id === pass.id;

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
                    ₹{pass.price.toLocaleString('en-IN')}
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
          })
        )}
      </ScrollView>

      {/* 3. Sticky Bottom Action Button */}
      {selectedPass ? (
        <View className="absolute bottom-0 left-0 right-0 bg-white">
          <GradientDivider />
          <View className="px-5 pt-3 pb-6">
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.88}
              style={{ borderRadius: 14 }}
              className="w-full items-center justify-center bg-[#E23744] py-3.5">
              <Text className="font-bold text-[16px] text-white">
                Outdoor Pass: ₹{selectedPass.price.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
