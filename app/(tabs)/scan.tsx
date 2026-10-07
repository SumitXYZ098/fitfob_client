import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { Container } from '@/components/modules/Container';
import { useGetQr } from '@/hook/useClient';

export interface LocalSubscription {
  startDate?: string;
  endDate?: string;
  membershipType?: string;
  planName?: string;
  monthDuration?: number;
  price?: number;
  subscriptionStatus?: string;
}

export interface OutdoorSubscription {
  membershipType?: string;
  totalVisitsAllowed?: number;
  usedVisits?: number;
  remainingVisits?: number;
  subscriptionStatus?: string;
  planName?: string;
  price?: number;
}

export default function ScanScreen() {
  const router = useRouter();
  const getQrMutation = useGetQr();
  const { isPending, data } = getQrMutation;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'local' | 'outdoor'>('all');

  const USER_ID = data?.data?.clientId || 'N/A';
  const isLoading = isPending || refreshing;

  const localSub: LocalSubscription | undefined = data?.data?.subscription?.local_subscription;
  const outdoorSub: OutdoorSubscription | undefined = data?.data?.subscription?.outdoor_subscription;

  const hasLocal = Boolean(localSub && (localSub.subscriptionStatus === 'active' || localSub.planName));
  const hasOutdoor = Boolean(outdoorSub && (outdoorSub.subscriptionStatus === 'active' || outdoorSub.planName));
  const activeCount = (hasLocal ? 1 : 0) + (hasOutdoor ? 1 : 0);

  const handleReload = useCallback(async () => {
    try {
      await getQrMutation.mutateAsync();
    } catch (error) {
      console.error('Error reloading QR:', error);
    }
  }, [getQrMutation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getQrMutation.mutateAsync();
    } catch (error) {
      console.error('Error refreshing QR:', error);
    } finally {
      setRefreshing(false);
    }
  }, [getQrMutation]);

  useEffect(() => {
    handleReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyId = async () => {
    if (!USER_ID || USER_ID === 'N/A') return;
    await Clipboard.setStringAsync(USER_ID);
    Toast.show({
      type: 'success',
      text1: 'ID Copied',
      text2: 'User ID copied to clipboard!',
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (amount?: number | string) => {
    if (amount === undefined || amount === null) return 'N/A';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `₹${amount}`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const capitalize = (text?: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <Container>
      {/* 1. Header */}
      <View className="flex-row items-center justify-between pb-2 pt-2">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-bold text-lg text-darkText">Check In</Text>

        <TouchableOpacity
          onPress={() => router.push('/account/notifications' as any)}
          className="h-10 w-10 items-center justify-center rounded-full"
          activeOpacity={0.7}>
          <Ionicons name="notifications" size={20} color="#E23744" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F6163C']} />
        }
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: Platform.OS === 'ios' ? 120 : 90,
        }}>
        {/* 2. Subtitle Instruction */}
        <Text className="font-regular max-w-[290px] text-center text-sm leading-snug text-[#64748B]">
          Scan this QR code at the gym’s entrance desk or scanner to check in.
        </Text>

        {/* 3. Subscriptions Status Tag */}
        {activeCount > 0 && (
          <View className="mt-3.5 flex-row items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1">
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="text-xs font-semibold text-emerald-800">
              {activeCount} Active {activeCount === 1 ? 'Subscription' : 'Subscriptions'} Ready
            </Text>
          </View>
        )}

        {/* 4. QR Code Display / Loading Animation */}
        <View className="my-6 h-[270px] w-[270px] items-center justify-center rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
          {isLoading ? (
            <View className="items-center justify-center">
              <ActivityIndicator size="large" color="#F6163C" />
              <Text className="mt-3 font-medium text-xs text-slate-400">Loading QR Code...</Text>
            </View>
          ) : data?.data?.qrCode ? (
            <Image
              source={{ uri: data.data.qrCode }}
              style={{ width: 244, height: 244 }}
              resizeMode="contain"
            />
          ) : (
            <View className="items-center justify-center px-4">
              <Ionicons name="qr-code-outline" size={64} color="#CBD5E1" />
              <Text className="mt-2 text-center text-xs text-slate-400">
                Tap reload below to generate QR Code
              </Text>
            </View>
          )}
        </View>

        {/* 5. Action Button - Reload QR Code */}
        <TouchableOpacity
          onPress={handleReload}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-3.5 shadow-sm">
          <Ionicons name="refresh-outline" size={19} color="#FFFFFF" />
          <Text className="ml-2 font-bold text-sm text-white">
            {isLoading ? 'Reloading...' : 'Reload QR Code'}
          </Text>
        </TouchableOpacity>

        {/* 6. Trouble scanning / ID Section */}
        <View className="mb-6 mt-4 w-full flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
          <View>
            <Text className="text-[11px] font-medium text-slate-400">Client ID / Trouble scanning</Text>
            <Text className="font-bold text-sm text-slate-800 mt-0.5">{USER_ID}</Text>
          </View>

          <TouchableOpacity
            onPress={handleCopyId}
            disabled={!USER_ID || USER_ID === 'N/A'}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <MaterialCommunityIcons name="content-copy" size={15} color="#F6163C" />
            <Text className="font-bold text-xs text-[#F6163C]">Copy</Text>
          </TouchableOpacity>
        </View>

        {/* 7. Subscriptions & Passes Section */}
        <View className="w-full">
          {/* Section Header */}
          <View className="flex-row items-center justify-between pb-3">
            <View className="flex-row items-center gap-2">
              <Text className="font-extrabold text-base text-slate-900">Your Subscriptions</Text>
              {activeCount > 0 && (
                <View className="rounded-full bg-slate-100 px-2.5 py-0.5 border border-slate-200">
                  <Text className="text-[11px] font-bold text-slate-600">{activeCount} Active</Text>
                </View>
              )}
            </View>
          </View>

          {/* Segmented Filter Pills */}
          <View className="mb-4 flex-row items-center rounded-2xl bg-slate-100 p-1">
            <TouchableOpacity
              onPress={() => setSelectedTab('all')}
              activeOpacity={0.8}
              className={`flex-1 items-center justify-center rounded-xl py-2 ${
                selectedTab === 'all' ? 'bg-white shadow-xs' : ''
              }`}>
              <Text
                className={`text-xs font-bold ${
                  selectedTab === 'all' ? 'text-slate-900' : 'text-slate-500'
                }`}>
                All Passes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedTab('local')}
              activeOpacity={0.8}
              className={`flex-1 items-center justify-center rounded-xl py-2 ${
                selectedTab === 'local' ? 'bg-white shadow-xs' : ''
              }`}>
              <Text
                className={`text-xs font-bold ${
                  selectedTab === 'local' ? 'text-slate-900' : 'text-slate-500'
                }`}>
                Local Gym
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedTab('outdoor')}
              activeOpacity={0.8}
              className={`flex-1 items-center justify-center rounded-xl py-2 ${
                selectedTab === 'outdoor' ? 'bg-white shadow-xs' : ''
              }`}>
              <Text
                className={`text-xs font-bold ${
                  selectedTab === 'outdoor' ? 'text-slate-900' : 'text-slate-500'
                }`}>
                Outdoor Pass
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── CARD 1: Local Subscription ───────────────────────────────── */}
          {(selectedTab === 'all' || selectedTab === 'local') && (
            <>
              {localSub ? (
                <View className="mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
                  {/* Card Header */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50">
                        <Ionicons name="barbell" size={20} color="#F6163C" />
                      </View>
                      <View>
                        <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Local Gym Plan
                        </Text>
                        <Text className="font-bold text-base text-slate-900">
                          {capitalize(localSub.planName)} Plan
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 border ${
                        localSub.subscriptionStatus === 'active'
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}>
                      <View
                        className={`h-2 w-2 rounded-full ${
                          localSub.subscriptionStatus === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <Text
                        className={`text-[11px] font-bold uppercase ${
                          localSub.subscriptionStatus === 'active' ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                        {localSub.subscriptionStatus || 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  {/* Details Grid */}
                  <View className="mt-4 flex-row flex-wrap gap-2.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
                    <View className="w-[47%]">
                      <Text className="text-[11px] font-medium text-slate-400">Valid Until</Text>
                      <Text className="mt-0.5 font-bold text-xs text-slate-800">
                        {formatDate(localSub.endDate)}
                      </Text>
                    </View>

                    <View className="w-[47%]">
                      <Text className="text-[11px] font-medium text-slate-400">Duration</Text>
                      <Text className="mt-0.5 font-bold text-xs text-slate-800">
                        {localSub.monthDuration} {localSub.monthDuration === 1 ? 'Month' : 'Months'}
                      </Text>
                    </View>

                    <View className="w-[47%]">
                      <Text className="text-[11px] font-medium text-slate-400">Plan Amount</Text>
                      <Text className="mt-0.5 font-bold text-xs text-slate-800">
                        {formatPrice(localSub.price)}
                      </Text>
                    </View>

                    <View className="w-[47%]">
                      <Text className="text-[11px] font-medium text-slate-400">Access Mode</Text>
                      <Text className="mt-0.5 font-bold text-xs text-slate-800">
                        {capitalize(localSub.membershipType || 'App')} Pass
                      </Text>
                    </View>
                  </View>

                  {/* Card Bottom CTA */}
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/membership')}
                    activeOpacity={0.7}
                    className="mt-3.5 flex-row items-center justify-between border-t border-slate-100 pt-3">
                    <Text className="font-bold text-xs text-[#F6163C]">Manage Membership</Text>
                    <Ionicons name="chevron-forward" size={16} color="#F6163C" />
                  </TouchableOpacity>
                </View>
              ) : selectedTab === 'local' ? (
                <View className="mb-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 items-center">
                  <Ionicons name="barbell-outline" size={36} color="#94A3B8" />
                  <Text className="mt-2 font-bold text-sm text-slate-800">No Local Gym Membership</Text>
                  <Text className="mt-1 text-center text-xs text-slate-400">
                    Get an unlimited monthly or annual membership to work out at partner gyms.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/membership/buy-membership' as any)}
                    activeOpacity={0.8}
                    className="mt-4 rounded-xl bg-[#F6163C] px-5 py-2.5">
                    <Text className="font-bold text-xs text-white">Explore Memberships</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}

          {/* ── CARD 2: Outdoor Subscription ──────────────────────────────── */}
          {(selectedTab === 'all' || selectedTab === 'outdoor') && (
            <>
              {outdoorSub ? (
                <View className="mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
                  {/* Card Header */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                        <Ionicons name="leaf" size={20} color="#059669" />
                      </View>
                      <View>
                        <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Outdoor Turf & Park
                        </Text>
                        <Text className="font-bold text-base text-slate-900">
                          {capitalize(outdoorSub.planName)} Pass
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 border ${
                        outdoorSub.subscriptionStatus === 'active'
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}>
                      <View
                        className={`h-2 w-2 rounded-full ${
                          outdoorSub.subscriptionStatus === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <Text
                        className={`text-[11px] font-bold uppercase ${
                          outdoorSub.subscriptionStatus === 'active' ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                        {outdoorSub.subscriptionStatus || 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  {/* Visit Tracker Box */}
                  <View className="mt-4 rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100">
                    <View className="flex-row items-baseline justify-between">
                      <Text className="text-xs font-semibold text-emerald-950">Visits Remaining</Text>
                      <View className="flex-row items-baseline gap-1">
                        <Text className="font-extrabold text-2xl text-emerald-700">
                          {outdoorSub.remainingVisits ?? 0}
                        </Text>
                        <Text className="font-medium text-xs text-slate-500">
                          / {outdoorSub.totalVisitsAllowed ?? 0} Allowed
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-emerald-200/60">
                      <View
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              ((outdoorSub.remainingVisits ?? 0) /
                                Math.max(1, outdoorSub.totalVisitsAllowed ?? 1)) *
                                100
                            )
                          )}%`,
                        }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </View>

                    {/* Metrics Row */}
                    <View className="mt-3 flex-row items-center justify-between border-t border-emerald-100/70 pt-2.5">
                      <Text className="text-[11px] font-medium text-slate-500">
                        Used Visits: <Text className="font-bold text-slate-800">{outdoorSub.usedVisits ?? 0}</Text>
                      </Text>
                      <Text className="text-[11px] font-medium text-slate-500">
                        Pass Price: <Text className="font-bold text-slate-800">{formatPrice(outdoorSub.price)}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Card Bottom CTA */}
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/outdoor-pass')}
                    activeOpacity={0.7}
                    className="mt-3.5 flex-row items-center justify-between border-t border-slate-100 pt-3">
                    <Text className="font-bold text-xs text-emerald-700">Explore Outdoor Gyms</Text>
                    <Ionicons name="chevron-forward" size={16} color="#059669" />
                  </TouchableOpacity>
                </View>
              ) : selectedTab === 'outdoor' ? (
                <View className="mb-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 items-center">
                  <Ionicons name="leaf-outline" size={36} color="#94A3B8" />
                  <Text className="mt-2 font-bold text-sm text-slate-800">No Outdoor Pass</Text>
                  <Text className="mt-1 text-center text-xs text-slate-400">
                    Get multi-day outdoor passes to train on outdoor turf and functional arenas.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/outdoorPass/buy-outdoor-pass' as any)}
                    activeOpacity={0.8}
                    className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5">
                    <Text className="font-bold text-xs text-white">Buy Outdoor Pass</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}

          {/* ── Empty State if No Subscriptions at all ──────────────────── */}
          {!localSub && !outdoorSub && (
            <View className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 items-center">
              <Ionicons name="card-outline" size={38} color="#94A3B8" />
              <Text className="mt-2.5 font-bold text-sm text-slate-800">No Active Subscriptions</Text>
              <Text className="mt-1 text-center text-xs text-slate-500">
                You don't have any active gym memberships or outdoor passes right now.
              </Text>
              <View className="mt-4 flex-row gap-2.5">
                <TouchableOpacity
                  onPress={() => router.push('/membership/buy-membership' as any)}
                  activeOpacity={0.8}
                  className="rounded-xl bg-[#F6163C] px-4 py-2.5">
                  <Text className="font-bold text-xs text-white">Buy Membership</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/outdoorPass/buy-outdoor-pass' as any)}
                  activeOpacity={0.8}
                  className="rounded-xl border border-emerald-600 bg-white px-4 py-2.5">
                  <Text className="font-bold text-xs text-emerald-700">Outdoor Pass</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
