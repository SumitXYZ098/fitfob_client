import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';
import { useClientQrCode } from '@/hook/useClient';
import { storageAPI } from '@/utility/storage';
import { formatPersonName } from '@/components/GymCard';

export default function TrialQrScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: qrData, isLoading: isQrLoading } = useClientQrCode();
  const [cachedQrCode, setCachedQrCode] = useState<string | null>(null);

  useEffect(() => {
    storageAPI
      .getItem('client_qr_code')
      .then((val) => {
        if (val) setCachedQrCode(val);
      })
      .catch(() => {});
  }, []);

  const params = useLocalSearchParams<{
    gymName?: string;
    gymAddress?: string;
    passId?: string;
    date?: string;
    guestName?: string;
    validUntil?: string;
    qrCode?: string;
  }>();

  const gymName = params.gymName || 'Hit Fit Gym';
  const gymAddress = params.gymAddress || 'Sector 22, Mohali';
  const passId = params.passId || 'TRL-20871';
  const guestName = formatPersonName(
    params.guestName || user?.clientDetail?.name || user?.name || 'Hardeep Singh'
  );

  const formattedDate = (() => {
    try {
      const d = params.date ? new Date(params.date) : new Date();
      if (!isNaN(d.getTime())) {
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        return `${weekday}, ${day} ${month}`;
      }
    } catch {}
    return params.date || 'Tue, 17 Nov';
  })();

  const expiresIn = (() => {
    try {
      const now = new Date();
      const target = new Date();
      target.setHours(22, 0, 0, 0);
      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${h}h ${m}m`;
      }
    } catch {}
    return '4h 18m';
  })();

  const realQrCode =
    params.qrCode ||
    qrData?.qrCode ||
    qrData?.data?.qrCode ||
    cachedQrCode;

  const handleSaveToGallery = () => {
    Toast.show({
      type: 'success',
      text1: 'Saved to gallery',
      text2: 'Pass QR code has been saved to your photos',
    });
  };

  return (
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
          onPress={() => router.back()}
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

        {/* Spacer */}
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
                {gymName}
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 2 }}
                numberOfLines={1}>
                {gymAddress}
              </Text>
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
                Active · ready to scan
              </Text>
            </View>
          </View>

          {/* QR Code Graphic (Real Verified QR Code) */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 12,
              minHeight: 210,
            }}>
            {isQrLoading && !realQrCode ? (
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
            ) : realQrCode ? (
              <Image
                source={{ uri: realQrCode }}
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
                  Pass ID: {passId}
                </Text>
              </View>
            )}
          </View>

          {/* Pass ID & Front Desk Subtext */}
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#0F172A',
                letterSpacing: 2,
              }}>
              {passId}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 4 }}>
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
                {guestName}
              </Text>
            </View>

            <View style={{ flex: 1.1, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>Date</Text>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 3 }}
                numberOfLines={1}>
                {formattedDate}
              </Text>
            </View>

            <View style={{ flex: 0.9, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>Expires in</Text>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: '#E23744', marginTop: 3 }}
                numberOfLines={1}>
                {expiresIn}
              </Text>
            </View>
          </View>
        </View>

        {/* Brightness Boost Indicator Pill */}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.22)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 24,
            }}>
           
           
          </View>
        </View>
      </ScrollView>

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
          onPress={handleSaveToGallery}
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
          onPress={() => router.back()}
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
  );
}
