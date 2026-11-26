import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';

export interface CheckoutDetails {
  gymName: string;
  gymLocation?: string;
  planName: string;
  price: number | string;
  duration?: string;
}

interface CheckoutScreenProps {
  details: CheckoutDetails;
  initialMode?: 'online' | 'gym';
  isLoading?: boolean;
  onPayOnline: () => void;
  onPayAtGym: () => void;
  onBack: () => void;
}

export default function CheckoutScreen({
  details,
  initialMode = 'online',
  isLoading = false,
  onPayOnline,
  onPayAtGym,
  onBack,
}: CheckoutScreenProps) {
  const [paymentMode, setPaymentMode] = useState<'online' | 'gym'>(initialMode);

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
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 24,
        }}>
        {/* Top Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: 20,
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
            Checkout
          </Text>
        </View>

        {/* Selected Plan Summary Card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#F1F5F9',
            borderRadius: 18,
            padding: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
            {/* Red Squircle Dumbbell Icon */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#E23744',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Rect x="2" y="7.5" width="2.5" height="9" rx="1.2" fill="#FFFFFF" />
                <Rect x="6" y="5.5" width="2.5" height="13" rx="1.2" fill="#FFFFFF" />
                <Rect x="8.5" y="10.5" width="7" height="3" rx="1" fill="#FFFFFF" />
                <Rect x="15.5" y="5.5" width="2.5" height="13" rx="1.2" fill="#FFFFFF" />
                <Rect x="19.5" y="7.5" width="2.5" height="9" rx="1.2" fill="#FFFFFF" />
              </Svg>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>
                {details.gymName}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 1 }}>
                {details.planName}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 17, fontWeight: '900', color: '#E23744' }}>
            {formattedPrice}
          </Text>
        </View>

        {/* Section Title */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: -0.2,
            marginTop: 26,
            marginBottom: 14,
          }}>
          How would you like to pay?
        </Text>

        {/* Option 1: Pay Online Now */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setPaymentMode('online')}
          style={{
            borderRadius: 20,
            borderWidth: paymentMode === 'online' ? 1.5 : 1,
            borderColor: paymentMode === 'online' ? '#E23744' : '#E2E8F0',
            backgroundColor: paymentMode === 'online' ? '#FEF2F2' : '#FFFFFF',
            padding: 16,
            marginBottom: 14,
            shadowColor: paymentMode === 'online' ? '#E23744' : '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: paymentMode === 'online' ? 0.08 : 0.02,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Custom Radio Button */}
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: paymentMode === 'online' ? '#E23744' : '#CBD5E1',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
                marginRight: 12,
              }}>
              {paymentMode === 'online' && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#E23744',
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              {/* Title & Recommended Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                  Pay Online Now
                </Text>
                <View
                  style={{
                    backgroundColor: '#ECFDF5',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                    marginLeft: 8,
                  }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>
                    Recommended
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: '#64748B',
                  marginTop: 3,
                }}>
                Pay with UPI, Card or Net Banking
              </Text>

              {/* Method Chips */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                }}>
                {['UPI', 'Card', 'Net Banking'].map((chip) => (
                  <View
                    key={chip}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                      {chip}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Instant Activation Benefit */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: paymentMode === 'online' ? '#FECDD3' : '#F1F5F9',
                }}>
                <Ionicons name="flash" size={14} color="#16A34A" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>
                  Instant activation — QR unlocks right away
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Option 2: Pay Directly at Gym */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setPaymentMode('gym')}
          style={{
            borderRadius: 20,
            borderWidth: paymentMode === 'gym' ? 1.5 : 1,
            borderColor: paymentMode === 'gym' ? '#E23744' : '#E2E8F0',
            backgroundColor: paymentMode === 'gym' ? '#FEF2F2' : '#FFFFFF',
            padding: 16,
            shadowColor: paymentMode === 'gym' ? '#E23744' : '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: paymentMode === 'gym' ? 0.08 : 0.02,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Custom Radio Button */}
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: paymentMode === 'gym' ? '#E23744' : '#CBD5E1',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
                marginRight: 12,
              }}>
              {paymentMode === 'gym' && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#E23744',
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                Pay Directly at Gym
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: '#64748B',
                  marginTop: 3,
                }}>
                Pay by Cash or UPI at the front desk
              </Text>

              {/* Method Chips */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                }}>
                {['Cash', 'Reception UPI'].map((chip) => (
                  <View
                    key={chip}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                      {chip}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Approval Notice */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: paymentMode === 'gym' ? '#FECDD3' : '#F1F5F9',
                }}>
                <Ionicons name="time-outline" size={14} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                  Needs gym owner approval after you pay
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
            Total
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>
            {formattedPrice}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (isLoading) return;
            if (paymentMode === 'online') {
              onPayOnline();
            } else {
              onPayAtGym();
            }
          }}
          disabled={isLoading}
          activeOpacity={0.88}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#E23744',
            borderRadius: 16,
            paddingHorizontal: 22,
            height: 50,
            gap: 8,
            shadowColor: '#E23744',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
            opacity: isLoading ? 0.75 : 1,
          }}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : paymentMode === 'online' ? (
            <>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                Pay {formattedPrice} Online
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                Send Request to Gym
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
