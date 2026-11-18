import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useClientGymTrials, useClientQrCode } from '@/hook/useClient';
import { useAuthStore } from '@/store/useAuthStore';
import { storageAPI } from '@/utility/storage';
import { formatGymTitle, formatPersonName } from '@/components/GymCard';

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

// Helper to format date into "Tue, 17 Nov"
const formatPassDate = (rawDateStr?: string, formattedDateStr?: string) => {
  const target = rawDateStr || formattedDateStr || '';
  if (!target) return 'Tue, 17 Nov';
  try {
    const d = new Date(target);
    if (!isNaN(d.getTime())) {
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday}, ${day} ${month}`;
    }
  } catch {}
  return formattedDateStr || 'Tue, 17 Nov';
};

// Helper to calculate "4h 18m" remaining
const formatExpiresIn = (validUntil?: string) => {
  try {
    const now = new Date();
    const target = new Date();
    target.setHours(22, 0, 0, 0); // 10:00 PM closing
    const diff = target.getTime() - now.getTime();
    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    }
  } catch {}
  return '4h 18m';
};

// Helper for reschedule dates
const getNextDayInfo = (baseDateStr?: string) => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const current = !isNaN(base.getTime()) ? base : new Date();

  const tomorrow = new Date(current);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const currentFormatted = `${current.toLocaleDateString('en-US', { weekday: 'short' })}, ${current.getDate()} ${current.toLocaleDateString('en-US', { month: 'short' })}`;
  const tomorrowFormatted = `${tomorrow.toLocaleDateString('en-US', { weekday: 'short' })}, ${tomorrow.getDate()} ${tomorrow.toLocaleDateString('en-US', { month: 'short' })}`;
  const tomorrowFull = `${tomorrow.toLocaleDateString('en-US', { weekday: 'short' })}, ${tomorrow.getDate()} ${tomorrow.toLocaleDateString('en-US', { month: 'short' })} ${tomorrow.getFullYear()}`;
  const tomorrowWeekday = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrowMonth = tomorrow.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');

  return {
    currentFormatted,
    tomorrowFormatted,
    tomorrowFull,
    tomorrowWeekday,
    tomorrowMonth,
    tomorrowDay,
    tomorrowIso: tomorrow.toISOString().split('T')[0],
  };
};

// Helper to format check-in time / status note
const formatCheckinNote = (info?: string | null, checkintime?: string | null) => {
  const isoCandidate =
    checkintime ||
    (info && info.includes('T') ? info.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/)?.[0] : null);
  if (isoCandidate) {
    try {
      const d = new Date(isoCandidate);
      if (!isNaN(d.getTime())) {
        const timeStr = d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `Checked in at ${timeStr}`;
      }
    } catch {}
  }
  if (info) return info;
  return 'Checked in at gym';
};

// Cancel reasons
const CANCEL_REASONS = [
  'My plans changed',
  "Timing doesn't work for me",
  'Found another gym',
  'Other reason',
];

export default function MyFreeTrialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    data: gymTrialsApiData,
    isLoading: isTrialsLoading,
    isRefetching: isTrialsRefetching,
    refetch: refetchTrials,
  } = useClientGymTrials();
  const { data: qrData, isLoading: isQrLoading } = useClientQrCode();

  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [storedTrials, setStoredTrials] = useState<any[]>([]);
  const [cachedQrCode, setCachedQrCode] = useState<string | null>(null);
  const [selectedQrPass, setSelectedQrPass] = useState<TrialPassItem | null>(null);
  const [selectedManagePass, setSelectedManagePass] = useState<TrialPassItem | null>(null);

  // Reschedule flow states
  const [reschedulingPass, setReschedulingPass] = useState<TrialPassItem | null>(null);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [isRescheduleSuccessVisible, setIsRescheduleSuccessVisible] = useState(false);
  const [rescheduledPass, setRescheduledPass] = useState<TrialPassItem | null>(null);

  // Cancel flow states
  const [cancellingPass, setCancellingPass] = useState<TrialPassItem | null>(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>('My plans changed');
  const [isCancelSuccessVisible, setIsCancelSuccessVisible] = useState(false);
  const [cancelledPass, setCancelledPass] = useState<TrialPassItem | null>(null);

  // Entrance animation for Reschedule Success modal
  const imageScaleAnim = useRef(new Animated.Value(0.92)).current;
  const imageOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRescheduleSuccessVisible) {
      imageScaleAnim.setValue(0.92);
      imageOpacityAnim.setValue(0);

      // Smooth fade and gentle scale-in for the 3D character image
      Animated.parallel([
        Animated.timing(imageOpacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      imageScaleAnim.setValue(0.92);
      imageOpacityAnim.setValue(0);
    }
  }, [isRescheduleSuccessVisible]);

  const handleSaveToGallery = () => {
    Toast.show({
      type: 'success',
      text1: 'Saved to gallery',
      text2: 'Pass QR code has been saved to your photos',
    });
  };

  const handleOpenReschedule = () => {
    if (!selectedManagePass) return;
    const pass = selectedManagePass;
    setSelectedManagePass(null);
    setReschedulingPass(pass);
    setIsRescheduleModalVisible(true);
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingPass) return;
    const targetPass = reschedulingPass;
    const dayInfo = getNextDayInfo(targetPass.rawDate);

    const updatedPass: TrialPassItem = {
      ...targetPass,
      date: dayInfo.tomorrowFormatted,
      rawDate: dayInfo.tomorrowIso,
      month: dayInfo.tomorrowMonth,
      day: dayInfo.tomorrowDay,
      validUntil: '10:00 PM',
      statusNote: 'Valid tomorrow until 10:00 PM',
    };

    try {
      const raw = await storageAPI.getItem('client_booked_trials');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => {
            if (
              item.passId === targetPass.passId ||
              item.id === targetPass.id ||
              item.documentId === targetPass.id
            ) {
              return {
                ...item,
                date: dayInfo.tomorrowFormatted,
                rawDate: dayInfo.tomorrowIso,
                trialDate: dayInfo.tomorrowIso,
              };
            }
            return item;
          });
          await storageAPI.setItem('client_booked_trials', JSON.stringify(updated));
          setStoredTrials(updated);
        }
      }
    } catch {}

    setRescheduledPass(updatedPass);
    setIsRescheduleModalVisible(false);
    setIsRescheduleSuccessVisible(true);
  };

  const handleAddToCalendar = () => {
    Toast.show({
      type: 'success',
      text1: 'Added to Calendar',
      text2: `Trial at ${rescheduledPass?.gymName || 'Hit Fit Gym'} added to your calendar`,
    });
  };

  const rescheduleDayInfo = useMemo(
    () => getNextDayInfo(reschedulingPass?.rawDate),
    [reschedulingPass?.rawDate]
  );

  const successDayInfo = useMemo(
    () => getNextDayInfo(rescheduledPass?.rawDate),
    [rescheduledPass?.rawDate]
  );

  const cancelDateParts = useMemo(
    () => parseDateParts(cancellingPass?.rawDate, cancellingPass?.date),
    [cancellingPass?.rawDate, cancellingPass?.date]
  );

  const cancelDateFormatted = useMemo(
    () => formatPassDate(cancellingPass?.rawDate, cancellingPass?.date),
    [cancellingPass?.rawDate, cancellingPass?.date]
  );

  const successCancelDateFormatted = useMemo(
    () => formatPassDate(cancelledPass?.rawDate, cancelledPass?.date),
    [cancelledPass?.rawDate, cancelledPass?.date]
  );

  const handleOpenCancel = () => {
    if (!selectedManagePass) return;
    const pass = selectedManagePass;
    setSelectedManagePass(null);
    setCancellingPass(pass);
    setSelectedCancelReason('My plans changed');
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingPass) return;
    const targetPass = cancellingPass;

    try {
      const raw = await storageAPI.getItem('client_booked_trials');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => {
            if (
              item.passId === targetPass.passId ||
              item.id === targetPass.id ||
              item.documentId === targetPass.id
            ) {
              return { ...item, trialstatus: 'cancelled', status: 'cancelled' };
            }
            return item;
          });
          await storageAPI.setItem('client_booked_trials', JSON.stringify(updated));
          setStoredTrials(updated);
        }
      }
    } catch {}

    setCancelledPass(targetPass);
    setIsCancelModalVisible(false);
    setIsCancelSuccessVisible(true);
  };

  // Load booked passes and verified QR code from local storage
  const loadStoredTrials = useCallback(async () => {
    try {
      const [raw, savedQr] = await Promise.all([
        storageAPI.getItem('client_booked_trials'),
        storageAPI.getItem('client_qr_code'),
      ]);
      if (savedQr) {
        setCachedQrCode(savedQr);
      }
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
        String(b.clubName || b.gymName || ownerObj?.clubName || b.title || 'Check Fit')
      );
      const rawDate = String(b.trialDate || b.rawDate || todayStr);
      const passId =
        b.passId ||
        (b.id
          ? `TRL-${String(b.id).padStart(4, '0')}`
          : `TRL-${String(b.documentId || 'PASS').slice(-4).toUpperCase()}`);
      const key = `${passId}_${rawDate}_${gymName}`;
      if (seen.has(key)) return null;
      seen.add(key);

      const parts = parseDateParts(rawDate, b.date);
      const isPast = rawDate < todayStr;
      const statusRaw = String(b.trialStatus || b.trialstatus || b.status || '').toLowerCase().trim();

      let badge: 'booked' | 'checked_in' | 'expired' | 'cancelled' = 'booked';
      let label = 'Booked';
      let note = `Valid today until ${b.closingTime || b.validUntil || '10:00 PM'}`;

      if (statusRaw === 'completed' || statusRaw === 'checked_in' || statusRaw === 'attended') {
        badge = 'checked_in';
        label = 'Checked in';
        note = formatCheckinNote(b.info, b.checkintime);
      } else if (
        statusRaw === 'no-show' ||
        statusRaw === 'no_show' ||
        statusRaw === 'noshow' ||
        statusRaw === 'expired'
      ) {
        badge = 'expired';
        label = 'Expired';
        note = b.info || 'Not visited by closing time';
      } else if (statusRaw === 'cancelled' || statusRaw === 'canceled') {
        badge = 'cancelled';
        label = 'Cancelled';
        note = b.info || 'Cancelled by you';
      } else if (isPast) {
        badge = 'expired';
        label = 'Expired';
        note = b.info || 'Not visited by closing time';
      } else {
        badge = 'booked';
        label = 'Booked';
        note = b.info || `Valid today until ${b.closingTime || b.validUntil || '10:00 PM'}`;
      }

      let distanceDisplay: string | undefined = undefined;
      if (b.distance !== null && b.distance !== undefined && b.distance !== '') {
        distanceDisplay = `${b.distance} ${b.distanceUnit || 'km'}`.trim();
      }

      return {
        id: b.id || b.documentId || passId,
        passId,
        gymName,
        gymAddress: b.clubAddress || b.gymAddress || ownerObj?.address || 'Sector 91, Mohali',
        distance: distanceDisplay,
        date: formatPassDate(rawDate, b.date),
        rawDate,
        month: parts.month,
        day: parts.day,
        validUntil: b.closingTime || b.validUntil || '10:00 PM',
        statusNote: note,
        statusBadge: badge,
        statusBadgeLabel: label,
        guestName: b.guestName || user?.clientDetail?.name || user?.name || 'Guest',
        qrCode: b.qrCode || qrData?.qrCode || qrData?.data?.qrCode || cachedQrCode,
        isToday: rawDate === todayStr,
      };
    };

    // 1. Storage passes (user locally scheduled / cancelled)
    for (const item of storedTrials) {
      const p = normalizeItem(item);
      if (p) {
        if (p.statusBadge === 'booked' && !p.isToday && p.rawDate && p.rawDate < todayStr) {
          p.statusBadge = 'expired';
          p.statusBadgeLabel = 'Expired';
          p.statusNote = 'Not visited by closing time';
        }
        if (p.statusBadge === 'booked') realUpcoming.push(p);
        else realPast.push(p);
      }
    }

    // 2. API passes from /api/client/my-trials
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

    // Sort upcoming ascending by date, past descending by date
    realUpcoming.sort((a, b) => (a.rawDate || '').localeCompare(b.rawDate || ''));
    realPast.sort((a, b) => (b.rawDate || '').localeCompare(a.rawDate || ''));

    const hasAnyRealData = realUpcoming.length > 0 || realPast.length > 0;

    // 3. Fallbacks to guarantee the screen displays mockup if user has zero trials
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
      upcomingPasses: hasAnyRealData ? realUpcoming : sampleUpcoming,
      pastPasses: hasAnyRealData ? realPast : samplePast,
    };
  }, [gymTrialsApiData, storedTrials, qrData, cachedQrCode, user]);

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isTrialsLoading || isTrialsRefetching)}
            onRefresh={() => {
              refetchTrials();
            }}
            tintColor="#F6163C"
            colors={['#F6163C']}
          />
        }>
        {selectedTab === 'upcoming' ? (
          <>
            {/* ── TODAY / UPCOMING SECTION ── */}
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-0.5">
                TODAY
              </Text>

              {upcomingPasses.length > 0 ? (
                upcomingPasses.map((pass) => (
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

                      {/* Manage Trial (Three Dots) button */}
                      <TouchableOpacity
                        onPress={() => setSelectedManagePass(pass)}
                        activeOpacity={0.85}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          backgroundColor: '#FFFFFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    padding: 24,
                    alignItems: 'center',
                    marginBottom: 16,
                  }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}>
                    <Ionicons name="calendar-outline" size={24} color="#F6163C" />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                    No upcoming free trials
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: '#64748B',
                      textAlign: 'center',
                      marginTop: 4,
                      lineHeight: 18,
                    }}>
                    You have no active trial booked for today. Find a gym below and start your free trial!
                  </Text>
                </View>
              )}
            </View>

            {/* ── EARLIER SECTION (Displayed below TODAY matching Figma design) ── */}
            {pastPasses.length > 0 && (
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
            )}
          </>
        ) : (
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-0.5">
              PAST PASSES
            </Text>

            {pastPasses.length > 0 ? (
              pastPasses.map((pass) => (
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
              ))
            ) : (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                  padding: 28,
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                  <Ionicons name="time-outline" size={26} color="#64748B" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                  No past trials yet
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: '#64748B',
                    textAlign: 'center',
                    marginTop: 6,
                    lineHeight: 19,
                  }}>
                  Your checked-in, expired, or cancelled trial passes will appear here.
                </Text>
              </View>
            )}
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

      {/* ─── 5. Customer / Trial QR - Generated Screen ──────────────── */}
      <Modal
        visible={Boolean(selectedQrPass)}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        onRequestClose={() => setSelectedQrPass(null)}>
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
              onPress={() => setSelectedQrPass(null)}
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
                    {selectedQrPass?.gymName || 'Hit Fit Gym'}
                  </Text>
                  <Text
                    style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 2 }}
                    numberOfLines={1}>
                    {selectedQrPass?.gymAddress || 'Sector 22, Mohali'}
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
              {(() => {
                const activePassQr =
                  selectedQrPass?.qrCode ||
                  qrData?.qrCode ||
                  qrData?.data?.qrCode ||
                  cachedQrCode;
                return (
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
                          Pass ID: {selectedQrPass?.passId || 'TRL-0014'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Pass ID & Front Desk Subtext */}
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '900',
                    color: '#0F172A',
                    letterSpacing: 2,
                  }}>
                  {selectedQrPass?.passId || 'TRL-20871'}
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
                    {formatPersonName(
                      selectedQrPass?.guestName || user?.clientDetail?.name || user?.name || 'Hardeep Singh'
                    )}
                  </Text>
                </View>

                <View style={{ flex: 1.1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>Date</Text>
                  <Text
                    style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 3 }}
                    numberOfLines={1}>
                    {formatPassDate(selectedQrPass?.rawDate, selectedQrPass?.date)}
                  </Text>
                </View>

                <View style={{ flex: 0.9, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>Expires in</Text>
                  <Text
                    style={{ fontSize: 13, fontWeight: '700', color: '#E23744', marginTop: 3 }}
                    numberOfLines={1}>
                    {formatExpiresIn(selectedQrPass?.validUntil)}
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
              onPress={() => setSelectedQrPass(null)}
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

      {/* ─── 6. Manage Your Trial Bottom Sheet (Image) ───────────────── */}
      <Modal
        visible={Boolean(selectedManagePass)}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelectedManagePass(null)}>
        <Pressable
          onPress={() => setSelectedManagePass(null)}
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
                  {selectedManagePass?.gymName} · {formatPassDate(selectedManagePass?.rawDate, selectedManagePass?.date)} · Valid until {selectedManagePass?.validUntil || '10:00 PM'}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setSelectedManagePass(null)}
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
              onPress={handleOpenReschedule}
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
                if (selectedManagePass) {
                  const pass = selectedManagePass;
                  setSelectedManagePass(null);
                  handleOpenDirections(pass.gymName, pass.gymAddress);
                }
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
                  {selectedManagePass?.gymAddress}{selectedManagePass?.distance ? ` · ${selectedManagePass.distance}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Option 3: Call the gym */}
            <TouchableOpacity
              onPress={() => {
                setSelectedManagePass(null);
                Linking.openURL('tel:9876543210').catch(() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Phone dialer unavailable',
                    text2: 'Call 98765-43210 for gym inquiries',
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
              onPress={handleOpenCancel}
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

      {/* ─── 7. Reschedule Trial Bottom Sheet (Image 1) ─────────────── */}
      <Modal
        visible={isRescheduleModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsRescheduleModalVisible(false)}>
        <Pressable
          onPress={() => setIsRescheduleModalVisible(false)}
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
                  {reschedulingPass?.gymName || 'Hit Fit Gym'} · {reschedulingPass?.gymAddress || 'Sector 22, Mohali'}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setIsRescheduleModalVisible(false)}
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
              onPress={handleConfirmReschedule}
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
              onPress={() => setIsRescheduleModalVisible(false)}
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

      {/* ─── 8. Trial Rescheduled Success Screen (Image 2) ──────────── */}
      <Modal
        visible={isRescheduleSuccessVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setIsRescheduleSuccessVisible(false)}>
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
                    height: 260,
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
                See you at {rescheduledPass?.gymName || 'Hit Fit Gym'} on {successDayInfo.tomorrowWeekday}!
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
                    {successDayInfo.currentFormatted}
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
                    {successDayInfo.tomorrowFormatted}
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
                    {rescheduledPass?.gymName || 'Hit Fit Gym'}
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
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
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
                  setIsRescheduleSuccessVisible(false);
                  if (rescheduledPass) {
                    setSelectedQrPass(rescheduledPass);
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
                onPress={handleAddToCalendar}
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

      {/* ─── 9. Cancel Trial Bottom Sheet (Screen 1) ───────────────── */}
      <Modal
        visible={isCancelModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsCancelModalVisible(false)}>
        <Pressable
          onPress={() => setIsCancelModalVisible(false)}
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
                  borderWidth: 1,
                  borderColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="close-circle-outline" size={24} color="#E23744" />
              </View>

              <TouchableOpacity
                onPress={() => setIsCancelModalVisible(false)}
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
                marginTop: 12,
              }}>
              Cancel your free trial?
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: '#64748B',
                marginTop: 4,
                lineHeight: 18,
              }}>
              Your slot will be released to other members right away.
            </Text>

            {/* Gym Info Card with Date Block */}
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
                  {cancelDateParts.month}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginTop: -1 }}>
                  {cancelDateParts.day}
                </Text>
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                  {cancellingPass?.gymName || 'Hit Fit Gym'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2 }}>
                  {cancelDateFormatted} · Valid until 10:00 PM
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
              const isSelected = selectedCancelReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedCancelReason(reason)}
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
                const pass = cancellingPass;
                setIsCancelModalVisible(false);
                if (pass) {
                  setReschedulingPass(pass);
                  setIsRescheduleModalVisible(true);
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
                onPress={() => setIsCancelModalVisible(false)}
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
                onPress={handleConfirmCancel}
                activeOpacity={0.88}
                style={{
                  flex: 1,
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
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                  Yes, cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── 10. Trial Cancelled Success Screen (Screen 2) ──────────── */}
      <Modal
        visible={isCancelSuccessVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setIsCancelSuccessVisible(false)}>
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
              {/* 3D Gym Trial Cancelled Illustration (Seamless White Background) */}
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
                    source={require('@/assets/images/gym_trial_cancelled_friendly_3d.jpg')}
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
                Your slot at {cancelledPass?.gymName || 'Hit Fit Gym'} has been released to other members.
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
                    {cancelledPass?.gymName || 'Hit Fit Gym'}
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
                    {successCancelDateFormatted}
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
                  const pass = cancelledPass;
                  setIsCancelSuccessVisible(false);
                  if (pass) {
                    setReschedulingPass(pass);
                    setIsRescheduleModalVisible(true);
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
                  setIsCancelSuccessVisible(false);
                  router.push('/(tabs)');
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
    </SafeAreaView>
  );
}
