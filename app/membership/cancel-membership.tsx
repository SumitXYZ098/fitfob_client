import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';

const CANCELLATION_REASONS = [
  'Moving away / Relocation',
  'Too expensive / Financial reasons',
  'Not enough time to workout',
  'Injury or medical condition',
  'Found another fitness center',
  'Temporary break',
  'Other',
];

export default function CancelMembershipScreen() {
  const router = useRouter();
  const { setActivePass } = useOutdoorPassStore();

  const [selectedReason, setSelectedReason] = useState('');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  const handleConfirmCancel = () => {
    Alert.alert(
      'Cancel Membership?',
      'Are you sure you want to cancel your membership? You will lose all active member benefits immediately.',
      [
        { text: 'Keep Membership', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setActivePass(null);
            Toast.show({
              type: 'info',
              text1: 'Membership Cancelled',
              text2: 'Your membership has been cancelled.',
            });
            router.replace('/(tabs)/membership');
          },
        },
      ]
    );
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
          Cancel Membership
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        }}>
        {/* 2. Main Cancel Card */}
        <View className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-xs">
          <Text className="font-bold text-[20px] text-slate-900 tracking-tight">
            Cancel Membership
          </Text>
          <Text className="mt-1.5 text-[13px] leading-5 text-slate-500">
            We're sorry to see you go. Let us know anything we can improve
          </Text>

          {/* Reason for leaving Selector */}
          <View className="mt-4">
            <Text className="font-medium text-[12px] text-slate-500 mb-1.5">
              Reason for leaving
            </Text>

            <TouchableOpacity
              onPress={() => setIsReasonModalOpen(true)}
              activeOpacity={0.8}
              className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
              <Text
                className={`text-[14px] ${
                  selectedReason ? 'text-slate-800' : 'text-slate-400'
                }`}>
                {selectedReason || 'Select a reason'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Red Cancel Membership Action Button */}
          <TouchableOpacity
            onPress={handleConfirmCancel}
            activeOpacity={0.88}
            style={{ borderRadius: 16 }}
            className="mt-5 w-full items-center justify-center bg-[#E23744] py-3.5">
            <Text className="font-bold text-[15px] text-white">
              Cancel Membership
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Retention / Testimonial Card */}
        <View className="mt-4 rounded-[22px] border border-slate-100 bg-white p-4.5 shadow-xs">
          <View className="flex-row items-center">
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
              }}
              className="h-11 w-11 rounded-full bg-slate-100"
            />
            <View className="ml-3">
              <Text className="font-bold text-[15px] text-slate-900">
                Max D.
              </Text>
              <Text className="text-[12px] text-slate-400 mt-0.5">
                (Feb 5, 2025)
              </Text>
            </View>
          </View>

          <Text className="mt-3 text-[13px] leading-5 text-slate-500">
            I paused my membership when i was out of town, it was eary to resume later!
          </Text>
        </View>

        {/* 4. "No thanks, cancel anyway" Outlined Button */}
        <TouchableOpacity
          onPress={handleConfirmCancel}
          activeOpacity={0.8}
          style={{ borderRadius: 16 }}
          className="mt-4 w-full items-center justify-center border border-[#E23744] bg-white py-3.5">
          <Text className="font-bold text-[14.5px] text-[#E23744]">
            No thanks, cancel anyway
          </Text>
        </TouchableOpacity>

        {/* 5. Contact Support Link */}
        <TouchableOpacity
          onPress={() => router.push('/support/help-support' as any)}
          activeOpacity={0.7}
          className="mt-8 items-center pb-6">
          <Text className="text-[13px] font-medium text-slate-400">
            Contact Support
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Reasons Modal */}
      <Modal
        visible={isReasonModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReasonModalOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsReasonModalOpen(false)}
          className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-5 shadow-2xl">
            <Text className="font-bold text-[17px] text-slate-900 mb-3">
              Select Reason
            </Text>
            {CANCELLATION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => {
                  setSelectedReason(reason);
                  setIsReasonModalOpen(false);
                }}
                activeOpacity={0.7}
                className="flex-row items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                <Text
                  className={`text-[14px] ${
                    selectedReason === reason
                      ? 'font-bold text-[#E23744]'
                      : 'text-slate-700'
                  }`}>
                  {reason}
                </Text>
                {selectedReason === reason && (
                  <Ionicons name="checkmark" size={18} color="#E23744" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
