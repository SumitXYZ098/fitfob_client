import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';
import GradientDivider from '@/components/GradientDivider';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setActivePass } = useOutdoorPassStore();

  const totalAmount = parseFloat((params.totalAmount as string) || '2199');
  const gymName = (params.gymName as string) || 'Anytime Fitness Gym';
  const visits = parseInt((params.visits as string) || '7', 10);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPaymentMethod = (methodName: string) => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      const generatedPassId = `123-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
      setActivePass({
        id: generatedPassId,
        passName: 'Premium Outdoor Pass',
        tierId: 'premium',
        visits,
        totalVisits: visits,
        expiresOn: '02/02/2026',
        price: totalAmount,
        location: 'Sector 71',
        isPaused: false,
        purchasedAt: new Date().toISOString(),
      });

      Toast.show({
        type: 'success',
        text1: 'Payment Successful! 🎉',
        text2: `Paid ₹${totalAmount.toFixed(2)} via ${methodName}`,
      });

      router.replace({
        pathname: '/membership/gym-verification' as any,
        params: {
          gymName,
          location: 'Sector 71',
          passId: generatedPassId,
        },
      });
    }, 1200);
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
          Payment
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 60,
        }}>
        {/* 2. Total Amount Top Card */}
        <View className="rounded-[20px] border border-slate-100 bg-white p-4.5 shadow-xs flex-row items-center justify-between mb-5">
          <Text className="text-[13.5px] font-normal text-slate-600">
            Total Amount
          </Text>
          <Text className="text-[19px] font-bold text-slate-900">
            ₹{totalAmount.toFixed(2)}
          </Text>
        </View>

        {/* 3. Recommended Section */}
        <Text className="text-[12.5px] font-semibold text-slate-500 mb-2 px-1">
          Recommended
        </Text>
        <View className="rounded-[22px] border border-slate-100 bg-white p-2 shadow-xs mb-5">
          {/* Hdfc Rupay Card */}
          <TouchableOpacity
            onPress={() => handleSelectPaymentMethod('HDFC RuPay Card')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center">
              <View className="h-8 w-10 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 mr-3">
                <Text className="font-black text-[10px] text-blue-700">RuPay</Text>
              </View>
              <Text className="text-[13.5px] font-medium text-slate-800">
                Hdfc Rupay card / ** 3456
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <GradientDivider />

          {/* CRED UPI */}
          <TouchableOpacity
            onPress={() => handleSelectPaymentMethod('CRED UPI')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-black mr-3">
                <Text className="font-black text-[10px] text-white">CRED</Text>
              </View>
              <Text className="text-[13.5px] font-medium text-slate-800">
                CRED UPI
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <GradientDivider />

          {/* Paytm UPI */}
          <TouchableOpacity
            onPress={() => handleSelectPaymentMethod('Paytm UPI')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center">
              <View className="h-8 w-10 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 mr-3">
                <Text className="font-black text-[10px] text-[#00BAF2]">paytm</Text>
              </View>
              <Text className="text-[13.5px] font-medium text-slate-800">
                Paytm UPI
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 4. Cards Section */}
        <Text className="text-[12.5px] font-semibold text-slate-500 mb-2 px-1">
          Cards
        </Text>
        <View className="rounded-[22px] border border-slate-100 bg-white p-2 shadow-xs mb-5">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/membership/add-card' as any,
                params: { totalAmount: totalAmount.toString() },
              })
            }
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100 mr-3">
                <Ionicons name="card" size={18} color="#475569" />
              </View>
              <Text className="text-[13.5px] font-medium text-slate-800">
                Add Credit or Debit cards
              </Text>
            </View>
            <Ionicons name="add" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* 5. Pay By Any UPI App Section */}
        <Text className="text-[12.5px] font-semibold text-slate-500 mb-2 px-1">
          Pay By Any UPI App
        </Text>
        <View className="rounded-[22px] border border-slate-100 bg-white p-2 shadow-xs mb-8">
          {/* Amazon Pay UPI */}
          <TouchableOpacity
            onPress={() => handleSelectPaymentMethod('Amazon Pay UPI')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 mr-3">
                <Text className="font-bold text-[10px] text-amber-700">pay</Text>
              </View>
              <Text className="text-[13.5px] font-medium text-slate-800">
                Amazon Pay UPI
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <GradientDivider />

          {/* Saved UPI ID */}
          <TouchableOpacity
            onPress={() => handleSelectPaymentMethod('UPI: 1234567890@ybl')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 mr-3">
                <MaterialCommunityIcons name="bank-outline" size={16} color="#4F46E5" />
              </View>
              <Text className="text-[13.5px] font-medium text-slate-800">
                1234567890@ybl
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <GradientDivider />

          {/* Add new UPI ID */}
          <TouchableOpacity
            onPress={() => handleSelectPaymentMethod('New UPI ID')}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3.5">
            <View className="flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 mr-3">
                <Text className="font-bold text-[10px] text-emerald-700">UPI</Text>
              </View>
              <Text className="text-[13.5px] font-medium text-slate-800">
                Add new UPI ID
              </Text>
            </View>
            <Ionicons name="add" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Processing State Overlay */}
        {isProcessing && (
          <View className="absolute inset-0 bg-white/80 items-center justify-center z-50">
            <View className="bg-white rounded-3xl p-6 items-center shadow-xl border border-slate-100">
              <ActivityIndicator size="large" color="#E23744" />
              <Text className="font-bold text-[16px] text-slate-900 mt-4">
                Processing Payment...
              </Text>
              <Text className="text-[12.5px] text-slate-500 mt-1">
                Please do not press back or close the app
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
