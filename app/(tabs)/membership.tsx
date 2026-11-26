import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import {
  useClientSubscriptions,
  useClientPendingApprovals,
  ClientSubscriptionItem,
} from '@/hook/useClient';
import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';
import GradientDivider from '@/components/GradientDivider';

export default function MembershipScreen() {
  const router = useRouter();
  const { togglePausePass } = useOutdoorPassStore();
  const { data: subscriptionsData, isLoading, refetch, isRefetching } = useClientSubscriptions();
  const { data: pendingApprovalsData } = useClientPendingApprovals();
  const hasPendingApproval = Boolean(pendingApprovalsData?.hasPendingApproval);
  const pendingApproval = useMemo(() => {
    if (!pendingApprovalsData?.hasPendingApproval) return null;
    const item = pendingApprovalsData.pendingApprovals;
    if (Array.isArray(item)) return item[0] || null;
    return item || null;
  }, [pendingApprovalsData]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'expired' | 'all'>('active');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (e) {
      console.error('Error refreshing subscriptions:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Extract raw subscriptions list from API
  const subscriptions: ClientSubscriptionItem[] = useMemo(() => {
    if (!subscriptionsData) return [];
    if (Array.isArray(subscriptionsData?.data)) return subscriptionsData.data;
    if (Array.isArray(subscriptionsData)) return subscriptionsData;
    return [];
  }, [subscriptionsData]);

  // Split into active and expired lists
  const activeList = useMemo(
    () =>
      subscriptions.filter(
        (s) =>
          (s.membershipStatus || '').toLowerCase() === 'active' ||
          (s.membershipStatus || '').toLowerCase() === 'paused'
      ),
    [subscriptions]
  );

  const expiredList = useMemo(
    () =>
      subscriptions.filter(
        (s) => (s.membershipStatus || '').toLowerCase() === 'expired'
      ),
    [subscriptions]
  );

  // Automatically switch tab if current tab has no items
  useEffect(() => {
    if (!isLoading && subscriptions.length > 0) {
      if (activeList.length === 0 && expiredList.length > 0 && selectedTab === 'active') {
        setSelectedTab('expired');
      }
    }
  }, [isLoading, subscriptions.length, activeList.length, expiredList.length, selectedTab]);

  // Filtered list based on selected tab
  const displayedList = useMemo(() => {
    if (selectedTab === 'active') {
      return activeList.length > 0
        ? activeList
        : subscriptions.filter((s) => (s.membershipStatus || '').toLowerCase() !== 'expired');
    }
    if (selectedTab === 'expired') {
      return expiredList;
    }
    return subscriptions;
  }, [selectedTab, activeList, expiredList, subscriptions]);

  // Copy membership ID to clipboard
  const handleCopyId = async (id?: string) => {
    if (!id) return;
    await Clipboard.setStringAsync(id);
    Toast.show({
      type: 'success',
      text1: 'Copied to Clipboard!',
      text2: `Membership ID: ${id}`,
    });
  };

  // Handle Pause/Resume membership
  const handleTogglePause = (sub: ClientSubscriptionItem) => {
    const isPaused = (sub.membershipStatus || '').toLowerCase() === 'paused';
    if (isPaused) {
      Alert.alert(
        'Resume Pass?',
        `Your membership for ${sub.clubName || 'this club'} will be reactivated immediately.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resume',
            onPress: () => {
              togglePausePass();
              Toast.show({
                type: 'info',
                text1: 'Membership Resumed',
                text2: 'Your membership is active again.',
              });
              refetch();
            },
          },
        ]
      );
    } else {
      router.push('/membership/pause-membership' as any);
    }
  };

  // Helper to format dates (e.g. "2026-11-14" -> "14 Nov 2026")
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

  // Helper to format plan name (e.g. "twelve_months" -> "12 Months Plan")
  const formatPlanName = (plan?: string) => {
    if (!plan) return 'Membership Plan';
    const clean = plan.toLowerCase().replace(/_/g, ' ').trim();
    if (clean === 'twelve months' || clean === '12 months' || clean === 'annual') return '12 Months Plan';
    if (clean === 'six months' || clean === '6 months') return '6 Months Plan';
    if (clean === 'three months' || clean === '3 months') return '3 Months Plan';
    if (clean === 'monthly' || clean === '1 month' || clean === 'one month') return 'Monthly Plan';
    return (
      clean
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') + (clean.endsWith('plan') ? '' : ' Plan')
    );
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return null;
    try {
      const end = new Date(endDateStr).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 1. Top Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/(tabs)');
            }
          }}
          className="h-10 w-10 items-center justify-center -ml-2"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-semibold text-[17px] text-slate-800 tracking-tight">
          Your Membership
        </Text>

        <TouchableOpacity
          onPress={() => refetch()}
          className="h-10 w-10 items-center justify-center -mr-2"
          activeOpacity={0.7}>
          <Ionicons
            name="refresh"
            size={19}
            color={isRefetching ? '#E23744' : '#64748B'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E23744']}
            tintColor="#E23744"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 120,
        }}>
        {/* Pending Approval Banner */}
        {hasPendingApproval && pendingApproval && (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/membership/checkout' as any,
                params: {
                  initialStep: 'pending',
                  documentId: pendingApproval.documentId,
                },
              })
            }
            activeOpacity={0.88}
            className="mb-4 flex-row items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xs">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Ionicons name="time" size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-bold text-sm text-slate-900" numberOfLines={1}>
                    {pendingApproval.gymName || 'Gym Approval'}
                  </Text>
                  <View className="rounded-full bg-amber-200 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-amber-800">Pending</Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                  {pendingApproval.planName || 'Membership'} • ₹{pendingApproval.amountDue || 0}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Loading Spinner */}
        {isLoading && !refreshing ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#E23744" />
            <Text className="mt-3 text-xs font-semibold text-slate-500">
              Loading your memberships...
            </Text>
          </View>
        ) : subscriptions.length === 0 ? (
          /* Empty State */
          <View className="py-16 items-center justify-center px-4">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-4">
              <Ionicons name="card-outline" size={40} color="#E23744" />
            </View>
            <Text className="font-bold text-lg text-slate-800 text-center">
              No Memberships Found
            </Text>
            <Text className="mt-1.5 text-xs text-slate-500 text-center leading-relaxed max-w-[280px]">
              You haven't purchased any gym memberships yet. Browse clubs and start your workout today!
            </Text>
            <TouchableOpacity
              onPress={() => router.navigate('/(tabs)')}
              activeOpacity={0.85}
              className="mt-6 rounded-2xl bg-[#E23744] px-6 py-3.5 shadow-md shadow-[#E23744]/25">
              <Text className="font-bold text-sm text-white">Explore Gyms</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Filter Tabs if multiple memberships exist */}
            {subscriptions.length > 1 && (
              <View className="flex-row items-center gap-2 mb-4">
                <TouchableOpacity
                  onPress={() => setSelectedTab('active')}
                  activeOpacity={0.8}
                  className={`px-4 py-2 rounded-full border ${
                    selectedTab === 'active'
                      ? 'bg-[#E23744] border-[#E23744]'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      selectedTab === 'active' ? 'text-white' : 'text-slate-600'
                    }`}>
                    Active ({activeList.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedTab('expired')}
                  activeOpacity={0.8}
                  className={`px-4 py-2 rounded-full border ${
                    selectedTab === 'expired'
                      ? 'bg-[#E23744] border-[#E23744]'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      selectedTab === 'expired' ? 'text-white' : 'text-slate-600'
                    }`}>
                    Expired ({expiredList.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedTab('all')}
                  activeOpacity={0.8}
                  className={`px-4 py-2 rounded-full border ${
                    selectedTab === 'all'
                      ? 'bg-[#E23744] border-[#E23744]'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      selectedTab === 'all' ? 'text-white' : 'text-slate-600'
                    }`}>
                    All ({subscriptions.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* List of Subscriptions */}
            <View className="gap-5">
              {displayedList.map((sub, index) => {
                const isExpired = (sub.membershipStatus || '').toLowerCase() === 'expired';
                const isPaused = (sub.membershipStatus || '').toLowerCase() === 'paused';
                const daysRemaining = getDaysRemaining(sub.endDate);
                const displayPlan = formatPlanName(sub.plan);
                const category = sub.clubCategory || 'Luxury';

                if (isExpired) {
                  // Expired Membership Card
                  return (
                    <View
                      key={sub.membershipId || index}
                      className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5 shadow-xs">
                      {/* Header */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <View className="flex-row items-center gap-2">
                            <Text className="font-bold text-[17px] text-slate-800 tracking-tight">
                              {sub.clubName || 'Club Membership'}
                            </Text>
                            <View className="rounded-full bg-slate-200 px-2.5 py-0.5 border border-slate-300">
                              <Text className="text-[10px] font-bold text-slate-600">
                                EXPIRED
                              </Text>
                            </View>
                          </View>
                          <Text className="mt-1 text-xs text-slate-500 font-medium">
                            {displayPlan} • Expired on {formatDate(sub.endDate)}
                          </Text>
                        </View>

                        <View className="flex-row items-center rounded-full bg-white px-2.5 py-1 border border-slate-200">
                          <Ionicons name="diamond-outline" size={12} color="#64748B" />
                          <Text className="ml-1 text-[11px] font-semibold text-slate-600">
                            {category}
                          </Text>
                        </View>
                      </View>

                      {/* ID Box */}
                      <TouchableOpacity
                        onPress={() => handleCopyId(sub.membershipId)}
                        activeOpacity={0.88}
                        className="mt-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 border border-slate-200">
                        <Text className="font-mono text-xs font-semibold text-slate-700">
                          ID: {sub.membershipId || 'N/A'}
                        </Text>
                        <Ionicons name="copy-outline" size={16} color="#64748B" />
                      </TouchableOpacity>

                      {/* Renew Button */}
                      <TouchableOpacity
                        onPress={() => router.navigate('/(tabs)')}
                        activeOpacity={0.85}
                        className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-[#E23744] py-3 shadow-xs">
                        <Ionicons name="refresh" size={15} color="#FFFFFF" />
                        <Text className="font-bold text-xs text-white">Renew Membership</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                // Active / Paused Membership Card
                return (
                  <View key={sub.membershipId || index} className="gap-5">
                    {/* Red Brand Membership Card */}
                    <View className="relative overflow-hidden rounded-[26px] bg-[#E23744] p-5 shadow-sm">
                      {/* Decorative Waves */}
                      <Svg
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 220,
                          height: '100%',
                        }}
                        viewBox="0 0 220 180"
                        preserveAspectRatio="none">
                        <Path
                          d="M 50,0 C 130,40 60,110 220,130 L 220,0 Z"
                          fill="rgba(255, 255, 255, 0.08)"
                        />
                        <Path
                          d="M 100,0 C 170,55 110,125 220,165 L 220,0 Z"
                          fill="rgba(255, 255, 255, 0.12)"
                        />
                        <Path
                          d="M 150,0 C 205,65 170,135 220,180 L 220,0 Z"
                          fill="rgba(255, 255, 255, 0.08)"
                        />
                      </Svg>

                      {/* Card Header */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="font-bold text-[19px] text-white tracking-tight">
                            {sub.clubName || 'Club Membership'}
                          </Text>
                          <View className="flex-row items-center gap-1.5 mt-1">
                            <Text className="text-[12px] font-medium text-white/95">
                              {displayPlan}
                            </Text>
                            <Text className="text-[12px] text-white/70">•</Text>
                            <Text className="text-[12px] font-normal text-white/90">
                              Expires on {formatDate(sub.endDate)}
                            </Text>
                          </View>
                        </View>

                        {/* Category Pill Badge */}
                        <View className="flex-row items-center rounded-full bg-white px-3 py-1 shadow-xs">
                          <Ionicons name="diamond" size={13} color="#E23744" />
                          <Text className="ml-1.5 font-semibold text-[12px] text-[#E23744]">
                            {category}
                          </Text>
                        </View>
                      </View>

                      {/* White Pass ID Box with Copy Button */}
                      <TouchableOpacity
                        onPress={() => handleCopyId(sub.membershipId)}
                        activeOpacity={0.88}
                        className="mt-5 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-xs">
                        <View className="flex-1 pr-2">
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Membership ID
                          </Text>
                          <Text className="font-mono font-semibold text-[13.5px] text-slate-800 mt-0.5">
                            {sub.membershipId || 'N/A'}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {isPaused ? (
                            <View className="rounded-full bg-amber-100 px-2.5 py-0.5 border border-amber-200">
                              <Text className="font-bold text-[10px] text-amber-800">
                                PAUSED
                              </Text>
                            </View>
                          ) : (
                            <View className="rounded-full bg-emerald-100 px-2.5 py-0.5 border border-emerald-200">
                              <Text className="font-bold text-[10px] text-emerald-800">
                                ACTIVE
                              </Text>
                            </View>
                          )}
                          <Ionicons name="copy" size={18} color="#E23744" />
                        </View>
                      </TouchableOpacity>

                      {/* Expiry / Days remaining indicator */}
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <View className="mt-3 flex-row items-center gap-1.5">
                          <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
                          <Text className="text-[11px] font-medium text-white/90">
                            {daysRemaining} day{daysRemaining > 1 ? 's' : ''} remaining in this pass
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Quick Action: Scan QR Button */}
                    <TouchableOpacity
                      onPress={() => router.navigate('/(tabs)/scan')}
                      activeOpacity={0.85}
                      className="flex-row items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 shadow-xs">
                      <Ionicons name="qr-code" size={18} color="#FFFFFF" />
                      <Text className="font-bold text-sm text-white">
                        Scan QR & Check In
                      </Text>
                    </TouchableOpacity>

                    {/* Membership Benefits Card */}
                    <View className="rounded-[24px] bg-[#F8FAFC] p-5 border border-slate-100">
                      <Text className="font-bold text-[15px] text-slate-800 pb-3">
                        {category} Membership Benefits
                      </Text>

                      <GradientDivider />

                      <View className="pt-3.5 gap-3">
                        <View className="flex-row items-center">
                          <View className="h-5 w-5 items-center justify-center rounded-[6px] bg-[#DCFCE7] mr-3">
                            <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                          </View>
                          <Text className="font-normal text-[13.5px] text-slate-600">
                            Full club access to {sub.clubName}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="h-5 w-5 items-center justify-center rounded-[6px] bg-[#DCFCE7] mr-3">
                            <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                          </View>
                          <Text className="font-normal text-[13.5px] text-slate-600">
                            Plan: {displayPlan}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="h-5 w-5 items-center justify-center rounded-[6px] bg-[#DCFCE7] mr-3">
                            <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                          </View>
                          <Text className="font-normal text-[13.5px] text-slate-600">
                            Valid: {formatDate(sub.startDate)} to {formatDate(sub.endDate)}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="h-5 w-5 items-center justify-center rounded-[6px] bg-[#DCFCE7] mr-3">
                            <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                          </View>
                          <Text className="font-normal text-[13.5px] text-slate-600">
                            Unlimited daily workout check-ins
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="h-5 w-5 items-center justify-center rounded-[6px] bg-[#DCFCE7] mr-3">
                            <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                          </View>
                          <Text className="font-normal text-[13.5px] text-slate-600">
                            Access to workout equipment & standard amenities
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Pause / Resume Button */}
                    <TouchableOpacity
                      onPress={() => handleTogglePause(sub)}
                      activeOpacity={0.8}
                      className="w-full items-center justify-center rounded-2xl border border-[#E23744] bg-white py-3.5">
                      <Text className="font-bold text-[15px] text-[#E23744]">
                        {isPaused ? 'Resume Pass' : 'Pause Membership'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
