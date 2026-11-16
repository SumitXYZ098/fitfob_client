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

interface GymMembershipPlansSectionProps {
  membershipPlans?: ClubMembershipPlan[];
  isAlreadyMember?: boolean;
  membershipClubName?: string;
  gymTitle: string;
  gymId: string;
  isDetailFetching?: boolean;
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
  gymTitle,
  gymId,
  isDetailFetching = false,
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
              ? membershipClubName && membershipClubName.toLowerCase().trim() !== gymTitle.toLowerCase().trim()
                ? `You already have an active membership at ${membershipClubName}`
                : `You already have an active membership for ${gymTitle}`
              : `Official club pricing for ${gymTitle}`}
          </Text>
        </View>
      </View>

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
              className={`overflow-hidden rounded-2xl border ${isAlreadyMember
                ? 'border-slate-200 bg-slate-50/70 opacity-80'
                : isBestValue
                  ? 'border-red-200 bg-red-50/20'
                  : 'border-slate-200 bg-white'
                } p-4 shadow-xs`}>
              {/* Top row: Plan Name + Duration badge + Price */}
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-xl ${isAlreadyMember ? 'bg-slate-200/80' : 'bg-red-500/10'
                      }`}>
                    <Ionicons
                      name="barbell-outline"
                      size={18}
                      color={isAlreadyMember ? '#64748B' : '#E23744'}
                    />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-bold text-base ${isAlreadyMember ? 'text-slate-700' : 'text-slate-900'
                          }`}>
                        {displayTitle}
                      </Text>
                      {isAlreadyMember ? (
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
                    className={`font-extrabold text-lg ${isAlreadyMember ? 'text-slate-600' : 'text-slate-900'
                      }`}>
                    ₹{plan.price.toLocaleString('en-IN')}
                  </Text>
                  {plan.monthDuration > 1 ? (
                    <Text
                      className={`text-[11px] font-semibold ${isAlreadyMember ? 'text-slate-500' : 'text-emerald-600'
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
                    color={isAlreadyMember ? '#94A3B8' : '#16A34A'}
                  />
                  <Text className="text-xs text-slate-600 font-medium">
                    Unlimited check-ins ({cleanValidUpto})
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={isAlreadyMember ? '#94A3B8' : '#16A34A'}
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
                    color={isAlreadyMember ? '#64748B' : '#16A34A'}
                  />
                  <Text className="text-[11px] font-medium text-slate-500">
                    {isAlreadyMember ? 'Membership in use' : 'Verified Partner Club'}
                  </Text>
                </View>
                {isAlreadyMember ? (
                  <View className="flex-row items-center gap-1 bg-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-300">
                    <Ionicons name="lock-closed" size={11} color="#64748B" />
                    <Text className="text-xs font-bold text-slate-600">
                      Already Subscribed
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
