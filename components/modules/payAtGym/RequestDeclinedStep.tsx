import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckoutDetails } from './CheckoutScreen';

interface RequestDeclinedStepProps {
  details: CheckoutDetails;
  onPayOnlineNow: () => void;
  onSendNewRequest: () => void;
  onBack: () => void;
}

export default function RequestDeclinedStep({
  details,
  onPayOnlineNow,
  onSendNewRequest,
  onBack,
}: RequestDeclinedStepProps) {
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

          {/* Hero Red Cross Icon */}
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
              <Ionicons name="close" size={38} color="#DC2626" />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#0F172A',
                letterSpacing: -0.3,
                textAlign: 'center',
              }}>
              Request Declined
            </Text>

            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#64748B',
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 20,
                paddingHorizontal: 16,
              }}>
              {details.gymName} couldn't confirm your payment. Send a new request or pay online for instant access.
            </Text>
          </View>

          {/* Summary Card with Declined Tag */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 20,
              padding: 18,
              marginTop: 26,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                {details.planName}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2 }}>
                {gymDisplay}
              </Text>

              {/* Red Declined Badge */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEE2E2',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                  marginTop: 8,
                }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#DC2626',
                    marginRight: 5,
                  }}
                />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>
                  Declined
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
              {formattedPrice}
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={{ marginTop: 28, gap: 10 }}>
          <TouchableOpacity
            onPress={onPayOnlineNow}
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
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
              Pay Online Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSendNewRequest}
            activeOpacity={0.8}
            style={{
              height: 50,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E23744',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ color: '#E23744', fontSize: 14, fontWeight: '800' }}>
              Send New Request
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
