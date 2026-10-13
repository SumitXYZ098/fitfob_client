import React, { useState, useCallback, useMemo } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { Container } from '@/components/modules/Container';
import { useMyCheckins, CheckinItem } from '@/hook/useClient';

// Helper to reliably extract the gym's logo URL (S3, relative, or object)
const getLogoUrl = (item: any): string | null => {
  const rawLogo =
    item?.club_logo ||
    item?.clubLogo ||
    item?.logo ||
    item?.club?.logo ||
    item?.club?.club_logo ||
    item?.club?.attributes?.logo?.data?.attributes?.url;

  if (!rawLogo) return null;
  if (typeof rawLogo === 'string' && rawLogo.trim().length > 0) {
    const trimmed = rawLogo.trim();
    if (trimmed.startsWith('http')) return trimmed;
    const base = process.env.EXPO_PUBLIC_API_URL || '';
    return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }
  if (typeof rawLogo === 'object' && rawLogo?.url) {
    const urlStr = String(rawLogo.url).trim();
    if (urlStr.startsWith('http')) return urlStr;
    const base = process.env.EXPO_PUBLIC_API_URL || '';
    return `${base}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
  }
  return null;
};

// Helper to reliably extract the gym name
const getClubName = (item: any): string => {
  const name =
    item?.club_name ||
    item?.clubName ||
    item?.club?.name ||
    item?.club?.clubName ||
    item?.club?.title ||
    item?.name;

  return name && String(name).trim() ? String(name).trim() : 'Fitness Club';
};

const formatVisitSchedule = (checkinTimeStr: string, checkoutTimeStr?: string | null) => {
  if (!checkinTimeStr) return 'Date & time not available';
  try {
    const checkin = new Date(checkinTimeStr);
    if (isNaN(checkin.getTime())) return checkinTimeStr;

    const dateFormatted = checkin.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const formatTime = (d: Date) =>
      d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    const startTime = formatTime(checkin);

    if (checkoutTimeStr) {
      const checkout = new Date(checkoutTimeStr);
      if (!isNaN(checkout.getTime())) {
        const endTime = formatTime(checkout);
        return `${dateFormatted}  •  ${startTime} - ${endTime}`;
      }
    }

    return `${dateFormatted}  •  Checked in at ${startTime}`;
  } catch {
    return checkinTimeStr;
  }
};

const getVisitDuration = (checkinTimeStr: string, checkoutTimeStr?: string | null) => {
  if (!checkinTimeStr || !checkoutTimeStr) return null;
  try {
    const start = new Date(checkinTimeStr).getTime();
    const end = new Date(checkoutTimeStr).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return null;

    const diffMins = Math.round(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${mins} min${mins > 1 ? 's' : ''}`;
  } catch {
    return null;
  }
};

const getStatusInfo = (status: string) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'checked-out' || s === 'completed') {
    return {
      label: 'Completed',
      bgColor: 'bg-[#DCFCE7]',
      textColor: 'text-[#15803D]',
      borderColor: 'border-[#BBF7D0]',
    };
  }
  if (s === 'checked-in' || s === 'open' || s === 'active') {
    return {
      label: 'Active',
      bgColor: 'bg-[#DBEAFE]',
      textColor: 'text-[#1D4ED8]',
      borderColor: 'border-[#BFDBFE]',
    };
  }
  if (s === 'cancelled') {
    return {
      label: 'Cancelled',
      bgColor: 'bg-[#FFE4E6]',
      textColor: 'text-[#BE123C]',
      borderColor: 'border-[#FECDD3]',
    };
  }
  return {
    label: status ? status.replace('-', ' ') : 'Recorded',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  };
};

const formatDetailTime = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
};

const formatDetailDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

