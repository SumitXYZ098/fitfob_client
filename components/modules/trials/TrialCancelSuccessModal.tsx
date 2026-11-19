import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TrialPassItem, formatPassDate } from './types';

export interface TrialCancelSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  cancelledPass: TrialPassItem | null;
  onBookAnotherDate?: (pass: TrialPassItem) => void;
  onFindMoreGyms?: () => void;
}

export default function TrialCancelSuccessModal({
  visible,
  onClose,
  cancelledPass,
  onBookAnotherDate,
  onFindMoreGyms,
}: TrialCancelSuccessModalProps) {
  const gymTitle = cancelledPass?.gymName || 'Hit Fit Gym';
  const formattedDate = formatPassDate(cancelledPass?.rawDate, cancelledPass?.date);

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
            paddingBottom: 24,
          }}>
          <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 8 }}>
            {/* 3D Gym Trial Cancelled Illustration (Seamless Transparent Background) */}
            <View style={{ alignItems: 'center', alignSelf: 'center', marginTop: 4 }}>
              <View
                style={{
                  width: 280,
                  height: 250,
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Image
                  source={require('@/assets/images/gym_trial_cancelled_user_choice_3d.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
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
              Trial cancelled
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#64748B',
                textAlign: 'center',
                marginTop: 4,
                lineHeight: 18,
                paddingHorizontal: 20,
              }}>
              Your slot at {gymTitle} has been released to other members.
            </Text>

            {/* Details Card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#F1F5F9',
                borderRadius: 18,
                padding: 18,
                marginTop: 28,
                gap: 14,
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
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Date</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#94A3B8',
                    textDecorationLine: 'line-through',
                  }}>
                  {formattedDate}
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
                  {cancelledPass?.passId || 'TRL-20871'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>Status</Text>
                <View
                  style={{
                    backgroundColor: '#F1F5F9',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                    Cancelled
                  </Text>
                </View>
              </View>
            </View>

            {/* Blue Notice Box */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#DBEAFE',
                borderRadius: 14,
                padding: 14,
                marginTop: 20,
              }}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#2563EB"
                style={{ marginTop: 1, marginRight: 8 }}
              />
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: '#1E40AF', lineHeight: 18 }}>
                Changed your mind? You can book a new free trial whenever slots are open.
              </Text>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={{ marginTop: 28, gap: 10 }}>
            {/* Book another date */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                if (cancelledPass && onBookAnotherDate) {
                  onBookAnotherDate(cancelledPass);
                }
              }}
              activeOpacity={0.88}
              style={{
                height: 52,
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
                Book another date
              </Text>
            </TouchableOpacity>

            {/* Find more gyms */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                if (onFindMoreGyms) {
                  onFindMoreGyms();
                }
              }}
              activeOpacity={0.85}
              style={{
                height: 52,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '700' }}>
                Find more gyms
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
