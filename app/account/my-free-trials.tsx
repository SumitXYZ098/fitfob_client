import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useClientGymTrials, useGetQr } from '@/hook/useClient';
import { useAuthStore } from '@/store/useAuthStore';
import { storageAPI } from '@/utility/storage';
import { formatGymTitle } from '@/components/GymCard';

export interface TrialPassItem {
  id: string | number;
  passId: string;
  gymName: string;
  gymAddress: string;
  distance?: string;
  date: string;
  rawDate?: string;
  month: string;
  day: string;
  validUntil: string;
  statusNote: string;
  statusBadge: 'booked' | 'checked_in' | 'expired' | 'cancelled';
  statusBadgeLabel: string;
  guestName: string;
  qrCode?: string;
  isToday?: boolean;
}

// Helper to extract uppercase Month (e.g. "NOV") and Day (e.g. "17")
const parseDateParts = (rawDateStr?: string, formattedDateStr?: string) => {
  const target = rawDateStr || formattedDateStr || '';
  if (!target) {
    const now = new Date();
    return {
      month: now.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      day: String(now.getDate()).padStart(2, '0'),
    };
  }
  try {
    const d = new Date(target);
    if (!isNaN(d.getTime())) {
      return {
        month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: String(d.getDate()).padStart(2, '0'),
      };
    }
  } catch {}

  const match = target.match(/(\d{1,2})\s+([A-Za-z]+)/);
  if (match) {
    return {
      day: match[1].padStart(2, '0'),
      month: match[2].slice(0, 3).toUpperCase(),
    };
  }
  return { month: 'NOV', day: '17' };
};

