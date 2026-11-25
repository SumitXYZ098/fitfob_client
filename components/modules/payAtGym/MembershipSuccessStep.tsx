import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckoutDetails } from './CheckoutScreen';

interface MembershipSuccessStepProps {
  details: CheckoutDetails;
  validTill?: string;
  paymentMethodLabel?: string;
  onViewEntryQr: () => void;
  onBack?: () => void;
}

export default function MembershipSuccessStep({
  details,
  validTill = '23 Feb 2027',
  paymentMethodLabel = 'Online (UPI)',
  onViewEntryQr,
  onBack,
}: MembershipSuccessStepProps) {
  const formattedPrice =
    typeof details.price === 'number'
      ? `₹${details.price.toLocaleString('en-IN')}`
      : details.price.startsWith('₹')
      ? details.price
      : `₹${details.price}`;

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
          {/* Top Bar with Optional Back */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              height: 38,
            }}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#F8FAFC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="chevron-back" size={22} color="#0F172A" />
              </TouchableOpacity>
            ) : (
              <View />
            )}
          </View>

          {/* Hero Green Checkmark */}
          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: '#DCFCE7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
              <Ionicons name="checkmark" size={42} color="#16A34A" />
            </View>

            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: '#0F172A',
                letterSpacing: -0.4,
                textAlign: 'center',
              }}>
              You're in!
            </Text>

            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#64748B',
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 20,
                paddingHorizontal: 20,
              }}>
              Your {details.planName} membership at {details.gymName} is active. Your entry QR code is unlocked.
            </Text>
          </View>

          {/* Receipt / Key-Value Details */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 20,
              padding: 18,
              marginTop: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}>
                  Plan
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                  {details.planName}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}>
                  Valid till
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                  {validTill}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}>
                  Paid
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                  {formattedPrice} · {paymentMethodLabel}
                </Text>
              </View>
            </View>
          </View>

          {/* Note below details */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: '#94A3B8',
              textAlign: 'center',
              marginTop: 14,
            }}>
            Also shown after the gym approves a 'Pay at Gym' request
          </Text>
        </View>

        {/* Bottom CTA Button */}
        <View style={{ marginTop: 28 }}>
          <TouchableOpacity
            onPress={onViewEntryQr}
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
            <Ionicons name="qr-code" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
              View My Entry QR
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
