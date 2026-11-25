import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckoutDetails } from './CheckoutScreen';

interface PaymentPendingStepProps {
  details: CheckoutDetails;
  requestDate?: string;
  onViewDirections: () => void;
  onCancelRequest: () => void;
  onBack: () => void;
  // Simulation actions for design testing
  onSimulateDecline?: () => void;
  onSimulateApprove?: () => void;
}

export default function PaymentPendingStep({
  details,
  requestDate = '23 Nov 2026, 1:45 PM',
  onViewDirections,
  onCancelRequest,
  onBack,
  onSimulateDecline,
  onSimulateApprove,
}: PaymentPendingStepProps) {
  const formattedPrice =
    typeof details.price === 'number'
      ? `₹${details.price.toLocaleString('en-IN')}`
      : details.price.startsWith('₹')
      ? details.price
      : `₹${details.price}`;

  const gymDisplay = details.gymLocation
    ? `${details.gymName}, ${details.gymLocation}`
    : `${details.gymName}, Phase 7`;

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
              Pay at the {details.gymName} reception. Your QR code unlocks as soon as the gym approves.
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
                  {details.planName}
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
                  {requestDate}
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
            onPress={onViewDirections}
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
            onPress={onCancelRequest}
            activeOpacity={0.7}
            style={{
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>
              Cancel Request
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
