import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WelcomePhoneStepProps {
  phone: string;
  onChangePhone: (val: string) => void;
  onSendOtp: () => void;
  onBack: () => void;
  passNumber?: string;
  inviteCode?: string;
  isPrefilled?: boolean;
}

export default function WelcomePhoneStep({
  phone,
  onChangePhone,
  onSendOtp,
  onBack,
  passNumber,
  inviteCode,
  isPrefilled,
}: WelcomePhoneStepProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 24,
      }}>
      <View>
        {/* Top Header with Back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        </View>

        {/* Fitfob Logo Centered */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 26, marginBottom: 8 }}>
          <Image
            source={require('@/assets/images/Vector.png')}
            style={{ width: 62, height: 62 }}
            resizeMode="contain"
          />
        </View>

        {/* Hero Heading & Subtitle */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: '#0F172A',
            letterSpacing: -0.5,
            marginTop: 18,
          }}>
          Welcome to Fitfob
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#64748B',
            marginTop: 8,
            lineHeight: 21,
          }}>
          Verify your phone number to access your gym membership.
        </Text>

        {/* Invite Pass Code Badge if present */}
        {(inviteCode || passNumber) ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECDD3',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginTop: 14,
              gap: 6,
            }}>
            <Ionicons name="ticket-outline" size={16} color="#E23744" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#E23744' }}>
              Pass #{passNumber || inviteCode}
            </Text>
          </View>
        ) : null}

        {/* Phone Number Field */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginTop: (inviteCode || passNumber) ? 18 : 28, marginBottom: 8 }}>
          Phone Number
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 52,
          }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
            +91
          </Text>
          <View style={{ width: 1, height: 22, backgroundColor: '#CBD5E1', marginHorizontal: 12 }} />
          <TextInput
            value={phone}
            onChangeText={onChangePhone}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
            placeholderTextColor="#94A3B8"
            maxLength={14}
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: '700',
              color: '#0F172A',
              paddingVertical: 0,
            }}
          />
          {phone.replace(/\D/g, '').length >= 10 && (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          )}
        </View>

        {/* Green pre-filled note */}
        {isPrefilled ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981' }}>
              Pre-filled from your invite link
            </Text>
          </View>
        ) : null}

        {/* Feature / Benefit Cards */}
        <View
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#F1F5F9',
            padding: 16,
            marginTop: 24,
            gap: 16,
          }}>
          {/* Feature 1 */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: '#FEF2F2',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
              <Ionicons name="shield-checkmark-outline" size={19} color="#E23744" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                Your membership is already paid
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 1 }}>
                No need to pay again
              </Text>
            </View>
          </View>

          {/* Feature 2 */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: '#FEF2F2',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
              <Ionicons name="qr-code-outline" size={19} color="#E23744" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                Get your digital entry pass
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 1 }}>
                Check in with a QR code at the gym
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Action CTA */}
      <View style={{ marginTop: 32 }}>
        <TouchableOpacity
          onPress={onSendOtp}
          activeOpacity={0.88}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: '#E23744',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#E23744',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}>
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
            Send OTP
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 11,
            fontWeight: '500',
            color: '#94A3B8',
            textAlign: 'center',
            marginTop: 12,
          }}>
          By continuing you agree to Fitfob's Terms & Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
}