export default function TransactionsScreen() {
  const router = useRouter();
  // Visits is the default active tab (real data from /client/my-checkins)
  const [activeTab, setActiveTab] = useState<'visits' | 'payments'>('visits');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<CheckinItem | null>(null);

  // Live Visits / Check-ins Query
  const {
    data: checkinsData,
    isLoading: isCheckinsLoading,
    refetch: refetchCheckins,
  } = useMyCheckins();

  const checkins: CheckinItem[] = useMemo(() => {
    if (!checkinsData) return [];
    if (Array.isArray(checkinsData)) return checkinsData;
    if (Array.isArray(checkinsData.data)) return checkinsData.data;
    return [];
  }, [checkinsData]);

  // Extract available months dynamically
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    checkins.forEach((c) => {
      if (c.checkinTime) {
        try {
          const d = new Date(c.checkinTime);
          if (!isNaN(d.getTime())) {
            const m = d.toLocaleString('en-US', { month: 'short' });
            const y = d.getFullYear();
            set.add(`${m}' ${y}`);
          }
        } catch {}
      }
    });
    const months = Array.from(set);
    if (months.length === 0) {
      return ['All', "Jan' 2026", "Dec' 2025"];
    }
    return ['All', ...months];
  }, [checkins]);

  // Filter checkins by selected month
  const filteredCheckins = useMemo(() => {
    if (selectedMonth === 'All') return checkins;
    return checkins.filter((c) => {
      if (!c.checkinTime) return false;
      try {
        const d = new Date(c.checkinTime);
        const m = d.toLocaleString('en-US', { month: 'short' });
        const y = d.getFullYear();
        return `${m}' ${y}` === selectedMonth;
      } catch {
        return false;
      }
    });
  }, [checkins, selectedMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCheckins();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCheckins]);

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
          {activeTab === 'visits' ? 'Visits' : 'Transactions'}
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/account/notifications' as any)}
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
            { key: 'visits', label: 'Visits', count: checkins.length },
            { key: 'payments', label: 'Payments', count: 0 },
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
        <Text className="font-semibold text-base text-darkText">
          {selectedMonth === 'All' ? 'All Months' : selectedMonth}
        </Text>

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
          /* Payment History List (No Dummy Data) */
          <View className="my-10 items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-[#FFEAEF]">
              <Ionicons name="card-outline" size={32} color="#E23744" />
            </View>
            <Text className="font-bold text-lg text-darkText">No Transactions Found</Text>
            <Text className="mt-1.5 text-center text-xs text-secondaryText px-4 leading-5">
              Your pass and membership transactions will appear here once you make a purchase.
            </Text>
          </View>
        ) : isCheckinsLoading && !refreshing ? (
          /* Loading Skeletons */
          <View className="space-y-3">
            {[1, 2, 3, 4].map((idx) => (
              <View
                key={idx}
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-[#F3F4F6] bg-white p-4">
                <View className="mr-3 flex-1 flex-row items-center">
                  <View className="mr-3 h-12 w-12 rounded-xl bg-slate-200" />
                  <View className="flex-1">
                    <View className="h-4 w-32 rounded bg-slate-200" />
                    <View className="mt-2 h-3 w-48 rounded bg-slate-100" />
                  </View>
                </View>
                <View className="h-6 w-20 rounded-full bg-slate-200" />
              </View>
            ))}
          </View>
        ) : filteredCheckins.length === 0 ? (
          /* Empty State */
          <View className="my-10 items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-[#FFEAEF]">
              <Ionicons name="calendar-outline" size={32} color="#E23744" />
            </View>
            <Text className="font-bold text-lg text-darkText">No Visits Found</Text>
            <Text className="mt-1.5 text-center text-xs text-secondaryText px-4 leading-5">
              {selectedMonth === 'All'
                ? "You haven't checked into any gym yet. Scan the gym QR code at the entrance to record your visits."
                : `No gym visits recorded for ${selectedMonth}. Try selecting 'All' from the filter.`}
            </Text>
          </View>
        ) : (
          /* Visits History List */
          <View className="space-y-3">
            {filteredCheckins.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              const duration = getVisitDuration(item.checkinTime, item.checkoutTime);
              const logoUrl = getLogoUrl(item);
              const clubName = getClubName(item);

              return (
                <TouchableOpacity
                  key={item.documentId || String(item.id)}
                  activeOpacity={0.8}
                  onPress={() => setSelectedVisit(item)}
                  className="shadow-xs mb-3 flex-row items-center justify-between rounded-2xl border border-[#F3F4F6] bg-white p-4">
                  <View className="mr-3 flex-1 flex-row items-center">
                    {/* Club Logo via ExpoImage (Handles S3 URLs, caching & scaling) / Fallback Icon */}
                    {logoUrl ? (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          overflow: 'hidden',
                          marginRight: 12,
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                        }}>
                        <ExpoImage
                          source={{ uri: logoUrl }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={200}
                        />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          marginRight: 12,
                          backgroundColor: '#7C3AED',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
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
                    )}

                    {/* Gym Name & Schedule & Tags */}
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text numberOfLines={1} className="font-bold text-base text-darkText flex-1">
                          {clubName}
                        </Text>
                        {Boolean(item.subscriptionType) && (
                          <View className="ml-1.5 rounded-md bg-slate-100 px-1.5 py-0.5">
                            <Text className="text-[10px] font-semibold uppercase text-slate-600">
                              {item.subscriptionType}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text numberOfLines={1} className="mt-0.5 font-medium text-xs text-secondaryText">
                        {formatVisitSchedule(item.checkinTime, item.checkoutTime)}
                      </Text>
                      {Boolean(duration) && (
                        <View className="mt-1 flex-row items-center">
                          <Ionicons name="time-outline" size={12} color="#64748B" />
                          <Text className="ml-1 text-[11px] font-medium text-slate-500">
                            Duration: {duration}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status Pill */}
                  <View
                    className={`items-center justify-center rounded-full px-3 py-1 border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                    <Text className={`font-semibold text-xs capitalize ${statusInfo.textColor}`}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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

            {monthOptions.map((month) => (
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
                  {month === 'All' ? 'All Months' : month}
                </Text>
                {selectedMonth === month && (
                  <Ionicons name="checkmark-circle" size={20} color="#E23744" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 6. Visit Details Bottom Sheet Modal */}
      <Modal
        visible={Boolean(selectedVisit)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVisit(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSelectedVisit(null)}
            className="flex-1"
          />
          <View className="rounded-t-[32px] bg-white px-5 pt-3 pb-8 max-h-[85%] shadow-2xl">
            {/* Modal Drag Handle */}
            <View className="mb-3 items-center">
              <View className="h-1.5 w-12 rounded-full bg-slate-200" />
            </View>

            {selectedVisit && (() => {
              const visitLogo = getLogoUrl(selectedVisit);
              const visitGymName = getClubName(selectedVisit);
              const visitStatus = getStatusInfo(selectedVisit.status);
              const visitDuration = getVisitDuration(selectedVisit.checkinTime, selectedVisit.checkoutTime);
              const checkinTime = formatDetailTime(selectedVisit.checkinTime);
              const checkinDate = formatDetailDate(selectedVisit.checkinTime);
              const checkoutTime = formatDetailTime(selectedVisit.checkoutTime);
              const checkoutDate = formatDetailDate(selectedVisit.checkoutTime);

              return (
                <View>
                  {/* Modal Header */}
                  <View className="mb-4 flex-row items-center justify-between pb-3 border-b border-slate-100">
                    <View className="flex-row items-center flex-1 mr-3">
                      {visitLogo ? (
                        <View
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 16,
                            overflow: 'hidden',
                            marginRight: 12,
                            backgroundColor: '#F8FAFC',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                          }}>
                          <ExpoImage
                            source={{ uri: visitLogo }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={200}
                          />
                        </View>
                      ) : (
                        <View
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 16,
                            marginRight: 12,
                            backgroundColor: '#7C3AED',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <Ionicons name="barbell-outline" size={26} color="#FFFFFF" />
                        </View>
                      )}

                      <View className="flex-1">
                        <Text numberOfLines={1} className="font-bold text-lg text-slate-900">
                          {visitGymName}
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1.5 flex-wrap">
                          <View
                            className={`rounded-full px-2.5 py-0.5 border ${visitStatus.bgColor} ${visitStatus.borderColor}`}>
                            <Text className={`font-semibold text-[11px] capitalize ${visitStatus.textColor}`}>
                              {visitStatus.label}
                            </Text>
                          </View>
                          {Boolean(selectedVisit.subscriptionType) && (
                            <View className="rounded-full bg-slate-100 px-2.5 py-0.5 border border-slate-200">
                              <Text className="text-[10px] font-bold uppercase text-slate-700">
                                {selectedVisit.subscriptionType} Pass
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setSelectedVisit(null)}
                      activeOpacity={0.7}
                      className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                      <Ionicons name="close" size={20} color="#475569" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} className="max-h-[460px]">
                    {/* Check-in & Check-out Timing Cards */}
                    <View className="mb-3.5 flex-row gap-3">
                      {/* Check-in Box */}
                      <View className="flex-1 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                        <View className="flex-row items-center mb-1.5">
                          <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-100 mr-1.5">
                            <Ionicons name="arrow-down" size={13} color="#059669" />
                          </View>
                          <Text className="font-semibold text-xs text-emerald-800">Check-in</Text>
                        </View>
                        <Text className="font-bold text-base text-slate-900">
                          {checkinTime || '--:--'}
                        </Text>
                        <Text className="text-[11px] text-slate-500 mt-0.5">
                          {checkinDate || 'Not recorded'}
                        </Text>
                      </View>

                      {/* Check-out Box */}
                      <View className="flex-1 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
                        <View className="flex-row items-center mb-1.5">
                          <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-100 mr-1.5">
                            <Ionicons name="arrow-up" size={13} color="#2563EB" />
                          </View>
                          <Text className="font-semibold text-xs text-blue-800">Check-out</Text>
                        </View>
                        <Text className="font-bold text-base text-slate-900">
                          {checkoutTime || (visitStatus.label === 'Active' ? 'In Session' : '--:--')}
                        </Text>
                        <Text className="text-[11px] text-slate-500 mt-0.5">
                          {checkoutDate || (visitStatus.label === 'Active' ? 'Ongoing' : 'Not recorded')}
                        </Text>
                      </View>
                    </View>

                    {/* Duration Banner */}
                    {Boolean(visitDuration) ? (
                      <View className="mb-3.5 flex-row items-center rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-100 mr-3">
                          <Ionicons name="stopwatch-outline" size={20} color="#D97706" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-sm text-amber-900">
                            Total Workout Duration: {visitDuration}
                          </Text>
                          <Text className="text-[11px] text-amber-700">
                            Calculated between entry and exit turnstile scans
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View className="mb-3.5 flex-row items-center rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-100 mr-3">
                          <Ionicons name="flash-outline" size={20} color="#2563EB" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-sm text-blue-900">
                            Active Gym Session
                          </Text>
                          <Text className="text-[11px] text-blue-700">
                            Remember to scan QR upon exit to record total workout time
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Session Reference Details */}
                    <View className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <Text className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2.5">
                        Session Information
                      </Text>

                      <View className="flex-row items-center justify-between py-1.5 border-b border-slate-200/60">
                        <Text className="text-xs text-slate-500 font-medium">Session ID</Text>
                        <Text className="text-xs font-bold text-slate-800">
                          #{selectedVisit.id}
                        </Text>
                      </View>

                      {Boolean(selectedVisit.documentId) && (
                        <View className="flex-row items-center justify-between py-1.5 border-b border-slate-200/60">
                          <Text className="text-xs text-slate-500 font-medium">Pass Ref ID</Text>
                          <Text numberOfLines={1} className="text-xs font-mono font-semibold text-slate-700 max-w-[160px]">
                            {selectedVisit.documentId}
                          </Text>
                        </View>
                      )}

                      <View className="flex-row items-center justify-between py-1.5 border-b border-slate-200/60">
                        <Text className="text-xs text-slate-500 font-medium">Access Type</Text>
                        <Text className="text-xs font-semibold capitalize text-slate-800">
                          {selectedVisit.subscriptionType ? `${selectedVisit.subscriptionType} Access` : 'Pass Access'}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between pt-1.5">
                        <Text className="text-xs text-slate-500 font-medium">Verification</Text>
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                          <Text className="ml-1 text-xs font-semibold text-emerald-700">
                            Turnstile QR Verified
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Done / Close Button */}
                    <TouchableOpacity
                      onPress={() => setSelectedVisit(null)}
                      activeOpacity={0.85}
                      className="items-center justify-center rounded-2xl bg-[#E23744] py-3.5 shadow-sm">
                      <Text className="font-bold text-sm text-white">Done</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </Container>
  );
}
