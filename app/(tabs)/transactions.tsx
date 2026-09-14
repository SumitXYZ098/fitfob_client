import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Container } from '@/components/modules/Container';

interface PaymentTransaction {
  id: string;
  title: string;
  amount: string;
  date: string;
  status: 'completed' | 'pending';
}

interface VisitTransaction {
  id: string;
  gymName: string;
  schedule: string;
  status: 'Open' | 'Completed' | 'Cancelled';
}

const MOCK_PAYMENTS: PaymentTransaction[] = [
  {
    id: '1',
    title: '3-Month Pilates Class',
    amount: '₹399.00',
    date: '5th Jan 6:51 am',
    status: 'completed',
  },
  {
    id: '2',
    title: '3-Month Pilates Class',
    amount: '₹399.00',
    date: '5th Jan 6:51 am',
    status: 'completed',
  },
  {
    id: '3',
    title: '3-Month Pilates Class',
    amount: '₹399.00',
    date: '5th Jan 6:51 am',
    status: 'completed',
  },
  {
    id: '4',
    title: '3-Month Pilates Class',
    amount: '₹399.00',
    date: '5th Jan 6:51 am',
    status: 'completed',
  },
  {
    id: '5',
    title: '3-Month Pilates Class',
    amount: '₹399.00',
    date: '5th Jan 6:51 am',
    status: 'completed',
  },
  {
    id: '6',
    title: '3-Month Pilates Class',
    amount: '₹399.00',
    date: '5th Jan 6:51 am',
    status: 'completed',
  },
];

const MOCK_VISITS: VisitTransaction[] = [
  {
    id: '1',
    gymName: 'Anytime Fitness Gym',
    schedule: 'Friday, April 19  •  6:30 AM - 7:30 AM',
    status: 'Open',
  },
  {
    id: '2',
    gymName: 'Anytime Fitness Gym',
    schedule: 'Friday, April 19  •  6:30 AM - 7:30 AM',
    status: 'Open',
  },
  {
    id: '3',
    gymName: 'Anytime Fitness Gym',
    schedule: 'Friday, April 19  •  6:30 AM - 7:30 AM',
    status: 'Open',
  },
  {
    id: '4',
    gymName: 'Anytime Fitness Gym',
    schedule: 'Friday, April 19  •  6:30 AM - 7:30 AM',
    status: 'Open',
  },
  {
    id: '5',
    gymName: 'Anytime Fitness Gym',
    schedule: 'Friday, April 19  •  6:30 AM - 7:30 AM',
    status: 'Open',
  },
  {
    id: '6',
    gymName: 'Anytime Fitness Gym',
    schedule: 'Friday, April 19  •  6:30 AM - 7:30 AM',
    status: 'Open',
  },
];

const MONTH_OPTIONS = ["Jan' 2026", "Dec' 2025", "Nov' 2025", "Oct' 2025"];

