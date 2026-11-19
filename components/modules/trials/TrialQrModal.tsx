import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatPersonName } from '@/components/GymCard';
import { TrialPassItem, formatPassDate, formatExpiresIn } from './types';

export interface TrialQrModalProps {
  visible: boolean;
  pass: TrialPassItem | null;
  onClose: () => void;
  onOpenDirections: (
    gymName: string,
    gymAddress?: string,
    lat?: number | string | null,
    lng?: number | string | null
  ) => void;
  onSaveToGallery?: () => void;
  fallbackQrCode?: string;
  isQrLoading?: boolean;
  fallbackGuestName?: string;
}

export default function TrialQrModal({
  visible,
  pass,
  onClose,
  onOpenDirections,
  onSaveToGallery,
  fallbackQrCode,
  isQrLoading = false,
  fallbackGuestName = 'Guest',
}: TrialQrModalProps) {
  const insets = useSafeAreaInsets();

  if (!pass) return null;

  const activePassQr = pass.qrCode || fallbackQrCode;
  const guestDisplayName = pass.guestName || fallbackGuestName;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#E23744',
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 12),
          paddingBottom: Math.max(insets.bottom, 16),
        }}>
        {/* Top Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 }}>
            Your QR is ready
          </Text>

          {/* Empty Spacer */}
          <View style={{ width: 38 }} />
        </View>

        {/* Scrollable Center Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}>
          {/* White Pass Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 22,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8,
            }}>
            {/* Card Header: Gym Title, Address & Price Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 }}
                  numberOfLines={1}>
                  {pass.gymName || 'Gym'}
                </Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 2 }}
                  numberOfLines={1}>
                  {pass.gymAddress || ''}
                </Text>

                {/* Get Direction Pill */}
                <TouchableOpacity
                  onPress={() =>
                    onOpenDirections(
                      pass.gymName || '',
                      pass.gymAddress,
                      pass.latitude,
                      pass.longitude
                    )
                  }
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    alignSelf: 'flex-start',
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FEE2E2',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 10,
                    marginTop: 6,
                  }}>
                  <Ionicons name="navigate" size={12} color="#E23744" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#E23744' }}>
                    Get Direction{pass.distance ? ` · ${pass.distance}` : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Price Pill */}
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  borderWidth: 1,
                  borderColor: '#FEE2E2',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#E23744', letterSpacing: 0.3 }}>
                  FREE · ₹0
                </Text>
              </View>
            </View>

            {/* Active · ready to scan Pill */}
            <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#ECFDF5',
                  borderWidth: 1,
                  borderColor: '#D1FAE5',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: '#10B981',
                    marginRight: 6,
                  }}
                />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#047857' }}>
                  {pass.statusBadgeLabel === 'Rescheduled'
                    ? 'Rescheduled · ready to scan'
                    : pass.isToday
                    ? 'Active · ready to scan'
                    : 'Booked · ready to scan'}
                </Text>
              </View>
            </View>

            {/* QR Code Graphic */}
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 12,
                minHeight: 210,
              }}>
              {isQrLoading && !activePassQr ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 210 }}>
                  <ActivityIndicator size="large" color="#E23744" />
                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#94A3B8',
                    }}>
                    Loading your QR pass...
                  </Text>
                </View>
              ) : activePassQr ? (
                <Image
                  source={{ uri: activePassQr }}
                  style={{ width: 210, height: 210 }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: 210 }}>
                  <Ionicons name="qr-code-outline" size={64} color="#CBD5E1" />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#94A3B8',
                    }}>
                    Scan to verify trial pass
                  </Text>
                </View>
              )}
            </View>

            {/* Front Desk Subtext */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 }}>
                Show this to the front desk to check in
              </Text>
            </View>

            {/* Dashed Divider Line */}
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: '#E2E8F0',
                borderStyle: 'dashed',
                marginVertical: 18,
              }}
            />

            {/* 3 Columns: Guest | Date | Expires in */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>Guest</Text>
                <Text
                  style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 3 }}
                  numberOfLines={1}>
                  {formatPersonName(guestDisplayName)}
                </Text>
              </View>

              <View style={{ flex: 1.1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>Date</Text>
                <Text
                  style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 3 }}
                  numberOfLines={1}>
                  {formatPassDate(pass.rawDate, pass.date)}
                </Text>
              </View>

              <View style={{ flex: 0.9, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>Expires in</Text>
                <Text
                  style={{ fontSize: 13, fontWeight: '700', color: '#E23744', marginTop: 3 }}
                  numberOfLines={1}>
                  {formatExpiresIn(pass.validUntil, pass.rawDate)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Get Direction CTA Button */}
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 }}>
          <TouchableOpacity
            onPress={() =>
              onOpenDirections(
                pass.gymName || '',
                pass.gymAddress,
                pass.latitude,
                pass.longitude
              )
            }
            activeOpacity={0.85}
            style={{
              height: 48,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 3,
            }}>
            <Ionicons name="navigate" size={16} color="#E23744" />
            <Text style={{ color: '#E23744', fontSize: 14, fontWeight: '800' }}>
              Get Direction to Gym{pass.distance ? ` (${pass.distance})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: 8,
          }}>
          {/* Save to gallery */}
          <TouchableOpacity
            onPress={onSaveToGallery}
            activeOpacity={0.8}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.28)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              Save to gallery
            </Text>
          </TouchableOpacity>

          {/* Done */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.88}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
            <Text style={{ color: '#E23744', fontSize: 15, fontWeight: '700' }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
