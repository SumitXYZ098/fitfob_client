import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface ClubMembershipPlan {
  id?: string | number;
  documentId?: string;
  plan?: string;
  planName: string;
  price: number;
  customerPrice?: number;
  monthDuration: number;
  isActive: boolean;
  validUpto: string;
  gymContract?: string;
  gymContractPlanRateDocumentId?: string;
  [key: string]: any;
}

export interface ActiveMembershipInfo {
  membershipId?: string;
  clubName?: string;
  plan?: string;
  startDate?: string;
  endDate?: string;
  membershipStatus?: string;
  clubCategory?: string;
  monthDuration?: number;
  [key: string]: any;
}

export interface GymMembershipPlansSectionProps {
  membershipPlans?: ClubMembershipPlan[];
  isAlreadyMember?: boolean;
  membershipClubName?: string;
  membershipClubDocumentId?: string;
  gymTitle: string;
  gymId: string;
  isDetailFetching?: boolean;
  activeSubscription?: ActiveMembershipInfo | null;
  isMemberOfThisClub?: boolean;
}

// Format plan identifier or name into readable label (e.g. "twelve_months" -> "12 Months Plan")
export function formatPlanName(plan?: string): string {
  if (!plan) return 'Membership Plan';
  const clean = plan.toLowerCase().replace(/_/g, ' ').trim();
  if (
    clean === 'twelve months' ||
    clean === '12 months' ||
    clean === 'annual' ||
    clean === 'twelve_months'
  ) {
    return '12 Months Plan';
  }
  if (clean === 'six months' || clean === '6 months' || clean === 'six_months') {
    return '6 Months Plan';
  }
  if (
    clean === 'three months' ||
    clean === '3 months' ||
    clean === 'three_months' ||
    clean === 'quarterly'
  ) {
    return '3 Months Plan';
  }
  if (
    clean === 'monthly' ||
    clean === '1 month' ||
    clean === 'one month' ||
    clean === 'one_month'
  ) {
    return 'Monthly Plan';
  }
  return (
    clean
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') + (clean.endsWith('plan') ? '' : ' Plan')
  );
}

// Format date into human-readable format (e.g. "17 Dec 2026")
export function formatMembershipDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// Determine if a specific plan card matches the user's active membership
function isPlanMatchingSubscription(
  planItem: ClubMembershipPlan,
  activeSub?: ActiveMembershipInfo | null
): boolean {
  if (!activeSub || !activeSub.plan) return false;
  const subPlanRaw = String(activeSub.plan).toLowerCase().replace(/_/g, '').trim();
  const itemPlanRaw = String(planItem.plan || '').toLowerCase().replace(/_/g, '').trim();
  const itemNameRaw = String(planItem.planName || '').toLowerCase().replace(/_/g, '').trim();

  // Direct match on plan identifier
  if (
    itemPlanRaw &&
    (itemPlanRaw === subPlanRaw ||
      subPlanRaw.includes(itemPlanRaw) ||
      itemPlanRaw.includes(subPlanRaw))
  ) {
    return true;
  }

  // Duration match based on months
  if (
    planItem.monthDuration === 1 &&
    subPlanRaw.includes('month') &&
    !subPlanRaw.includes('six') &&
    !subPlanRaw.includes('twelve') &&
    !subPlanRaw.includes('three') &&
    !subPlanRaw.includes('6') &&
    !subPlanRaw.includes('12') &&
    !subPlanRaw.includes('3')
  ) {
    return true;
  }
  if (
    planItem.monthDuration === 6 &&
    (subPlanRaw.includes('6') || subPlanRaw.includes('six') || subPlanRaw.includes('half'))
  ) {
    return true;
  }
  if (
    planItem.monthDuration === 12 &&
    (subPlanRaw.includes('12') ||
      subPlanRaw.includes('twelve') ||
      subPlanRaw.includes('annual') ||
      subPlanRaw.includes('year'))
  ) {
    return true;
  }
  if (
    planItem.monthDuration === 3 &&
    (subPlanRaw.includes('3') || subPlanRaw.includes('three') || subPlanRaw.includes('quarter'))
  ) {
    return true;
  }

  if (itemNameRaw && itemNameRaw.includes(subPlanRaw)) {
    return true;
  }

  return false;
}

