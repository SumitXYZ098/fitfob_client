import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { TrialPassItem, formatPassDate } from './types';

export interface TrialManageModalProps {
  visible: boolean;
  pass: TrialPassItem | null;
  onClose: () => void;
  onReschedule: () => void;
  onOpenDirections: (
    gymName: string,
    gymAddress?: string,
    lat?: number | string | null,
    lng?: number | string | null
  ) => void;
  onOpenCancel: () => void;
  gymPhone?: string;
}

export default function TrialManageModal({
  visible,
  pass,
  onClose,
  onReschedule,
  onOpenDirections,
  onOpenCancel,
  gymPhone = '9876543210',
}: TrialManageModalProps) {
  const insets = useSafeAreaInsets();

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
              marginBottom: 18,
            }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: '#0F172A',
                  letterSpacing: -0.3,
                }}>
                Manage your trial
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: '#94A3B8',
                  marginTop: 3,
                }}>
                {pass.gymName} · {formatPassDate(pass.rawDate, pass.date)} · Valid until {pass.validUntil || '10:00 PM'}
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

          {/* Option 1: Reschedule */}
          <TouchableOpacity
            onPress={onReschedule}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="time-outline" size={20} color="#0F172A" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                Reschedule
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 1 }}>
                Move to another open day
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Option 2: Get directions */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onOpenDirections(
                pass.gymName,
                pass.gymAddress,
                pass.latitude,
                pass.longitude
              );
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="location-outline" size={20} color="#0F172A" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                Get directions
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 1 }}>
                {pass.gymAddress}{pass.distance ? ` · ${pass.distance}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Option 3: Call the gym */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              Linking.openURL(`tel:${gymPhone}`).catch(() => {
                Toast.show({
                  type: 'info',
                  text1: 'Phone dialer unavailable',
                  text2: `Call ${gymPhone} for gym inquiries`,
                });
              });
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="call-outline" size={20} color="#0F172A" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                Call the gym
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 1 }}>
                Ask about timings or facilities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Subtle Divider */}
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 }} />

          {/* Option 4: Cancel trial */}
          <TouchableOpacity
            onPress={onOpenCancel}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close-circle-outline" size={20} color="#E23744" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#E23744' }}>
                Cancel trial
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 1 }}>
                Release your slot for someone else
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
