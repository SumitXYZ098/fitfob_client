import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrialPassItem, getNextDayInfo } from './types';

export interface TrialRescheduleModalProps {
  visible: boolean;
  pass: TrialPassItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TrialRescheduleModal({
  visible,
  pass,
  onClose,
  onConfirm,
}: TrialRescheduleModalProps) {
  const insets = useSafeAreaInsets();

  const rescheduleDayInfo = useMemo(
    () => getNextDayInfo(pass?.rawDate),
    [pass?.rawDate]
  );

  if (!pass) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          justifyContent: 'flex-end',
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 24),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 20,
          }}>
          {/* Top Drag Handle */}
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#CBD5E1',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />

          {/* Header: Title, Subtitle, Close X */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: '#0F172A',
                  letterSpacing: -0.3,
                }}>
                Reschedule trial
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: '#94A3B8',
                  marginTop: 3,
                }}>
                {pass.gymName || 'Hit Fit Gym'} · {pass.gymAddress || 'Sector 22, Mohali'}
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Current Booking Box */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#F1F5F9',
              borderRadius: 16,
              padding: 12,
              marginBottom: 16,
            }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <Ionicons name="calendar-outline" size={18} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>
                Current booking
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#64748B',
                  textDecorationLine: 'line-through',
                  marginTop: 1,
                }}>
                {rescheduleDayInfo.currentFormatted} · until 10:00 PM
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#E2E8F0',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
              }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>
                Current
              </Text>
            </View>
          </View>

          {/* Pick a new date */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 10 }}>
            Pick a new date
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* Card 1: Today (Disabled / Current) */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 16,
                padding: 12,
                opacity: 0.65,
              }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#94A3B8' }}>
                Today
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 2 }}>
                {rescheduleDayInfo.currentFormatted}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 6 }}>
                Your current date
              </Text>
            </View>

            {/* Card 2: Tomorrow (Active Selection) */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#E23744',
                borderRadius: 16,
                padding: 12,
                position: 'relative',
                shadowColor: '#E23744',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}>
              <View style={{ position: 'absolute', top: 10, right: 10 }}>
                <Ionicons name="checkmark-circle" size={18} color="#E23744" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                Tomorrow
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2 }}>
                {rescheduleDayInfo.tomorrowFormatted}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A', marginTop: 6 }}>
                4 slots left
              </Text>
            </View>
          </View>

          {/* Summary Details */}
          <View style={{ gap: 8, marginBottom: 16, paddingHorizontal: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>New date</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                {rescheduleDayInfo.tomorrowFull}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Valid until</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                10:00 PM (closing)
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Price</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                ₹0
              </Text>
            </View>
          </View>

          {/* Info Notice Box */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#DBEAFE',
              borderRadius: 14,
              padding: 12,
              marginBottom: 16,
            }}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#2563EB"
              style={{ marginTop: 1, marginRight: 8 }}
            />
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '500', color: '#1E40AF', lineHeight: 16 }}>
              Your QR pass will be updated. The old pass stops working right away.
            </Text>
          </View>

          {/* Confirm Reschedule Button */}
          <TouchableOpacity
            onPress={onConfirm}
            activeOpacity={0.88}
            style={{
              height: 50,
              borderRadius: 16,
              backgroundColor: '#E23744',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#E23744',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              Confirm reschedule
            </Text>
          </TouchableOpacity>

          {/* Keep current date Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={{
              height: 50,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
            }}>
            <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '700' }}>
              Keep current date
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
