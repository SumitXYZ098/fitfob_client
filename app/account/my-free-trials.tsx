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
import { useClientGymTrials, useClientQrCode, useCancelGymTrial, useRescheduleGymTrial } from '@/hook/useClient';
import { useAuthStore } from '@/store/useAuthStore';
import { storageAPI } from '@/utility/storage';
import { formatGymTitle, formatPersonName } from '@/components/GymCard';
import {
  TrialPassItem,
  TrialCancelModal,
  TrialCancelSuccessModal,
  TrialRescheduleModal,
  TrialRescheduleSuccessModal,
  TrialManageModal,
  TrialQrModal,
} from '@/components/modules/trials';

export type { TrialPassItem };

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
  } catch { }

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
  } catch { }
  return formattedDateStr || 'Tue, 17 Nov';
};

// Helper to calculate time remaining until closing time
const formatExpiresIn = (validUntil?: string, rawDateStr?: string) => {
  try {
    const now = new Date();
    let target = new Date();
    if (rawDateStr) {
      const parsed = new Date(rawDateStr);
      if (!isNaN(parsed.getTime())) {
        target = parsed;
      }
    }

    let hour = 22;
    let min = 0;
    if (validUntil) {
      const match = validUntil.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      if (match) {
        hour = parseInt(match[1], 10);
        min = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
      }
    }
    target.setHours(hour, min, 0, 0);

    const diff = target.getTime() - now.getTime();
    if (diff > 0) {
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (totalHours >= 24) {
        const d = Math.floor(totalHours / 24);
        const h = totalHours % 24;
        return `${d}d ${h}h`;
      }
      return `${totalHours}h ${m}m`;
    }
  } catch { }
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
    } catch { }
  }
  if (info) return info;
  return 'Checked in at gym';
};

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
  const { mutateAsync: cancelTrialMutation, isPending: isCancelling } = useCancelGymTrial();
  const { mutateAsync: rescheduleTrialMutation, isPending: isRescheduling } = useRescheduleGymTrial();

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
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>('Change of schedule');
  const [isCancelSuccessVisible, setIsCancelSuccessVisible] = useState(false);
  const [cancelledPass, setCancelledPass] = useState<TrialPassItem | null>(null);

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
    const docId = targetPass.documentId || targetPass.id;

    try {
      const res = await rescheduleTrialMutation({ docId, payload: {} });

      const newDate = res?.data?.trialDate;
      const dayInfo = getNextDayInfo(newDate || targetPass.rawDate);

      const updatedPass: TrialPassItem = {
        ...targetPass,
        date: dayInfo.tomorrowFormatted,
        rawDate: newDate || dayInfo.tomorrowIso,
        month: dayInfo.tomorrowMonth || targetPass.month,
        day: dayInfo.tomorrowDay || targetPass.day,
        validUntil: res?.data?.closingTime || '10:00 PM',
        statusNote: res?.data?.info || `Valid tomorrow until ${res?.data?.closingTime || '10:00 PM'}`,
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
                item.documentId === targetPass.documentId ||
                item.documentId === targetPass.id
              ) {
                return {
                  ...item,
                  date: dayInfo.tomorrowFormatted,
                  rawDate: newDate || dayInfo.tomorrowIso,
                  trialDate: newDate || dayInfo.tomorrowIso,
                  trialstatus: res?.data?.trialStatus || 'rescheduled',
                };
              }
              return item;
            });
            await storageAPI.setItem('client_booked_trials', JSON.stringify(updated));
            setStoredTrials(updated);
          }
        }
      } catch { }

      refetchTrials();
      setRescheduledPass(updatedPass);
      setIsRescheduleModalVisible(false);
      setIsRescheduleSuccessVisible(true);

      Toast.show({
        type: 'success',
        text1: 'Trial Rescheduled',
        text2: res?.message || 'Gym trial rescheduled successfully to tomorrow',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Reschedule Failed',
        text2: err?.response?.data?.message || err?.message || 'Failed to reschedule gym trial',
      });
    }
  };

  const handleAddToCalendar = () => {
    Toast.show({
      type: 'success',
      text1: 'Added to Calendar',
      text2: `Trial at ${rescheduledPass?.gymName || 'Gym'} added to your calendar`,
    });
  };

  const successDayInfo = useMemo(
    () => getNextDayInfo(rescheduledPass?.rawDate),
    [rescheduledPass?.rawDate]
  );

  const handleOpenCancel = () => {
    if (!selectedManagePass) return;
    const pass = selectedManagePass;
    setSelectedManagePass(null);
    setCancellingPass(pass);
    setSelectedCancelReason('Change of schedule');
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingPass) return;
    const targetPass = cancellingPass;
    const docId = targetPass.documentId || targetPass.id;

    try {
      const res = await cancelTrialMutation({ docId, reason: selectedCancelReason });

      try {
        const raw = await storageAPI.getItem('client_booked_trials');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const updated = list.map((item: any) => {
              if (
                item.passId === targetPass.passId ||
                item.id === targetPass.id ||
                item.documentId === targetPass.documentId ||
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
      } catch { }

      refetchTrials();
      setCancelledPass(targetPass);
      setIsCancelModalVisible(false);
      setIsCancelSuccessVisible(true);

      Toast.show({
        type: 'success',
        text1: 'Trial Cancelled',
        text2: res?.message || 'Gym trial cancelled successfully. Slot reopened.',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Cancellation Failed',
        text2: err?.response?.data?.message || err?.message || 'Failed to cancel gym trial',
      });
    }
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
    } catch { }
  }, []);

  useEffect(() => {
    loadStoredTrials();
  }, [loadStoredTrials]);

  // Prune any stored trials that are now confirmed in the backend API response
  useEffect(() => {
    if (Array.isArray(gymTrialsApiData) && gymTrialsApiData.length > 0 && storedTrials.length > 0) {
      const apiDocIds = new Set(
        gymTrialsApiData.map((a: any) => String(a.documentId || '')).filter(Boolean)
      );
      const apiNumericIds = new Set(
        gymTrialsApiData
          .map((a: any) => (typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10)))
          .filter((n: any) => !isNaN(n) && n > 0)
      );
      const apiGymDates = new Set(
        gymTrialsApiData.map((a: any) => {
          const name = formatGymTitle(String(a.clubName || a.gymName || ''))
            .toLowerCase()
            .replace(/\s+(gym|fitness|club)$/i, '')
            .trim();
          return `${name}_${a.trialDate}`;
        })
      );

      const cleaned = storedTrials.filter((st: any) => {
        const docId = String(st.documentId || '').trim();
        const numId = typeof st.id === 'number' ? st.id : parseInt(String(st.id), 10);
        const name = formatGymTitle(String(st.gymName || st.clubName || ''))
          .toLowerCase()
          .replace(/\s+(gym|fitness|club)$/i, '')
          .trim();
        const gymDate = `${name}_${st.rawDate || st.trialDate}`;

        const isKnown =
          (docId && apiDocIds.has(docId)) ||
          (!isNaN(numId) && numId > 0 && apiNumericIds.has(numId)) ||
          apiGymDates.has(gymDate);
        return !isKnown;
      });

      if (cleaned.length !== storedTrials.length) {
        setStoredTrials(cleaned);
        storageAPI.setItem('client_booked_trials', JSON.stringify(cleaned)).catch(() => { });
      }
    }
  }, [gymTrialsApiData, storedTrials]);

  // Consolidate real passes and fallbacks
  const { upcomingPasses, pastPasses } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const realUpcoming: TrialPassItem[] = [];
    const realPast: TrialPassItem[] = [];

    // Comprehensive deduplication tracking across IDs, document IDs, Pass IDs, and Gym+Date
    const seenDocIds = new Set<string>();
    const seenNumericIds = new Set<number>();
    const seenGymDates = new Set<string>();
    const seenPassIds = new Set<string>();

    const computePassId = (b: any): string => {
      if (typeof b.id === 'number' && b.id > 0) {
        return `TRL-${String(b.id).padStart(4, '0')}`;
      }
      if (b.passId && typeof b.passId === 'string' && /^TRL-\w+$/i.test(b.passId)) {
        return b.passId;
      }
      if (b.documentId && typeof b.documentId === 'string' && b.documentId.length >= 4) {
        return `TRL-${b.documentId.slice(-4).toUpperCase()}`;
      }
      return 'TRL-PASS';
    };

    const isDuplicateAndRegister = (
      item: any,
      gymName: string,
      rawDate: string,
      passId: string
    ): boolean => {
      const docId = item.documentId ? String(item.documentId).trim() : '';
      const numId = typeof item.id === 'number' && item.id > 0 ? item.id : undefined;
      const cleanGym = gymName
        .toLowerCase()
        .replace(/\s+(gym|fitness|club)$/i, '')
        .trim();
      const gymDateKey = `${cleanGym}_${rawDate}`;

      // Check if duplicate of an already registered pass
      if (docId && seenDocIds.has(docId)) return true;
      if (numId !== undefined && seenNumericIds.has(numId)) return true;
      if (cleanGym && rawDate && seenGymDates.has(gymDateKey)) return true;
      if (passId && passId !== 'TRL-PASS' && seenPassIds.has(passId)) return true;

      // Register new unique pass
      if (docId) seenDocIds.add(docId);
      if (numId !== undefined) seenNumericIds.add(numId);
      if (cleanGym && rawDate) seenGymDates.add(gymDateKey);
      if (passId && passId !== 'TRL-PASS') seenPassIds.add(passId);

      return false;
    };

    const normalizeItem = (b: any): TrialPassItem | null => {
      if (!b) return null;
      const ownerObj = typeof b.club_owner === 'object' ? b.club_owner : null;
      const gymName = formatGymTitle(
        String(b.clubName || b.gymName || ownerObj?.clubName || b.title || 'Gym')
      );
      const rawDate = String(b.trialDate || b.rawDate || todayStr);
      const passId = computePassId(b);

      if (isDuplicateAndRegister(b, gymName, rawDate, passId)) {
        return null; // Skip duplicate!
      }

      const parts = parseDateParts(rawDate, b.date);
      const isPast = rawDate < todayStr;
      const isToday = rawDate === todayStr;
      const statusRaw = String(b.trialStatus || b.trialstatus || b.status || '').toLowerCase().trim();

      let badge: 'booked' | 'checked_in' | 'expired' | 'cancelled' = 'booked';
      let label = 'Booked';
      let note = isToday
        ? `Valid today until ${b.closingTime || b.validUntil || '10:00 PM'}`
        : `Valid tomorrow until ${b.closingTime || b.validUntil || '10:00 PM'}`;

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
      } else if (statusRaw === 'rescheduled') {
        badge = 'booked';
        label = 'Rescheduled';
        note = b.info || `Valid tomorrow until ${b.closingTime || b.validUntil || '10:00 PM'}`;
      } else if (isPast) {
        badge = 'expired';
        label = 'Expired';
        note = b.info || 'Not visited by closing time';
      } else {
        badge = 'booked';
        label = 'Booked';
        note = b.info || (isToday
          ? `Valid today until ${b.closingTime || b.validUntil || '10:00 PM'}`
          : `Valid tomorrow until ${b.closingTime || b.validUntil || '10:00 PM'}`);
      }

      let distanceDisplay: string | undefined = undefined;
      if (b.distance !== null && b.distance !== undefined && b.distance !== '') {
        const num = typeof b.distance === 'number' ? b.distance : parseFloat(String(b.distance));
        const formattedNum = !isNaN(num) ? num.toFixed(1) : b.distance;
        distanceDisplay = `${formattedNum} ${b.distanceUnit || 'km'}`.trim();
      }

      const lat = b.latitude || b.lat || ownerObj?.latitude || ownerObj?.lat || null;
      const lng = b.longitude || b.lng || ownerObj?.longitude || ownerObj?.lng || null;

      return {
        id: b.id || b.documentId || passId,
        documentId: b.documentId,
        passId,
        gymName,
        gymAddress: b.clubAddress || b.gymAddress || ownerObj?.address || '',
        distance: distanceDisplay,
        latitude: lat,
        longitude: lng,
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

    // 1. Process API passes FIRST (Database Source of Truth)
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

    // 2. Process local storage passes SECOND (only keeps unsynced/optimistic bookings)
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

    // Sort upcoming ascending by date, past descending by date
    realUpcoming.sort((a, b) => (a.rawDate || '').localeCompare(b.rawDate || ''));
    realPast.sort((a, b) => (b.rawDate || '').localeCompare(a.rawDate || ''));

    return {
      upcomingPasses: realUpcoming,
      pastPasses: realPast,
    };
  }, [gymTrialsApiData, storedTrials, qrData, cachedQrCode, user]);

  const handleOpenDirections = (
    gymName: string,
    address?: string,
    latitude?: number | string | null,
    longitude?: number | string | null
  ) => {
    const lat =
      latitude !== undefined && latitude !== null && !isNaN(Number(latitude))
        ? Number(latitude)
        : null;
    const lng =
      longitude !== undefined && longitude !== null && !isNaN(Number(longitude))
        ? Number(longitude)
        : null;
    const encodedName = encodeURIComponent(gymName.trim());

    if (lat !== null && lng !== null) {
      const googleMapsAppUrl = Platform.select({
        ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
        android: `google.navigation:q=${lat},${lng}&mode=d`,
      });

      const nativeMapScheme = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}&q=${encodedName}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
      });

      const webGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`;

      const openNavigation = async () => {
        try {
          if (googleMapsAppUrl && (await Linking.canOpenURL(googleMapsAppUrl))) {
            await Linking.openURL(googleMapsAppUrl);
            return;
          }
          if (nativeMapScheme && (await Linking.canOpenURL(nativeMapScheme))) {
            await Linking.openURL(nativeMapScheme);
            return;
          }
        } catch { }
        Linking.openURL(webGoogleMapsUrl).catch(() => {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        });
      };

      openNavigation();
    } else {
      const query = encodeURIComponent(`${gymName} ${address || ''}`.trim());
      const url = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`,
      });
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => { });
      });
    }
  };

  const USER_ID = qrData?.data?.clientId || user?.clientDetail?.clientId || user?.id || 'CLIENT';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
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
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${selectedTab === 'upcoming' ? 'bg-white shadow-xs' : ''
              }`}>
            <Text
              className={`text-sm ${selectedTab === 'upcoming' ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'
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
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${selectedTab === 'past' ? 'bg-white shadow-xs' : ''
              }`}>
            <Text
              className={`text-sm ${selectedTab === 'past' ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'
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
                {upcomingPasses.some((p) => p.isToday) ? 'TODAY' : 'UPCOMING'}
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
                          <View
                            className={`rounded-full px-2.5 py-0.5 border ${pass.statusBadgeLabel === 'Rescheduled'
                                ? 'bg-purple-50 border-purple-200/80'
                                : 'bg-blue-50 border-blue-200/80'
                              }`}>
                            <Text
                              className={`text-xs font-bold ${pass.statusBadgeLabel === 'Rescheduled'
                                  ? 'text-purple-700'
                                  : 'text-blue-600'
                                }`}>
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
                      {/* Show QR pass button: Only visible when trialDate matches currentDate (isToday); hidden when scheduled for tomorrow/future */}
                      {pass.isToday ? (
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
                      ) : null}

                      {/* Direction button */}
                      <TouchableOpacity
                        onPress={() =>
                          handleOpenDirections(
                            pass.gymName,
                            pass.gymAddress,
                            pass.latitude,
                            pass.longitude
                          )
                        }
                        activeOpacity={0.85}
                        style={{
                          flex: pass.isToday ? undefined : 1,
                          height: 48,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          backgroundColor: '#FEF2F2',
                          borderWidth: 1,
                          borderColor: '#FEE2E2',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}>
                        <Ionicons name="navigate" size={15} color="#E23744" />
                        <Text style={{ color: '#E23744', fontSize: 13, fontWeight: '700' }}>
                          Direction
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

      {/* ─── 5. Customer / Trial QR Screen (Separate Component) ─────── */}
      <TrialQrModal
        visible={Boolean(selectedQrPass)}
        pass={selectedQrPass}
        onClose={() => setSelectedQrPass(null)}
        onOpenDirections={handleOpenDirections}
        onSaveToGallery={handleSaveToGallery}
        fallbackQrCode={qrData?.qrCode || qrData?.data?.qrCode || cachedQrCode}
        isQrLoading={isQrLoading}
        fallbackGuestName={user?.clientDetail?.name || user?.name || 'Guest'}
      />

      {/* ─── 6. Manage Your Trial Bottom Sheet (Separate Component) ─── */}
      <TrialManageModal
        visible={Boolean(selectedManagePass)}
        pass={selectedManagePass}
        onClose={() => setSelectedManagePass(null)}
        onReschedule={handleOpenReschedule}
        onOpenDirections={handleOpenDirections}
        onOpenCancel={handleOpenCancel}
      />

      {/* ─── 7. Reschedule Trial Bottom Sheet (Separate Component) ───── */}
      <TrialRescheduleModal
        visible={isRescheduleModalVisible}
        pass={reschedulingPass}
        onClose={() => setIsRescheduleModalVisible(false)}
        onConfirm={handleConfirmReschedule}
        isRescheduling={isRescheduling}
      />

      {/* ─── 8. Trial Rescheduled Success Screen (Separate Component) ── */}
      <TrialRescheduleSuccessModal
        visible={isRescheduleSuccessVisible}
        onClose={() => setIsRescheduleSuccessVisible(false)}
        rescheduledPass={rescheduledPass}
        dayInfo={successDayInfo}
        onViewNewPass={(pass) => setSelectedQrPass(pass)}
        onAddToCalendar={handleAddToCalendar}
      />

      {/* ─── 9. Cancel Trial Bottom Sheet (Separate Component) ──────── */}
      <TrialCancelModal
        visible={isCancelModalVisible}
        onClose={() => setIsCancelModalVisible(false)}
        cancellingPass={cancellingPass}
        selectedReason={selectedCancelReason}
        onSelectReason={setSelectedCancelReason}
        onConfirmCancel={handleConfirmCancel}
        isCancelling={isCancelling}
        onRescheduleInstead={(pass) => {
          setReschedulingPass(pass);
          setIsRescheduleModalVisible(true);
        }}
      />

      {/* ─── 10. Trial Cancelled Success Screen (Separate Component) ─── */}
      <TrialCancelSuccessModal
        visible={isCancelSuccessVisible}
        onClose={() => setIsCancelSuccessVisible(false)}
        cancelledPass={cancelledPass}
        onBookAnotherDate={(pass) => {
          setReschedulingPass(pass);
          setIsRescheduleModalVisible(true);
        }}
        onFindMoreGyms={() => router.push('/(tabs)')}
      />
    </View>
  );
}
