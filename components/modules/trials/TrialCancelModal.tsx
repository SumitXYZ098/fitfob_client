import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TrialPassItem, parseDateParts, formatPassDate } from './types';

export const CANCEL_REASONS = [
  'My plans changed',
  'Distance is too far',
  'Timings do not work for me',
  'Found another gym',
  'Other reason',
];

export interface TrialCancelModalProps {
  visible: boolean;
  onClose: () => void;
  cancellingPass: TrialPassItem | null;
  selectedReason: string;
  onSelectReason: (reason: string) => void;
  onConfirmCancel: () => void;
  onRescheduleInstead?: (pass: TrialPassItem) => void;
  isCancelling?: boolean;
}

export default function TrialCancelModal({
  visible,
  onClose,
  cancellingPass,
  selectedReason,
  onSelectReason,
  onConfirmCancel,
  onRescheduleInstead,
  isCancelling = false,
}: TrialCancelModalProps) {
  const insets = useSafeAreaInsets();
  const dateParts = parseDateParts(cancellingPass?.rawDate, cancellingPass?.date);
  const formattedDate = formatPassDate(cancellingPass?.rawDate, cancellingPass?.date);
  const gymTitle = cancellingPass?.gymName || 'Gym';

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
          onPress={(e: any) => e.stopPropagation()}
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
              marginBottom: 14,
            }}
          />

          {/* Header: Red Cancel Icon & Close Button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FEF2F2',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close-circle-outline" size={24} color="#E23744" />
            </View>

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

          {/* Title & Subtitle */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: '#0F172A',
              letterSpacing: -0.3,
              marginTop: 10,
            }}>
            Cancel free trial?
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: '#64748B',
              marginTop: 4,
              lineHeight: 18,
            }}>
            Your booked slot will be released so another member can book it.
          </Text>

          {/* Pass Preview Card */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#F1F5F9',
              borderRadius: 16,
              padding: 12,
              marginTop: 14,
            }}>
            <LinearGradient
              colors={['#F6163C', '#FF4578']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>
                {dateParts.month}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginTop: -1 }}>
                {dateParts.day}
              </Text>
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                {gymTitle}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2 }}>
                {formattedDate} · Valid until 10:00 PM
              </Text>
            </View>
          </View>

          {/* Section Header: Why are you cancelling? */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#0F172A',
              marginTop: 18,
              marginBottom: 10,
            }}>
            Why are you cancelling? (optional)
          </Text>

          {/* Radio Options List */}
          {CANCEL_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                onPress={() => onSelectReason(reason)}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? '#E23744' : '#E2E8F0',
                  backgroundColor: isSelected ? '#FFFBFB' : '#FFFFFF',
                  marginBottom: 8,
                }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: isSelected ? 2 : 1.5,
                    borderColor: isSelected ? '#E23744' : '#CBD5E1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  {isSelected && (
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
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#0F172A' : '#334155',
                  }}>
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Reschedule Suggestion Callout */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              if (cancellingPass && onRescheduleInstead) {
                onRescheduleInstead(cancellingPass);
              }
            }}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F3FF',
              borderWidth: 1,
              borderColor: '#EDE9FE',
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginTop: 4,
              marginBottom: 16,
            }}>
            <Ionicons name="time-outline" size={18} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: '#6D28D9' }}>
              Just need a different day?{' '}
              <Text style={{ fontWeight: '700', color: '#7C3AED', textDecorationLine: 'underline' }}>
                Reschedule instead
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Bottom Actions: Keep trial & Yes, cancel */}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '700' }}>
                Keep trial
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirmCancel}
              disabled={isCancelling}
              activeOpacity={0.88}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 16,
                backgroundColor: isCancelling ? '#FDA4AF' : '#E23744',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#E23744',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}>
              {isCancelling ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                  Yes, cancel
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