export default function TransactionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'payments' | 'visits'>('payments');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("Jan' 2026");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <Container>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between pb-2 pt-2">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          className="h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-bold text-lg text-darkText">
          {activeTab === 'payments' ? 'Transactions' : 'Visits'}
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          className="relative h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}>
          <Ionicons name="notifications" size={22} color="#E23744" />
          <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#E23744]" />
        </TouchableOpacity>
      </View>

      {/* 2. Segmented Tab Switcher */}
      <View className="my-2 flex-row rounded-full bg-[#F4F4F6] p-1.5">
        {(
          [
            { key: 'payments', label: 'Payments', count: MOCK_PAYMENTS.length },
            { key: 'visits', label: 'Visits', count: MOCK_VISITS.length },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
              style={
                isSelected
                  ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                    backgroundColor: 'white',
                  }
                  : {}
              }
              className="flex-1 flex-row items-center justify-center rounded-full py-2.5">
              <Text
                className={`mr-2 font-semibold text-sm ${isSelected ? 'text-darkText' : 'text-secondaryText'
                  }`}>
                {tab.label}
              </Text>
              <View
                className={`h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ${isSelected ? 'bg-[#E23744]' : 'bg-[#E5E7EB]'
                  }`}>
                <Text
                  className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Sub-header (Month Selector & Filter Button) */}
      <View className="my-2 flex-row items-center justify-between px-1">
        <Text className="font-semibold text-base text-darkText">{selectedMonth}</Text>

        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
          className="flex-row items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 shadow-sm">
          <Feather name="sliders" size={15} color="#E23744" />
          <Text className="ml-1.5 font-medium text-sm text-darkText">Filter</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Transactions List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 90 : 80,
          paddingTop: 4,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E23744']} />
        }>
        {activeTab === 'payments' ? (
          /* Payment History List */
          <View className="space-y-3">
            {MOCK_PAYMENTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                className="shadow-xs mb-3 flex-row items-center justify-between rounded-2xl border border-[#F3F4F6] bg-white p-4">
                <View className="mr-3 flex-1 flex-row items-center">
                  {/* Purple Running Icon Container */}
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]">
                    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M13.5 5.5A1.5 1.5 0 1 0 13.5 2.5 1.5 1.5 0 0 0 13.5 5.5Z"
                        fill="#FFFFFF"
                      />
                      <Path
                        d="M9.8 8.9L7 11.7c-.4.4-.4 1 0 1.4.4.4 1 .4 1.4 0l2.3-2.3 2.1 4.2-3.1 4.7c-.3.5-.2 1.1.3 1.4.5.3 1.1.2 1.4-.3l3.5-5.3c.2-.3.2-.7 0-1L13 10.6l1.2-1.9 2.9 1.4c.5.2 1.1 0 1.3-.5.2-.5 0-1.1-.5-1.3l-3.6-1.8c-.4-.2-.9-.1-1.2.2L11 9.2l-1.2-.3Z"
                        fill="#FFFFFF"
                      />
                    </Svg>
                  </View>

                  {/* Title & Subtitle */}
                  <View className="flex-1">
                    <Text className="mb-0.5 font-bold text-base text-darkText">{item.title}</Text>
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                      <Text className="ml-1 font-medium text-xs text-secondaryText">
                        {item.date}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Amount */}
                <Text className="font-bold text-base text-darkText">{item.amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Visits History List */
          <View className="space-y-3">
            {MOCK_VISITS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                className="shadow-xs mb-3 flex-row items-center justify-between rounded-2xl border border-[#F3F4F6] bg-white p-4">
                <View className="mr-3 flex-1 flex-row items-center">
                  {/* Purple Running Icon Container */}
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]">
                    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M13.5 5.5A1.5 1.5 0 1 0 13.5 2.5 1.5 1.5 0 0 0 13.5 5.5Z"
                        fill="#FFFFFF"
                      />
                      <Path
                        d="M9.8 8.9L7 11.7c-.4.4-.4 1 0 1.4.4.4 1 .4 1.4 0l2.3-2.3 2.1 4.2-3.1 4.7c-.3.5-.2 1.1.3 1.4.5.3 1.1.2 1.4-.3l3.5-5.3c.2-.3.2-.7 0-1L13 10.6l1.2-1.9 2.9 1.4c.5.2 1.1 0 1.3-.5.2-.5 0-1.1-.5-1.3l-3.6-1.8c-.4-.2-.9-.1-1.2.2L11 9.2l-1.2-.3Z"
                        fill="#FFFFFF"
                      />
                    </Svg>
                  </View>

                  {/* Title & Schedule */}
                  <View className="flex-1">
                    <Text className="mb-0.5 font-bold text-base text-darkText">{item.gymName}</Text>
                    <Text className="font-medium text-xs text-secondaryText">{item.schedule}</Text>
                  </View>
                </View>

                {/* Status Pill */}
                <View className="items-center justify-center rounded-full bg-[#DCFCE7] px-3 py-1">
                  <Text className="font-semibold text-xs text-[#15803D]">{item.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 5. Filter Month Selection Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
          className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-bold text-lg text-darkText">Filter by Month</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color="#1C1C1C" />
              </TouchableOpacity>
            </View>

            {MONTH_OPTIONS.map((month) => (
              <TouchableOpacity
                key={month}
                onPress={() => {
                  setSelectedMonth(month);
                  setFilterModalVisible(false);
                }}
                className={`mb-2 flex-row items-center justify-between rounded-xl p-3.5 ${selectedMonth === month ? 'bg-[#FFEAEF]' : 'bg-gray-50'
                  }`}>
                <Text
                  className={`font-semibold text-base ${selectedMonth === month ? 'text-[#E23744]' : 'text-darkText'
                    }`}>
                  {month}
                </Text>
                {selectedMonth === month && (
                  <Ionicons name="checkmark-circle" size={20} color="#E23744" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Container>
  );
}