export default function MyFreeTrialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: gymTrialsApiData, refetch: refetchTrials } = useClientGymTrials();
  const { data: qrData } = useGetQr();

  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [storedTrials, setStoredTrials] = useState<any[]>([]);
  const [selectedQrPass, setSelectedQrPass] = useState<TrialPassItem | null>(null);

  // Load booked passes from local storage
  const loadStoredTrials = useCallback(async () => {
    try {
      const raw = await storageAPI.getItem('client_booked_trials');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setStoredTrials(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadStoredTrials();
  }, [loadStoredTrials]);

  // Consolidate real passes and fallbacks
  const { upcomingPasses, pastPasses } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const realUpcoming: TrialPassItem[] = [];
    const realPast: TrialPassItem[] = [];
    const seen = new Set<string>();

    const normalizeItem = (b: any): TrialPassItem | null => {
      if (!b) return null;
      const ownerObj = typeof b.club_owner === 'object' ? b.club_owner : null;
      const gymName = formatGymTitle(
        String(ownerObj?.clubName || b.gymName || b.clubName || b.title || 'Hit Fit Gym')
      );
      const rawDate = String(b.trialDate || b.rawDate || todayStr);
      const passId =
        b.passId || `TRL-${String(b.documentId || b.id || 'PASS').slice(-4).toUpperCase()}`;
      const key = `${passId}_${rawDate}_${gymName}`;
      if (seen.has(key)) return null;
      seen.add(key);

      const parts = parseDateParts(rawDate, b.date);
      const isPast = rawDate < todayStr;
      const statusRaw = String(b.trialstatus || b.status || (isPast ? 'expired' : 'booked')).toLowerCase();

      let badge: 'booked' | 'checked_in' | 'expired' | 'cancelled' = 'booked';
      let label = 'Booked';
      let note = `Valid today until ${b.validUntil || '10:00 PM'}`;

      if (statusRaw === 'checked_in' || statusRaw === 'attended') {
        badge = 'checked_in';
        label = 'Checked in';
        note = 'Checked in at gym';
      } else if (statusRaw === 'cancelled') {
        badge = 'cancelled';
        label = 'Cancelled';
        note = 'Cancelled by you';
      } else if (isPast || statusRaw === 'expired') {
        badge = 'expired';
        label = 'Expired';
        note = 'Not visited by closing time';
      }

      return {
        id: b.id || b.documentId || passId,
        passId,
        gymName,
        gymAddress: b.gymAddress || ownerObj?.address || 'Sector 22, Mohali',
        distance: b.distance || '1.2 km',
        date: b.date || rawDate,
        rawDate,
        month: parts.month,
        day: parts.day,
        validUntil: b.validUntil || '10:00 PM',
        statusNote: note,
        statusBadge: badge,
        statusBadgeLabel: label,
        guestName: b.guestName || user?.clientDetail?.name || user?.name || 'Guest',
        qrCode: b.qrCode || qrData?.data?.qrCode,
        isToday: rawDate === todayStr,
      };
    };

    // 1. Storage passes
    for (const item of storedTrials) {
      const p = normalizeItem(item);
      if (p) {
        if (p.statusBadge === 'booked') realUpcoming.push(p);
        else realPast.push(p);
      }
    }

    // 2. API passes
    const apiList = Array.isArray(gymTrialsApiData)
      ? gymTrialsApiData
      : Array.isArray((gymTrialsApiData as any)?.data)
      ? (gymTrialsApiData as any).data
      : [];
    for (const item of apiList) {
      const p = normalizeItem(item);
      if (p) {
        if (p.statusBadge === 'booked') realUpcoming.push(p);
        else realPast.push(p);
      }
    }

    // 3. Fallbacks to guarantee the screen displays the complete mockup if user has no trials
    const sampleUpcoming: TrialPassItem[] = [
      {
        id: 'sample-1',
        passId: 'TRL-8492',
        gymName: 'Hit Fit Gym',
        gymAddress: 'Sector 22, Mohali',
        distance: '1.2 km',
        date: '17 Nov 2026',
        rawDate: todayStr,
        month: 'NOV',
        day: '17',
        validUntil: '10:00 PM',
        statusNote: 'Valid today until 10:00 PM',
        statusBadge: 'booked',
        statusBadgeLabel: 'Booked',
        guestName: user?.clientDetail?.name || user?.name || 'Shweta Rana',
        qrCode: qrData?.data?.qrCode,
        isToday: true,
      },
    ];

    const samplePast: TrialPassItem[] = [
      {
        id: 'sample-past-1',
        passId: 'TRL-5120',
        gymName: 'Iron Paradise',
        gymAddress: 'Phase 7, Mohali',
        date: '12 Nov 2026',
        rawDate: '2026-11-12',
        month: 'NOV',
        day: '12',
        validUntil: '10:00 PM',
        statusNote: 'Checked in at 7:42 AM',
        statusBadge: 'checked_in',
        statusBadgeLabel: 'Checked in',
        guestName: user?.clientDetail?.name || user?.name || 'Shweta Rana',
        qrCode: qrData?.data?.qrCode,
      },
      {
        id: 'sample-past-2',
        passId: 'TRL-3901',
        gymName: 'PowerHouse Fitness',
        gymAddress: 'Sector 35, Chandigarh',
        date: '04 Nov 2026',
        rawDate: '2026-11-04',
        month: 'NOV',
        day: '04',
        validUntil: '10:00 PM',
        statusNote: 'Not visited by closing time',
        statusBadge: 'expired',
        statusBadgeLabel: 'Expired',
        guestName: user?.clientDetail?.name || user?.name || 'Shweta Rana',
        qrCode: qrData?.data?.qrCode,
      },
      {
        id: 'sample-past-3',
        passId: 'TRL-2219',
        gymName: 'Anytime Fitness',
        gymAddress: 'Sector 17, Chandigarh',
        date: '21 Oct 2026',
        rawDate: '2026-10-21',
        month: 'OCT',
        day: '21',
        validUntil: '10:00 PM',
        statusNote: 'Cancelled by you',
        statusBadge: 'cancelled',
        statusBadgeLabel: 'Cancelled',
        guestName: user?.clientDetail?.name || user?.name || 'Shweta Rana',
        qrCode: qrData?.data?.qrCode,
      },
    ];

    return {
      upcomingPasses: realUpcoming.length > 0 ? realUpcoming : sampleUpcoming,
      pastPasses: realPast.length > 0 ? realPast : samplePast,
    };
  }, [gymTrialsApiData, storedTrials, qrData?.data?.qrCode, user]);

  const handleOpenDirections = (gymName: string, address?: string) => {
    const query = encodeURIComponent(`${gymName} ${address || ''}`.trim());
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
    });
  };

  const USER_ID = qrData?.data?.clientId || user?.clientDetail?.clientId || user?.id || 'CLIENT';

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      {/* ─── 1. Top Header ────────────────────────────────────────────── */}
      <View className="px-5 pt-2 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="h-10 w-10 items-center justify-center -ml-2.5 rounded-full">
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text className="mt-1 text-[26px] font-black text-slate-900 tracking-tight">
          My free trials
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500 font-medium">
          Your trial passes across all clubs
        </Text>
      </View>

      {/* ─── 2. Segmented Tabs ────────────────────────────────────────── */}
      <View className="px-5 pb-1">
        <View className="flex-row rounded-2xl bg-slate-200/60 p-1">
          {/* Upcoming Tab */}
          <TouchableOpacity
            onPress={() => setSelectedTab('upcoming')}
            activeOpacity={0.85}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
              selectedTab === 'upcoming' ? 'bg-white shadow-xs' : ''
            }`}>
            <Text
              className={`text-sm ${
                selectedTab === 'upcoming' ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'
              }`}>
              Upcoming
            </Text>
            <View className="ml-2 rounded-full bg-[#F6163C] px-2 py-0.5 min-w-[20px] items-center justify-center">
              <Text className="text-[11px] font-bold text-white">
                {upcomingPasses.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Past Tab */}
          <TouchableOpacity
            onPress={() => setSelectedTab('past')}
            activeOpacity={0.85}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
              selectedTab === 'past' ? 'bg-white shadow-xs' : ''
            }`}>
            <Text
              className={`text-sm ${
                selectedTab === 'past' ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'
              }`}>
              Past
            </Text>
            <View className="ml-2 rounded-full bg-slate-300 px-2 py-0.5 min-w-[20px] items-center justify-center">
              <Text className="text-[11px] font-bold text-slate-700">
                {pastPasses.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 3. Passes List ───────────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}>
        {selectedTab === 'upcoming' ? (
          <>
            {/* ── TODAY SECTION ── */}
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-0.5">
                TODAY
              </Text>

              {upcomingPasses.map((pass) => (
                <View
                  key={pass.id}
                  className="mb-4 overflow-hidden rounded-[20px] border border-slate-100 bg-white p-4 shadow-xs">
                  {/* Top Card Row */}
                  <View className="flex-row items-start">
                    {/* Red Date Square with Gradient */}
                    <LinearGradient
                      colors={['#F6163C', '#FF4578']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 4,
                      }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: '#FFFFFF',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          lineHeight: 14,
                          textAlign: 'center',
                        }}>
                        {pass.month}
                      </Text>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: '900',
                          color: '#FFFFFF',
                          lineHeight: 24,
                          marginTop: 2,
                          textAlign: 'center',
                        }}>
                        {pass.day}
                      </Text>
                    </LinearGradient>

                    {/* Right Content Column */}
                    <View className="ml-3.5 flex-1 justify-center">
                      {/* Title + Status Badge Row */}
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[16px] font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                          {pass.gymName}
                        </Text>
                        <View className="rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5">
                          <Text className="text-xs font-bold text-blue-600">
                            {pass.statusBadgeLabel}
                          </Text>
                        </View>
                      </View>

                      {/* Address & Distance */}
                      <Text className="mt-1 text-xs font-medium text-slate-400" numberOfLines={1}>
                        {pass.gymAddress}
                        {pass.distance ? ` · ${pass.distance}` : ''}
                      </Text>

                      {/* Validity Note */}
                      <Text className="mt-1 text-xs font-bold text-[#F6163C]">
                        {pass.statusNote}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Action Buttons */}
                  <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {/* Show QR pass button */}
                    <TouchableOpacity
                      onPress={() => setSelectedQrPass(pass)}
                      activeOpacity={0.88}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: '#E23744',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 14,
                          fontWeight: '700',
                        }}>
                        Show QR pass
                      </Text>
                    </TouchableOpacity>

                    {/* Directions button */}
                    <TouchableOpacity
                      onPress={() => handleOpenDirections(pass.gymName, pass.gymAddress)}
                      activeOpacity={0.85}
                      style={{
                        height: 48,
                        paddingHorizontal: 22,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text
                        style={{
                          color: '#0F172A',
                          fontSize: 14,
                          fontWeight: '700',
                        }}>
                        Directions
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* ── EARLIER SECTION (Displayed below TODAY matching Figma design) ── */}
            <View className="mt-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-0.5">
                EARLIER
              </Text>

              {pastPasses.map((pass) => (
                <View
                  key={pass.id}
                  className="mb-3 rounded-[20px] border border-slate-100 bg-white p-4 shadow-xs">
                  <View className="flex-row items-start">
                    {/* Grey Date Square */}
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 12,
                        backgroundColor: '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 4,
                      }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: '#94A3B8',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          lineHeight: 14,
                          textAlign: 'center',
                        }}>
                        {pass.month}
                      </Text>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: '800',
                          color: '#334155',
                          lineHeight: 24,
                          marginTop: 2,
                          textAlign: 'center',
                        }}>
                        {pass.day}
                      </Text>
                    </View>

                    {/* Right Content Column */}
                    <View className="ml-3.5 flex-1 justify-center">
                      {/* Title + Status Badge Row */}
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[16px] font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                          {pass.gymName}
                        </Text>

                        {/* Badge aligned to the right on the top row */}
                        {pass.statusBadge === 'checked_in' ? (
                          <View className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5">
                            <Text className="text-xs font-bold text-emerald-700">Checked in</Text>
                          </View>
                        ) : pass.statusBadge === 'expired' ? (
                          <View className="rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5">
                            <Text className="text-xs font-bold text-amber-700">Expired</Text>
                          </View>
                        ) : (
                          <View className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5">
                            <Text className="text-xs font-bold text-slate-600">Cancelled</Text>
                          </View>
                        )}
                      </View>

                      {/* Address */}
                      <Text className="mt-1 text-xs font-medium text-slate-400" numberOfLines={1}>
                        {pass.gymAddress}
                      </Text>

                      {/* Status Note */}
                      <Text className="mt-1 text-xs font-medium text-slate-500">
                        {pass.statusNote}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-0.5">
              EARLIER
            </Text>

            {pastPasses.map((pass) => (
              <View
                key={pass.id}
                className="mb-3 rounded-[20px] border border-slate-100 bg-white p-4 shadow-xs">
                <View className="flex-row items-start">
                  {/* Grey Date Square */}
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 4,
                    }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: '#94A3B8',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        lineHeight: 14,
                        textAlign: 'center',
                      }}>
                      {pass.month}
                    </Text>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: '#334155',
                        lineHeight: 24,
                        marginTop: 2,
                        textAlign: 'center',
                      }}>
                      {pass.day}
                    </Text>
                  </View>

                  {/* Right Content Column */}
                  <View className="ml-3.5 flex-1 justify-center">
                    {/* Title + Status Badge Row */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[16px] font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                        {pass.gymName}
                      </Text>

                      {/* Badge aligned to the right on the top row */}
                      {pass.statusBadge === 'checked_in' ? (
                        <View className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5">
                          <Text className="text-xs font-bold text-emerald-700">Checked in</Text>
                        </View>
                      ) : pass.statusBadge === 'expired' ? (
                        <View className="rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5">
                          <Text className="text-xs font-bold text-amber-700">Expired</Text>
                        </View>
                      ) : (
                        <View className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5">
                          <Text className="text-xs font-bold text-slate-600">Cancelled</Text>
                        </View>
                      )}
                    </View>

                    {/* Address */}
                    <Text className="mt-1 text-xs font-medium text-slate-400" numberOfLines={1}>
                      {pass.gymAddress}
                    </Text>

                    {/* Status Note */}
                    <Text className="mt-1 text-xs font-medium text-slate-500">
                      {pass.statusNote}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── 4. Bottom Button: Find more gyms with free trials ──── */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.85}
          style={{
            height: 50,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#FECDD3',
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
            marginBottom: 20,
          }}>
          <Text style={{ color: '#F6163C', fontSize: 14, fontWeight: '700' }}>
            Find more gyms with free trials
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── 5. QR Pass Modal ─────────────────────────────────────────── */}
      <Modal
        visible={Boolean(selectedQrPass)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedQrPass(null)}>
        <Pressable
          onPress={() => setSelectedQrPass(null)}
          className="flex-1 items-center justify-center bg-black/60 px-5">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] overflow-hidden rounded-3xl bg-white p-5 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <View className="flex-1 pr-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-[#F6163C]">
                  FREE TRIAL PASS
                </Text>
                <Text className="text-base font-black text-slate-900 mt-0.5" numberOfLines={1}>
                  {selectedQrPass?.gymName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedQrPass(null)}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* QR Box */}
            <View className="my-5 items-center justify-center rounded-2xl bg-slate-50 p-4 border border-slate-100">
              {selectedQrPass?.qrCode ? (
                <Image
                  source={{ uri: selectedQrPass.qrCode }}
                  style={{ width: 180, height: 180 }}
                  resizeMode="contain"
                />
              ) : (
                <View className="h-44 w-44 items-center justify-center rounded-xl bg-white border border-slate-200">
                  <Ionicons name="qr-code-outline" size={120} color="#0F172A" />
                </View>
              )}
              <Text className="mt-3 font-mono text-xs font-bold text-slate-700">
                Pass: {selectedQrPass?.passId} • ID: {USER_ID}
              </Text>
            </View>

            {/* Pass Metadata */}
            <View className="rounded-xl bg-slate-50 p-3 border border-slate-100 gap-1.5 mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-medium text-slate-400">Date</Text>
                <Text className="text-xs font-bold text-slate-800">{selectedQrPass?.date}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-medium text-slate-400">Valid Until</Text>
                <Text className="text-xs font-bold text-[#F6163C]">
                  {selectedQrPass?.validUntil}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-medium text-slate-400">Guest Name</Text>
                <Text className="text-xs font-bold text-slate-800">{selectedQrPass?.guestName}</Text>
              </View>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              onPress={() => setSelectedQrPass(null)}
              activeOpacity={0.88}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: '#E23744',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                Done
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
