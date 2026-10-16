import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { CustomCalendarModal } from '@/components/modules/CustomCalendar';
import { useMyCheckins, CheckinItem } from '@/hook/useClient';

// Light synthesized refresh pop sound HTML
const REFRESH_SOUND_HTML = `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script>
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }
  document.addEventListener('DOMContentLoaded', getCtx);

  window.playRefreshSound = function() {
    try {
      const c = getCtx();
      if (!c) return;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = 'sine';
      // Crisp pleasant water droplet / pop sound (650Hz -> 1150Hz -> 750Hz)
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1150, now + 0.035);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);

      // Light normal volume
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch (e) {}
  };
</script>
</body>
</html>
`;

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

const isOutdoorPass = (subscriptionType?: string | null) => {
  return (subscriptionType || '').toLowerCase().includes('outdoor');
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
  const soundWebViewRef = React.useRef<any>(null);

  const playRefreshFeedback = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

    try {
      soundWebViewRef.current?.injectJavaScript(`
        if (window.playRefreshSound) {
          window.playRefreshSound();
        }
        true;
      `);
    } catch {}
  }, []);

  // Visits is the default active tab (real data from /client/my-checkins)
  const [activeTab, setActiveTab] = useState<'visits' | 'payments'>('visits');
  const [refreshing, setRefreshing] = useState(false);

  // Filter Modes & States
  type PassTypeFilter = 'all' | 'local' | 'outdoor';
  const [selectedType, setSelectedType] = useState<PassTypeFilter>('all');

  // Date Filter: 'month' (Month-wise) or 'range' (Custom Date Range)
  const [dateFilterTab, setDateFilterTab] = useState<'month' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<CheckinItem | null>(null);

  const openDatePicker = useCallback((type: 'start' | 'end') => {
    setActiveDatePicker(type);
    setFilterModalVisible(false);
  }, []);

  const onCalendarConfirm = useCallback(
    (date: Date) => {
      if (activeDatePicker === 'start') {
        setStartDate(date);
        if (endDate && date > endDate) {
          setEndDate(null);
        }
        // Automatically open the "To Date" calendar right after From Date is selected
        setActiveDatePicker(null);
        setTimeout(() => {
          setActiveDatePicker('end');
        }, 120);
      } else if (activeDatePicker === 'end') {
        setEndDate(date);
        if (startDate && date < startDate) {
          setStartDate(date);
        }
        setActiveDatePicker(null);
        setFilterModalVisible(true);
      }
    },
    [activeDatePicker, startDate, endDate]
  );

  const onCalendarClose = useCallback(() => {
    setActiveDatePicker(null);
    setFilterModalVisible(true);
  }, []);

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

  // Check if a visit matches the currently selected date or month
  const isDateMatching = useCallback(
    (c: CheckinItem) => {
      if (!c.checkinTime) return false;
      const checkin = new Date(c.checkinTime);
      if (isNaN(checkin.getTime())) return false;

      // 1. Custom Date Range Mode
      if (dateFilterTab === 'range' && (startDate || endDate)) {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (checkin.getTime() < s.getTime()) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (checkin.getTime() > e.getTime()) return false;
        }
        return true;
      }

      // 2. Month-wise Mode (filters to previous 6 months when 'All' is selected)
      if (selectedMonth === 'All') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        return checkin.getTime() >= sixMonthsAgo.getTime();
      }
      const m = checkin.toLocaleString('en-US', { month: 'short' });
      const y = checkin.getFullYear();
      return `${m}' ${y}` === selectedMonth;
    },
    [dateFilterTab, selectedMonth, startDate, endDate]
  );

  // Checkins filtered by the active date/month criteria
  const dateFilteredCheckins = useMemo(() => {
    return checkins.filter(isDateMatching);
  }, [checkins, isDateMatching]);

  // Real Counts for Local vs Outdoor passes DYNAMICALLY calculated for current date filter
  const passTypeCounts = useMemo(() => {
    let local = 0;
    let outdoor = 0;
    dateFilteredCheckins.forEach((c) => {
      if (isOutdoorPass(c.subscriptionType)) {
        outdoor++;
      } else {
        local++;
      }
    });
    return {
      all: dateFilteredCheckins.length,
      local,
      outdoor,
    };
  }, [dateFilteredCheckins]);

  // Final filtered checkins (Date Filter + Pass Type Filter)
  const filteredCheckins = useMemo(() => {
    return dateFilteredCheckins.filter((c) => {
      if (selectedType === 'outdoor') {
        return isOutdoorPass(c.subscriptionType);
      }
      if (selectedType === 'local') {
        return !isOutdoorPass(c.subscriptionType);
      }
      return true;
    });
  }, [dateFilteredCheckins, selectedType]);

  // Dynamic label for current date/month filter
  const activeDateLabel = useMemo(() => {
    if (dateFilterTab === 'range' && (startDate || endDate)) {
      const fmt = (d: Date) =>
        d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      if (startDate && endDate) {
        return `${fmt(startDate)} - ${fmt(endDate)}`;
      }
      if (startDate) return `From ${fmt(startDate)}`;
      if (endDate) return `Up to ${fmt(endDate)}`;
    }
    return selectedMonth === 'All' ? 'Previous 6 Months' : selectedMonth;
  }, [dateFilterTab, selectedMonth, startDate, endDate]);

  const isFilterActive = useMemo(() => {
    if (selectedType !== 'all') return true;
    if (dateFilterTab === 'range' && (startDate || endDate)) return true;
    if (selectedMonth !== 'All') return true;
    return false;
  }, [selectedType, dateFilterTab, selectedMonth, startDate, endDate]);

  const resetAllFilters = useCallback(() => {
    setSelectedType('all');
    setSelectedMonth('All');
    setStartDate(null);
    setEndDate(null);
    setDateFilterTab('month');
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    playRefreshFeedback();
    try {
      await refetchCheckins();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCheckins, playRefreshFeedback]);

  return (
    <SafeAreaView className="flex-1 bg-white px-4" edges={['top']}>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between pb-2 pt-2">
        <TouchableOpacity
          onPress={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)' as any);
              }
            } catch {
              router.replace('/(tabs)' as any);
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

      {/* 2. Segmented Tab Switcher (10px Border Radius) */}
      <View className="my-2 flex-row rounded-[10px] bg-[#F4F4F6] p-1.5">
        {(
          [
            { key: 'visits', label: 'Visits', count: filteredCheckins.length },
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
              className="flex-1 flex-row items-center justify-center rounded-[8px] py-2.5">
              <Text
                className={`mr-2 font-semibold text-sm ${isSelected ? 'text-darkText' : 'text-secondaryText'
                  }`}>
                {tab.label}
              </Text>
              <View
                className={`h-5 min-w-[20px] items-center justify-center rounded-[6px] px-1.5 ${isSelected ? 'bg-[#E23744]' : 'bg-[#E5E7EB]'
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

      {/* 3. Sub-header (Month / Date Selector, Reset & Filter Buttons) */}
      <View className="my-2 flex-row items-center justify-between px-1">
        <View className="flex-row items-center flex-1 mr-2">
          <Text numberOfLines={1} className="font-semibold text-base text-darkText">
            {activeDateLabel}
          </Text>
        </View>

        {/* Outer Actions: Reset Button & Filter Button (10px Border Radius) */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={resetAllFilters}
            activeOpacity={0.7}
            className={`flex-row items-center rounded-[10px] border px-2.5 py-1.5 ${
              isFilterActive
                ? 'border-red-200 bg-[#FFEAEF]'
                : 'border-slate-200 bg-white'
            }`}>
            <Ionicons
              name="refresh-outline"
              size={13}
              color={isFilterActive ? '#E23744' : '#64748B'}
            />
            <Text
              className={`ml-1 font-semibold text-xs ${
                isFilterActive ? 'text-[#E23744]' : 'text-slate-600'
              }`}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            className={`flex-row items-center rounded-[10px] border px-3 py-1.5 ${
              isFilterActive
                ? 'border-[#E23744] bg-[#FFEAEF]'
                : 'border-[#E5E7EB] bg-white'
            }`}>
            <Feather
              name="sliders"
              size={13}
              color={isFilterActive ? '#E23744' : '#64748B'}
            />
            <Text
              className={`ml-1.5 font-medium text-xs ${
                isFilterActive ? 'text-[#E23744]' : 'text-darkText'
              }`}>
              Filter
            </Text>
            {isFilterActive && (
              <View className="ml-1.5 h-1.5 w-1.5 rounded-full bg-[#E23744]" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Pass Type Filter Pills (10px Border Radius) */}
      {activeTab === 'visits' && (
        <View className="mb-2.5 flex-row items-center gap-2 px-1">
          {(
            [
              { key: 'all', label: 'All Passes', count: passTypeCounts.all },
              { key: 'local', label: 'Local Pass', count: passTypeCounts.local },
              { key: 'outdoor', label: 'Outdoor Pass', count: passTypeCounts.outdoor },
            ] as const
          ).map((chip) => {
            const isSelected = selectedType === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setSelectedType(chip.key)}
                activeOpacity={0.75}
                className={`flex-row items-center rounded-[10px] px-3.5 py-1.5 border ${
                  isSelected
                    ? 'border-[#E23744] bg-[#E23744]'
                    : 'border-slate-200 bg-white'
                }`}>
                <Text
                  className={`font-semibold text-xs ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}>
                  {chip.label}
                </Text>
                <View
                  className={`ml-1.5 rounded-[6px] px-1.5 py-0.5 ${
                    isSelected ? 'bg-white/25' : 'bg-slate-100'
                  }`}>
                  <Text
                    className={`text-[10px] font-bold ${
                      isSelected ? 'text-white' : 'text-slate-600'
                    }`}>
                    {chip.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Quick Date Range Bar on Screen (10px Border Radius) */}
      {activeTab === 'visits' && dateFilterTab === 'range' && (
        <View className="mb-2.5 flex-row items-center justify-between rounded-[10px] border border-red-100 bg-[#FFEAEF]/50 p-2">
          <TouchableOpacity
            onPress={() => openDatePicker('start')}
            activeOpacity={0.75}
            className="flex-1 flex-row items-center justify-between rounded-[10px] border border-slate-200 bg-white px-3 py-2">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                From Date
              </Text>
              <Text className="text-xs font-bold text-slate-800">
                {startDate
                  ? startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                  : 'Select'}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={14} color="#E23744" />
          </TouchableOpacity>

          <View className="px-2">
            <Ionicons name="arrow-forward" size={14} color="#E23744" />
          </View>

          <TouchableOpacity
            onPress={() => openDatePicker('end')}
            activeOpacity={0.75}
            className="flex-1 flex-row items-center justify-between rounded-[10px] border border-slate-200 bg-white px-3 py-2">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                To Date
              </Text>
              <Text className="text-xs font-bold text-slate-800">
                {endDate
                  ? endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                  : 'Select'}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={14} color="#E23744" />
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Transactions List */}
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
          /* Payment History List (10px Border Radius) */
          <View className="my-6 items-center justify-center rounded-[10px] border border-slate-100 bg-white p-6">
            <Image
              source={require('@/assets/images/empty-payments.png')}
              style={{ width: 210, height: 210, backgroundColor: 'transparent' }}
              resizeMode="contain"
            />
            <Text className="mt-3 font-bold text-lg text-darkText">No Transactions Found</Text>
            <Text className="mt-1.5 text-center text-xs text-secondaryText px-4 leading-5">
              Your pass and membership transactions will appear here once you make a purchase.
            </Text>
          </View>
        ) : isCheckinsLoading && !refreshing ? (
          /* Loading Skeletons (10px Border Radius) */
          <View className="w-full">
            {[1, 2, 3, 4].map((idx) => (
              <View
                key={idx}
                className="mb-3 flex-row items-center justify-between rounded-[10px] border border-[#F3F4F6] bg-white p-4">
                <View className="mr-3 flex-1 flex-row items-center">
                  <View className="mr-3 h-12 w-12 rounded-[10px] bg-slate-200" />
                  <View className="flex-1">
                    <View className="h-4 w-32 rounded-[6px] bg-slate-200" />
                    <View className="mt-2 h-3 w-48 rounded-[6px] bg-slate-100" />
                  </View>
                </View>
                <View className="h-6 w-20 rounded-[10px] bg-slate-200" />
              </View>
            ))}
          </View>
        ) : filteredCheckins.length === 0 ? (
          /* Empty State (10px Border Radius) */
          <View className="my-6 items-center justify-center rounded-[10px] border border-slate-100 bg-white p-6">
            <Image
              source={require('@/assets/images/empty-visits.png')}
              style={{ width: 210, height: 210, backgroundColor: 'transparent' }}
              resizeMode="contain"
            />
            <Text className="mt-3 font-bold text-lg text-darkText">
              {selectedType === 'outdoor'
                ? 'No Outdoor Visits Found'
                : selectedType === 'local'
                ? 'No Local Visits Found'
                : 'No Visits Found'}
            </Text>
            <Text className="mt-1.5 text-center text-xs text-secondaryText px-4 leading-5">
              {checkins.length === 0
                ? "You haven't checked into any gym yet. Scan the gym QR code at the entrance to record your visits."
                : `No ${selectedType !== 'all' ? selectedType + ' pass' : ''} visits found for ${activeDateLabel}.`}
            </Text>
            {isFilterActive && (
              <TouchableOpacity
                onPress={resetAllFilters}
                activeOpacity={0.8}
                className="mt-4 rounded-[10px] bg-[#FFEAEF] px-4 py-2 border border-red-200">
                <Text className="font-semibold text-xs text-[#E23744]">Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Visits History List (10px Border Radius) */
          <View className="w-full">
            {filteredCheckins.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              const logoUrl = getLogoUrl(item);
              const clubName = getClubName(item);

              return (
                <TouchableOpacity
                  key={item.documentId || String(item.id)}
                  activeOpacity={0.8}
                  onPress={() => setSelectedVisit(item)}
                  className="mb-3 flex-row items-center justify-between rounded-[10px] border border-[#F3F4F6] bg-white p-4">
                  <View className="mr-3 flex-1 flex-row items-center">
                    {/* Club Logo via ExpoImage (Handles S3 URLs, caching & scaling) / Fallback Icon */}
                    {logoUrl ? (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
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
                          borderRadius: 10,
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
                        {(() => {
                          const isOutdoor = isOutdoorPass(item.subscriptionType);
                          const passLabel = item.subscriptionType
                            ? item.subscriptionType
                            : isOutdoor
                            ? 'Outdoor'
                            : 'Local';
                          return (
                            <View
                              className={`ml-1.5 rounded-[6px] px-1.5 py-0.5 border ${
                                isOutdoor
                                  ? 'border-amber-200 bg-amber-50'
                                  : 'border-emerald-200 bg-emerald-50'
                              }`}>
                              <Text
                                className={`text-[10px] font-bold uppercase ${
                                  isOutdoor ? 'text-amber-800' : 'text-emerald-800'
                                }`}>
                                {passLabel}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                      <Text numberOfLines={1} className="mt-0.5 font-medium text-xs text-secondaryText">
                        {formatVisitSchedule(item.checkinTime, item.checkoutTime)}
                      </Text>
                    </View>
                  </View>

                  {/* Status Pill (10px Border Radius) */}
                  <View
                    className={`items-center justify-center rounded-[10px] px-3 py-1 border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
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

      {/* 5. Filter Modal (Pass Type + Month-wise + Custom Date Range) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
          className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6 max-h-[90%]">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-bold text-lg text-darkText">Filter by Date</Text>
              <View className="flex-row items-center gap-3">
                {isFilterActive && (
                  <TouchableOpacity
                    onPress={resetAllFilters}
                    activeOpacity={0.7}>
                    <Text className="font-semibold text-xs text-[#E23744]">Reset All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#1C1C1C" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Selection Mode Switcher */}
            <Text className="mb-2 font-bold text-xs uppercase tracking-wider text-slate-400">
              Select By Month or Custom Dates
            </Text>
            <View className="mb-3.5 flex-row rounded-[10px] bg-slate-100 p-1">
              <TouchableOpacity
                onPress={() => setDateFilterTab('month')}
                activeOpacity={0.7}
                className={`flex-1 flex-row items-center justify-center rounded-[8px] py-2 ${
                  dateFilterTab === 'month' ? 'bg-white' : ''
                }`}>
                <View
                  className={`mr-1.5 h-5 w-5 items-center justify-center rounded-[5px] ${
                    dateFilterTab === 'month' ? 'bg-[#FFEAEF]' : 'bg-slate-200/60'
                  }`}>
                  <Ionicons
                    name="calendar"
                    size={12}
                    color={dateFilterTab === 'month' ? '#E23744' : '#64748B'}
                  />
                </View>
                <Text
                  className={`font-semibold text-xs ${
                    dateFilterTab === 'month' ? 'text-[#E23744]' : 'text-slate-600'
                  }`}>
                  Month-wise
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDateFilterTab('range')}
                activeOpacity={0.7}
                className={`flex-1 flex-row items-center justify-center rounded-[8px] py-2 ${
                  dateFilterTab === 'range' ? 'bg-white' : ''
                }`}>
                <View
                  className={`mr-1.5 h-5 w-5 items-center justify-center rounded-[5px] ${
                    dateFilterTab === 'range' ? 'bg-[#FFEAEF]' : 'bg-slate-200/60'
                  }`}>
                  <Ionicons
                    name="calendar-clear"
                    size={12}
                    color={dateFilterTab === 'range' ? '#E23744' : '#64748B'}
                  />
                </View>
                <Text
                  className={`font-semibold text-xs ${
                    dateFilterTab === 'range' ? 'text-[#E23744]' : 'text-slate-600'
                  }`}>
                  Custom Date Range
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content: Month-wise Selection */}
            {dateFilterTab === 'month' ? (
              <View className="max-h-52">
                <ScrollView showsVerticalScrollIndicator={false}>
                  {monthOptions.map((month) => (
                    <TouchableOpacity
                      key={month}
                      onPress={() => setSelectedMonth(month)}
                      className={`mb-2 flex-row items-center justify-between rounded-[10px] p-3 border ${
                        selectedMonth === month
                          ? 'border-[#E23744] bg-[#FFEAEF]'
                          : 'border-slate-100 bg-slate-50'
                      }`}>
                      <Text
                        className={`font-semibold text-sm ${
                          selectedMonth === month ? 'text-[#E23744]' : 'text-darkText'
                        }`}>
                        {month === 'All' ? 'Previous 6 Months' : month}
                      </Text>
                      {selectedMonth === month && (
                        <Ionicons name="checkmark-circle" size={18} color="#E23744" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              /* Content: Custom Date Range (Date-wise) */
              <View>
                {/* Quick Date Presets */}
                <View className="mb-3 flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      const now = new Date();
                      setStartDate(now);
                      setEndDate(now);
                    }}
                    activeOpacity={0.7}
                    className="flex-1 items-center rounded-[10px] border border-slate-200 bg-slate-50 py-1.5">
                    <Text className="text-[11px] font-medium text-slate-700">Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      const now = new Date();
                      const sevenDaysAgo = new Date();
                      sevenDaysAgo.setDate(now.getDate() - 7);
                      setStartDate(sevenDaysAgo);
                      setEndDate(now);
                    }}
                    activeOpacity={0.7}
                    className="flex-1 items-center rounded-[10px] border border-slate-200 bg-slate-50 py-1.5">
                    <Text className="text-[11px] font-medium text-slate-700">Last 7 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      const now = new Date();
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(now.getDate() - 30);
                      setStartDate(thirtyDaysAgo);
                      setEndDate(now);
                    }}
                    activeOpacity={0.7}
                    className="flex-1 items-center rounded-[10px] border border-slate-200 bg-slate-50 py-1.5">
                    <Text className="text-[11px] font-medium text-slate-700">Last 30 Days</Text>
                  </TouchableOpacity>

                  {(startDate || endDate) && (
                    <TouchableOpacity
                      onPress={() => {
                        setStartDate(null);
                        setEndDate(null);
                      }}
                      activeOpacity={0.7}
                      className="items-center justify-center rounded-[10px] border border-red-200 bg-red-50 px-2.5 py-1.5">
                      <Text className="text-[11px] font-semibold text-[#E23744]">Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* From Date & To Date Pickers */}
                <View className="flex-row gap-2.5 mb-3">
                  {/* From Date Box */}
                  <TouchableOpacity
                    onPress={() => openDatePicker('start')}
                    activeOpacity={0.8}
                    className="flex-1 rounded-[10px] border border-slate-200 bg-slate-50 p-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        From Date
                      </Text>
                      <Ionicons name="calendar-outline" size={14} color="#E23744" />
                    </View>
                    <Text className="font-bold text-sm text-slate-900">
                      {startDate
                        ? startDate.toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Select date'}
                    </Text>
                  </TouchableOpacity>

                  {/* To Date Box */}
                  <TouchableOpacity
                    onPress={() => openDatePicker('end')}
                    activeOpacity={0.8}
                    className="flex-1 rounded-[10px] border border-slate-200 bg-slate-50 p-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        To Date
                      </Text>
                      <Ionicons name="calendar-outline" size={14} color="#E23744" />
                    </View>
                    <Text className="font-bold text-sm text-slate-900">
                      {endDate
                        ? endDate.toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.85}
              className="mt-4 items-center justify-center rounded-[10px] bg-[#E23744] py-3.5">
              <Text className="font-bold text-sm text-white">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Full-Featured In-App Calendar (Future dates disabled, auto-step to To Date) */}
      <CustomCalendarModal
        visible={Boolean(activeDatePicker)}
        value={activeDatePicker === 'start' ? startDate : endDate || startDate}
        title={activeDatePicker === 'start' ? 'Select From Date' : 'Select To Date'}
        confirmText={activeDatePicker === 'start' ? 'Next (Select To Date)' : 'Apply Dates'}
        cancelText="Cancel"
        maxDate={new Date()}
        minDate={activeDatePicker === 'end' && startDate ? startDate : undefined}
        primaryColor="#E23744"
        onClose={onCalendarClose}
        onConfirm={onCalendarConfirm}
      />

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
          <View className="rounded-t-[32px] bg-white px-5 pt-3 pb-8 max-h-[85%]">
            {/* Modal Drag Handle */}
            <View className="mb-3 items-center">
              <View className="h-1.5 w-12 rounded-full bg-slate-200" />
            </View>

            {selectedVisit && (() => {
              const visitLogo = getLogoUrl(selectedVisit);
              const visitGymName = getClubName(selectedVisit);
              const visitStatus = getStatusInfo(selectedVisit.status);
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
                    <View className="mb-4 flex-row gap-3">
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

                    {/* Done / Close Button */}
                    <TouchableOpacity
                      onPress={() => setSelectedVisit(null)}
                      activeOpacity={0.85}
                      className="items-center justify-center rounded-2xl bg-[#E23744] py-3.5">
                      <Text className="font-bold text-sm text-white">Done</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Hidden Zero-Footprint Audio Synthesizer (Plays light refresh pop sound via Web Audio API without native rebuild) */}
      <View
        pointerEvents="none"
        style={{
          width: 0,
          height: 0,
          opacity: 0,
          position: 'absolute',
          top: -200,
          left: -200,
        }}>
        <WebView
          ref={soundWebViewRef}
          source={{ html: REFRESH_SOUND_HTML }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}
