import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Circle } from 'react-native-svg';

interface ClaimMembershipStepProps {
  onClaim: () => void;
  onBack: () => void;
  memberName?: string;
  passNumber?: string;
  gymName?: string;
}

export default function ClaimMembershipStep({
  onClaim,
  onBack,
  memberName = 'Rohit',
  passNumber,
  gymName = 'PowerHouse Gym',
}: ClaimMembershipStepProps) {
  return (
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
        {/* Top Back Button */}
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
            marginBottom: 12,
          }}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        {/* Top Greeting */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>
          Hi {memberName}
        </Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '900',
            color: '#0F172A',
            letterSpacing: -0.4,
            marginTop: 2,
          }}>
          Your gym pass is ready
        </Text>

        {/* Green Alert Banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: '#ECFDF5',
            borderWidth: 1,
            borderColor: '#D1FAE5',
            borderRadius: 18,
            padding: 14,
            marginTop: 18,
          }}>
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#10B981"
            style={{ marginTop: 1, marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#065F46' }}>
              Good news, {memberName}!
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#047857', marginTop: 2, lineHeight: 18 }}>
              {gymName} has linked your active membership to Fitfob.
            </Text>
          </View>
        </View>

        {/* Red / Crimson Gym Pass Card */}
        <LinearGradient
          colors={['#D82233', '#B81423', '#8C0D1A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 22,
            marginTop: 18,
            overflow: 'hidden',
            position: 'relative',
            shadowColor: '#8C0D1A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 8,
          }}>
          {/* Subtle Decorative Curves in Background (as shown in image) */}
          <Svg
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 240,
              height: '100%',
            }}
            viewBox="0 0 240 200"
            preserveAspectRatio="none">
            {/* Top-right subtle darker circle curve */}
            <Circle cx="190" cy="30" r="110" fill="rgba(0, 0, 0, 0.08)" />
            {/* Bottom-right subtle darker circle curve */}
            <Circle cx="210" cy="150" r="95" fill="rgba(0, 0, 0, 0.09)" />
          </Svg>

          {/* Card Header: Dumbbell Icon, Gym Details & ACTIVE Pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
              {/* Soft Translucent Rounded Square with Barbell Icon */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  {/* Left outer plate */}
                  <Rect x="2" y="7.5" width="2.5" height="9" rx="1.2" fill="#FFFFFF" />
                  {/* Left inner plate */}
                  <Rect x="6" y="5.5" width="2.5" height="13" rx="1.2" fill="#FFFFFF" />
                  {/* Center bar */}
                  <Rect x="8.5" y="10.5" width="7" height="3" rx="1" fill="#FFFFFF" />
                  {/* Right inner plate */}
                  <Rect x="15.5" y="5.5" width="2.5" height="13" rx="1.2" fill="#FFFFFF" />
                  {/* Right outer plate */}
                  <Rect x="19.5" y="7.5" width="2.5" height="9" rx="1.2" fill="#FFFFFF" />
                </Svg>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 }}>
                  PowerHouse Gym
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255, 255, 255, 0.85)', marginTop: 2 }}>
                  Phase 7, Mohali
                </Text>
              </View>
            </View>

            {/* Solid White ACTIVE Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
                elevation: 1,
              }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: '#16A34A',
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D', letterSpacing: 0.5 }}>
                ACTIVE
              </Text>
            </View>
          </View>

          {/* Member Name Section */}
          <View style={{ marginTop: 22 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              MEMBER
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 4, letterSpacing: -0.2 }}>
              Rohit Sharma
            </Text>
          </View>

          {/* Thin Translucent Divider Line (Matching screenshot) */}
          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              marginVertical: 16,
            }}
          />

          {/* Bottom Row: Plan & Valid Till */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                PLAN
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginTop: 3 }}>
                6–Month Gold
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                VALID TILL
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginTop: 3 }}>
                23 May 2027
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Benefits / Checklist List */}
        <View style={{ marginTop: 22, gap: 14, paddingHorizontal: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark-outline" size={17} color="#E23744" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>
              Already paid at the gym — nothing to pay
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="qr-code-outline" size={17} color="#E23744" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>
              Show your QR code at the entry gate
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={17} color="#E23744" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>
              187 days left on your plan
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action CTA */}
      <View style={{ marginTop: 28 }}>
        <TouchableOpacity
          onPress={onClaim}
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
            Claim My Membership & View QR
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
