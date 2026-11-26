import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CheckoutDetails } from './CheckoutScreen';
import { useClientPendingApprovals } from '@/hook/useClient';

interface PaymentPendingStepProps {
  details: CheckoutDetails;
  requestDate?: string;
  isCancelling?: boolean;
  onViewDirections: () => void;
  onCancelRequest: (documentId?: string | number) => void;
  onBack: () => void;
  // Simulation actions for design testing
  onSimulateDecline?: () => void;
  onSimulateApprove?: () => void;
}

export default function PaymentPendingStep({
  details,
  requestDate = '23 Nov 2026, 1:45 PM',
  isCancelling = false,
  onViewDirections,
  onCancelRequest,
  onBack,
  onSimulateDecline,
  onSimulateApprove,
}: PaymentPendingStepProps) {
  const router = useRouter();

  // Poll pending approvals status every 5 seconds
  const { data: approvalsData, isLoading } = useClientPendingApprovals({
    refetchInterval: 5000,
  });

  // When response hasPendingApproval is false, redirect to /(tabs)/membership
  useEffect(() => {
    if (!isLoading && approvalsData && approvalsData.hasPendingApproval === false) {
      router.replace('/(tabs)/membership');
    }
  }, [isLoading, approvalsData, router]);

  // Extract pending approval record if returned
  const pendingApproval = useMemo(() => {
    if (!approvalsData?.hasPendingApproval) return null;
    const item = approvalsData.pendingApprovals;
    if (Array.isArray(item)) return item[0] || null;
    return item || null;
  }, [approvalsData]);

  const resolvedGymName = pendingApproval?.gymName || details.gymName;
  const resolvedGymLocation = pendingApproval?.gymAddress || details.gymLocation;
  const resolvedPlanName = pendingApproval?.planName || details.planName;
  const resolvedPrice =
    pendingApproval?.amountDue !== undefined ? pendingApproval.amountDue : details.price;

  const formatRequestDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const resolvedRequestDate =
    formatRequestDate(pendingApproval?.requestedAt) ||
    pendingApproval?.timeAgo ||
    requestDate;

  const formattedPrice =
    typeof resolvedPrice === 'number'
      ? `₹${resolvedPrice.toLocaleString('en-IN')}`
      : String(resolvedPrice).startsWith('₹')
      ? String(resolvedPrice)
      : `₹${resolvedPrice}`;

  const gymDisplay = resolvedGymLocation
    ? `${resolvedGymName}, ${resolvedGymLocation}`
    : resolvedGymName;

  const handleDirections = () => {
    if (
      pendingApproval?.gymLocation &&
      Array.isArray(pendingApproval.gymLocation) &&
      pendingApproval.gymLocation.length >= 2
    ) {
      // API location coordinates: [lng, lat]
      const [lng, lat] = pendingApproval.gymLocation;
      const mapUrl = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(resolvedGymName)})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      });
      Linking.openURL(mapUrl).catch(() => onViewDirections());
      return;
    }
    onViewDirections();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 24,
        }}>
        <View>
          {/* Top Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: 16,
            }}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={{
                position: 'absolute',
                left: 0,
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F8FAFC',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="chevron-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
              Payment Status
            </Text>
          </View>

          {/* Hero Clock Icon */}
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: '#FEF9C3',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
              <Ionicons name="time" size={36} color="#CA8A04" />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#0F172A',
                letterSpacing: -0.3,
                textAlign: 'center',
              }}>
              Payment Pending Approval
            </Text>

            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#64748B',
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 20,
                paddingHorizontal: 12,
              }}>
              Pay at the {resolvedGymName} reception. Your QR code unlocks as soon as the gym approves.
            </Text>
          </View>

          {/* Receipt / Details Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 20,
              padding: 18,
              marginTop: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}>
            {/* Top row: Amount due at gym + Pending tag */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
                  Amount due at gym
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '900',
                    color: '#0F172A',
                    marginTop: 2,
                  }}>
                  {formattedPrice}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF9C3',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#EAB308',
                    marginRight: 6,
                  }}
                />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#CA8A04' }}>
                  Pending
                </Text>
              </View>
            </View>

            {/* Subtle Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: '#F1F5F9',
                marginBottom: 14,
              }}
            />

            {/* Key-Value Details */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>
                  Plan
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                  {resolvedPlanName}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>
                  Gym
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#0F172A',
                    maxWidth: 200,
                    textAlign: 'right',
                  }}>
                  {gymDisplay}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>
                  Pay by
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                  Cash or Reception UPI
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>
                  Requested
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                  {resolvedRequestDate}
                </Text>
              </View>
            </View>

            {/* Info callout at bottom of receipt */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 14,
                padding: 12,
                marginTop: 16,
              }}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#64748B"
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: '#64748B',
                  flex: 1,
                  lineHeight: 16,
                }}>
                You can't send another request to this gym until this one is approved, rejected or cancelled.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity
            onPress={handleDirections}
            activeOpacity={0.88}
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: '#E23744',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#E23744',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}>
            <Ionicons name="navigate" size={17} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
              View Directions to Gym
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isCancelling) return;
              onCancelRequest(pendingApproval?.documentId || pendingApproval?.id);
            }}
            disabled={isCancelling}
            activeOpacity={0.7}
            style={{
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isCancelling ? 0.6 : 1,
            }}>
            {isCancelling ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>
                Cancel Request
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
