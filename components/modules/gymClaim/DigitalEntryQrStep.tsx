import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StylizedQrPassCode from './StylizedQrPassCode';

interface DigitalEntryQrStepProps {
  onBack: () => void;
}

export default function DigitalEntryQrStep({
  onBack,
}: DigitalEntryQrStepProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 28,
      }}>
      {/* Header: Back & Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
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
          My Gym Pass
        </Text>
      </View>

      {/* White Gym Pass Card */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          padding: 20,
          alignItems: 'center',
          marginTop: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 3,
        }}>
        {/* Gym Title & Plan Subtitle */}
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.2 }}>
          PowerHouse Gym
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 3 }}>
          6–Month Gold · Valid till 23 May 2027
        </Text>

        {/* Active Pill Badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ECFDF5',
            borderWidth: 1,
            borderColor: '#D1FAE5',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
            marginTop: 10,
            marginBottom: 16,
          }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#10B981',
              marginRight: 6,
            }}
          />
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857', letterSpacing: 0.5 }}>
            ACTIVE
          </Text>
        </View>

        {/* Stylized QR Code Graphic with Fitfob Center Badge */}
        <StylizedQrPassCode size={210} />

        {/* Instructions below QR */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 14 }}>
          Show this code at the entry gate
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 2 }}>
          Code refreshes daily for your security
        </Text>

        {/* Dashed Divider */}
        <View
          style={{
            width: '100%',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
            borderStyle: 'dashed',
            marginVertical: 16,
          }}
        />

        {/* Member Profile Row */}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#FEE2E2',
              borderWidth: 1,
              borderColor: '#FECACA',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#E23744' }}>
              RS
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
              Rohit Sharma
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 1 }}>
              Member ID: FF-20481
            </Text>
          </View>
        </View>
      </View>

      {/* Brightness Tip Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FEFCE8',
          borderWidth: 1,
          borderColor: '#FEF08A',
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginTop: 16,
        }}>
        <Ionicons name="sunny-outline" size={17} color="#CA8A04" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#854D0E', flex: 1 }}>
          Turn up screen brightness for a faster scan
        </Text>
      </View>
    </ScrollView>
  );
}