function SkeletonBox({ style }: { style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={[{ backgroundColor: '#E2E8F0', opacity }, style]}
    />
  );
}

export default function GymMembershipPlansSection({
  membershipPlans,
  isAlreadyMember = false,
  membershipClubName,
  membershipClubDocumentId,
  gymTitle,
  gymId,
  isDetailFetching = false,
  activeSubscription,
  isMemberOfThisClub = false,
}: GymMembershipPlansSectionProps) {
  const router = useRouter();

  if (!membershipPlans || membershipPlans.length === 0) {
    if (isDetailFetching) {
      return (
        <View className="mt-7">
          <SkeletonBox style={{ height: 18, width: 150, borderRadius: 4, marginBottom: 12 }} />
          <SkeletonBox style={{ height: 110, width: '100%', borderRadius: 16, marginBottom: 10 }} />
          <SkeletonBox style={{ height: 110, width: '100%', borderRadius: 16 }} />
        </View>
      );
    }
    return null;
  }

  const maxDuration = Math.max(...membershipPlans.map((p) => p.monthDuration));
  const activeGymName =
    activeSubscription?.clubName || membershipClubName || (isMemberOfThisClub ? gymTitle : '');
  const activePlanFormatted = formatPlanName(activeSubscription?.plan);
  const activeEndDateFormatted = formatMembershipDate(activeSubscription?.endDate);

  return (
    <View className="mt-7">
      {/* ─── Section Header ──────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-extrabold text-base text-slate-900 tracking-tight">
              Membership Plans
            </Text>
            {isAlreadyMember ? (
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                <Text className="text-[10px] font-bold text-emerald-700">
                  Active Member
                </Text>
              </View>
            ) : (
              <View className="rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                <Text className="text-[10px] font-bold text-emerald-700">
                  {membershipPlans.length} Available
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 text-xs text-slate-500 font-medium">
            {isAlreadyMember
              ? !isMemberOfThisClub && activeGymName
                ? `You already have an active membership at ${activeGymName}`
                : `You already have an active membership for ${gymTitle}`
              : `Official club pricing for ${gymTitle}`}
          </Text>
        </View>
      </View>

      {/* ─── Active Membership Status Card (Displayed when user holds active membership) ──── */}
      {isAlreadyMember && (
        <View className="mb-4 overflow-hidden rounded-[22px] bg-slate-900 p-4 border border-slate-800 shadow-sm">
          {/* Top Row: Tag + Status badge */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 border border-emerald-500/30">
              <Ionicons name="shield-checkmark" size={13} color="#10B981" />
              <Text className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {isMemberOfThisClub ? 'CURRENT CLUB MEMBERSHIP' : 'ACTIVE AT ANOTHER CLUB'}
              </Text>
            </View>
            <View className="rounded-full bg-white/10 px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-white/90">
                {activeSubscription?.membershipStatus
                  ? String(activeSubscription.membershipStatus).toUpperCase()
                  : 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Enrolled Gym Name */}
          <View className="mt-3">
            <Text className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Enrolled Gym
            </Text>
            <Text className="font-extrabold text-[18px] text-white tracking-tight mt-0.5">
              {activeGymName || gymTitle}
            </Text>
          </View>

          {/* Plan Name & Validity */}
          <View className="mt-2.5 flex-row items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 border border-white/10">
            <View className="flex-1 pr-2">
              <Text className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Purchased Plan
              </Text>
              <Text className="font-bold text-sm text-white mt-0.5">
                {activePlanFormatted}
              </Text>
            </View>
            {activeEndDateFormatted ? (
              <View className="items-end">
                <Text className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Valid Until
                </Text>
                <Text className="font-semibold text-xs text-emerald-400 mt-0.5">
                  {activeEndDateFormatted}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Informational Message */}
          <Text className="mt-2.5 text-xs text-slate-300 font-medium leading-relaxed">
            {isMemberOfThisClub
              ? `You have unlimited access to ${gymTitle} under your active ${activePlanFormatted}. New plan purchases are paused while active.`
              : `You are enrolled at ${activeGymName}. Fitfob allows one active gym membership at a time.`}
          </Text>

          {/* Action button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/membership' as any)}
            activeOpacity={0.85}
            className="mt-3 flex-row items-center justify-center gap-1.5 rounded-xl bg-[#E23744] py-2.5 shadow-sm">
            <Ionicons name="card-outline" size={15} color="#FFFFFF" />
            <Text className="font-bold text-xs text-white">View Membership Pass in Wallet</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Plan Cards ─────────────────────────────────────────────────── */}
      <View className="gap-3">
        {membershipPlans.map((plan: ClubMembershipPlan, idx: number) => {
          const isBestValue = plan.monthDuration === maxDuration && plan.monthDuration > 1;
          const monthlyEquivalent =
            plan.monthDuration > 1 ? Math.round(plan.price / plan.monthDuration) : plan.price;
          const displayTitle = plan.planName.toLowerCase().endsWith('plan')
            ? plan.planName
            : `${plan.planName} Plan`;
          const cleanValidUpto = plan.validUpto.toLowerCase().endsWith('access')
            ? plan.validUpto
            : `${plan.validUpto} access`;
          const gymContractPlanRateDocumentId =
            plan.gymContractPlanRateDocumentId || plan.gymContract;

          const isThisActivePlan =
            isAlreadyMember &&
            isMemberOfThisClub &&
            isPlanMatchingSubscription(plan, activeSubscription);

          return (
            <TouchableOpacity
              key={
                plan.documentId
                  ? `${plan.documentId}-${idx}`
                  : plan.plan
                    ? `${plan.plan}-${idx}`
                    : idx
              }
              disabled={isAlreadyMember}
              activeOpacity={isAlreadyMember ? 1 : 0.9}
              onPress={() => {
                if (isAlreadyMember) return;
                router.push({
                  pathname: '/membership/buy-membership' as any,
                  params: {
                    gymName: gymTitle,
                    gymId: gymId,
                    selectedPlanId:
                      plan.documentId ||
                      (plan.id ? String(plan.id) : '') ||
                      plan.plan ||
                      String(idx),
                    selectedPlanName: displayTitle,
                    selectedPlanPrice: plan.price.toString(),
                    selectedPlanDuration: plan.monthDuration.toString(),
                    plans: JSON.stringify(membershipPlans),
                    gymContract: gymContractPlanRateDocumentId,
                  },
                });
              }}
              className={`overflow-hidden rounded-2xl border ${
                isThisActivePlan
                  ? 'border-2 border-emerald-500 bg-emerald-50/30'
                  : isAlreadyMember
                  ? 'border-slate-200 bg-slate-50/70 opacity-80'
                  : isBestValue
                  ? 'border-red-200 bg-red-50/20'
                  : 'border-slate-200 bg-white'
              } p-4 shadow-xs`}>
              {/* Top row: Plan Name + Duration badge + Price */}
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-xl ${
                      isThisActivePlan
                        ? 'bg-emerald-500/15'
                        : isAlreadyMember
                        ? 'bg-slate-200/80'
                        : 'bg-red-500/10'
                    }`}>
                    <Ionicons
                      name={isThisActivePlan ? 'checkmark-circle' : 'barbell-outline'}
                      size={18}
                      color={isThisActivePlan ? '#10B981' : isAlreadyMember ? '#64748B' : '#E23744'}
                    />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-bold text-base ${
                          isThisActivePlan
                            ? 'text-emerald-900'
                            : isAlreadyMember
                            ? 'text-slate-700'
                            : 'text-slate-900'
                        }`}>
                        {displayTitle}
                      </Text>
                      {isThisActivePlan ? (
                        <View className="flex-row items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5">
                          <Ionicons name="checkmark-circle" size={10} color="#FFFFFF" />
                          <Text className="text-[10px] font-bold text-white">
                            YOUR ACTIVE PLAN
                          </Text>
                        </View>
                      ) : isAlreadyMember ? (
                        <View className="rounded-full bg-slate-200/80 px-2 py-0.5 border border-slate-300">
                          <Text className="text-[10px] font-bold text-slate-600">
                            Disabled
                          </Text>
                        </View>
                      ) : isBestValue ? (
                        <View className="rounded-full bg-rose-50 px-2 py-0.5 border border-rose-200">
                          <Text className="text-[10px] font-bold text-[#E23744]">
                            Best Value
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Ionicons name="calendar-outline" size={12} color="#64748B" />
                      <Text className="text-xs font-semibold text-slate-500">
                        {plan.monthDuration} Month{plan.monthDuration > 1 ? 's' : ''} Duration
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price */}
                <View className="items-end">
                  <Text
                    className={`font-extrabold text-lg ${
                      isThisActivePlan
                        ? 'text-emerald-900'
                        : isAlreadyMember
                        ? 'text-slate-600'
                        : 'text-slate-900'
                    }`}>
                    ₹{plan.price.toLocaleString('en-IN')}
                  </Text>
                  {plan.monthDuration > 1 ? (
                    <Text
                      className={`text-[11px] font-semibold ${
                        isThisActivePlan
                          ? 'text-emerald-700'
                          : isAlreadyMember
                          ? 'text-slate-500'
                          : 'text-emerald-600'
                      }`}>
                      ₹{monthlyEquivalent.toLocaleString('en-IN')}/mo
                    </Text>
                  ) : (
                    <Text className="text-[11px] font-medium text-slate-400">/month</Text>
                  )}
                </View>
              </View>

              {/* Subtle Divider */}
              <View className="my-3 h-[1px] bg-slate-100" />

              {/* Plan Perks */}
              <View className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={isThisActivePlan ? '#10B981' : isAlreadyMember ? '#94A3B8' : '#16A34A'}
                  />
                  <Text className="text-xs text-slate-600 font-medium">
                    Unlimited check-ins ({cleanValidUpto})
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={isThisActivePlan ? '#10B981' : isAlreadyMember ? '#94A3B8' : '#16A34A'}
                  />
                  <Text className="text-xs text-slate-600 font-medium">
                    Full access to workout equipment & amenities
                  </Text>
                </View>
              </View>

              {/* Footer row: Button */}
              <View className="mt-3.5 flex-row items-center justify-between pt-2.5 border-t border-slate-100">
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color={isThisActivePlan ? '#10B981' : isAlreadyMember ? '#64748B' : '#16A34A'}
                  />
                  <Text className="text-[11px] font-medium text-slate-500">
                    {isThisActivePlan
                      ? 'Subscribed on this account'
                      : isAlreadyMember
                      ? 'Membership in use'
                      : 'Verified Partner Club'}
                  </Text>
                </View>
                {isThisActivePlan ? (
                  <View className="flex-row items-center gap-1.5 bg-emerald-600 px-3.5 py-1.5 rounded-xl">
                    <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      Current Plan Active
                    </Text>
                  </View>
                ) : isAlreadyMember ? (
                  <View className="flex-row items-center gap-1 bg-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-300">
                    <Ionicons name="lock-closed" size={11} color="#64748B" />
                    <Text className="text-xs font-bold text-slate-600">
                      {isMemberOfThisClub ? 'Other Plan Active' : `Active at ${activeGymName || 'Other Club'}`}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1 bg-[#E23744] px-3.5 py-1.5 rounded-xl">
                    <Text className="text-xs font-bold text-white">Select Plan</Text>
                    <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
