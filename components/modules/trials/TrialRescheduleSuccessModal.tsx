import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { TrialPassItem, RescheduleDayInfo } from './types';

export interface TrialRescheduleSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  rescheduledPass: TrialPassItem | null;
  dayInfo: RescheduleDayInfo;
  onViewNewPass: (pass: TrialPassItem) => void;
  onAddToCalendar?: () => void;
}

export default function TrialRescheduleSuccessModal({
  visible,
  onClose,
  rescheduledPass,
  dayInfo,
  onViewNewPass,
  onAddToCalendar,
}: TrialRescheduleSuccessModalProps) {
  const imageScaleAnim = useRef(new Animated.Value(0.92)).current;
  const imageOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      imageScaleAnim.setValue(0.92);
      imageOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(imageOpacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      imageScaleAnim.setValue(0.92);
      imageOpacityAnim.setValue(0);
    }
  }, [visible, imageOpacityAnim, imageScaleAnim]);

  const handleCalendar = () => {
    if (onAddToCalendar) {
      onAddToCalendar();
      return;
    }
    Toast.show({
      type: 'success',
      text1: 'Added to Calendar',
      text2: `Trial at ${rescheduledPass?.gymName || 'Hit Fit Gym'} added to your calendar`,
    });
  };

  const gymTitle = rescheduledPass?.gymName || 'Hit Fit Gym';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 20,
          }}>
          <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 8 }}>
            {/* 3D Gym Delight Illustration (Seamless White Background, Borderless) */}
            <View style={{ alignItems: 'center', alignSelf: 'center', marginTop: 4 }}>
              <Animated.View
                style={{
                  width: 290,
                  height: 280,
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: imageOpacityAnim,
                  transform: [{ scale: imageScaleAnim }],
                }}>
                <Image
                  source={require('@/assets/images/gym_rescheduled_delight_3d.jpg')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            {/* Title & Subtitle */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '900',
                color: '#0F172A',
                textAlign: 'center',
                marginTop: 14,
                letterSpacing: -0.4,
              }}>
              Trial rescheduled
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#64748B',
                textAlign: 'center',
                marginTop: 4,
              }}>
              See you at {gymTitle} on {dayInfo.tomorrowWeekday}!
            </Text>

            {/* From -> To Comparison Box */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#F1F5F9',
                borderRadius: 18,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginTop: 18,
              }}>
              {/* From Column */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 }}>
                  FROM
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#94A3B8',
                    textDecorationLine: 'line-through',
                    marginTop: 2,
                  }}>
                  {dayInfo.currentFormatted}
                </Text>
              </View>

              {/* Center Arrow */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 8,
                }}>
                <Ionicons name="arrow-forward" size={16} color="#64748B" />
              </View>

              {/* To Column */}
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 }}>
                  TO
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: '#0F172A',
                    marginTop: 2,
                  }}>
                  {dayInfo.tomorrowFormatted}
                </Text>
              </View>
            </View>

            {/* Pass Details Card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#F1F5F9',
                borderRadius: 18,
                padding: 16,
                marginTop: 16,
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 1,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Club</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                  {gymTitle}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Valid until</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                  10:00 PM (closing)
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Pass ID</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#0F172A',
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}>
                  {rescheduledPass?.passId || 'TRL-20871'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Status</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>
                  Booked
                </Text>
              </View>
            </View>

            {/* Notice Box */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#DBEAFE',
                borderRadius: 14,
                padding: 12,
                marginTop: 16,
              }}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#2563EB"
                style={{ marginTop: 1, marginRight: 8 }}
              />
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '500', color: '#1E40AF', lineHeight: 16 }}>
                Your old QR is no longer valid. Show the updated pass at the front desk.
              </Text>
            </View>
          </View>

          {/* Bottom Actions */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 24,
            }}>
            {/* View new pass */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                if (rescheduledPass) {
                  onViewNewPass(rescheduledPass);
                }
              }}
              activeOpacity={0.88}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 16,
                backgroundColor: '#E23744',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#E23744',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                View new pass
              </Text>
            </TouchableOpacity>

            {/* Add to calendar */}
            <TouchableOpacity
              onPress={handleCalendar}
              activeOpacity={0.85}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                backgroundColor: '#FFFFFF',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="calendar-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '700' }}>
                Add to calendar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
