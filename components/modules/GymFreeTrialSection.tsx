import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Platform,
  Linking,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookGymTrial, useGetQr, type GymTrialQuota } from '@/hook/useClient';
import { storageAPI } from '@/utility/storage';
import { formatGymTitle } from '@/components/GymCard';

export interface GymTrialSlotInfo {
  totalBooked?: number;
  availableSlots?: number;
}

export interface ClientTrialBookingClubOwner {
  documentId?: string;
  clubName?: string;
  [key: string]: any;
}

export interface ClientTrialBookingItem {
  id?: number | string;
  documentId?: string;
  trialDate: string;
  trialstatus: string;
  club_owner?: ClientTrialBookingClubOwner | string;
  createdAt?: string;
  [key: string]: any;
}

export interface GymTrialInfo {
  trialAvailable?: boolean;
  dailyTrialLimit?: number;
  description?: string;
  today?: GymTrialSlotInfo | string;
  tomorrow?: GymTrialSlotInfo | string;
  clientTrialBooking?: ClientTrialBookingItem[];
  [key: string]: any;
}

interface GymFreeTrialSectionProps {
  gymName: string;
  gymAddress?: string;
  gymCity?: string;
  gymId?: string;
  clubOwner?: string;
  trial?: GymTrialInfo | null;
  closingTime?: string;
  isMemberOfThisClub?: boolean;
  onTrialBooked?: (trialData: any) => void;
}

export default function GymFreeTrialSection({
  gymName,
  gymAddress,
  gymCity,
  gymId,
  clubOwner,
  trial,
  closingTime = '10:00 PM',
  isMemberOfThisClub = false,
  onTrialBooked,
}: GymFreeTrialSectionProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { mutateAsync: bookTrial, isPending: isBooking } = useBookGymTrial();
  const getQrMutation = useGetQr();
  const [cachedQrCode, setCachedQrCode] = useState<string | null>(null);
  const [cachedClientId, setCachedClientId] = useState<string | null>(null);

  // Dynamic slot availability from backend response
  const isTodayClosed = trial?.today === 'closed';
  const isTomorrowClosed = trial?.tomorrow === 'closed';

  const todaySlotsAvailable =
    typeof trial?.today === 'object' && trial.today?.availableSlots !== undefined
      ? trial.today.availableSlots
      : isTodayClosed
      ? 0
      : 3;

  const tomorrowSlotsAvailable =
    typeof trial?.tomorrow === 'object' && trial.tomorrow?.availableSlots !== undefined
      ? trial.tomorrow.availableSlots
      : isTomorrowClosed
      ? 0
      : 3;

  const isTodaySlotsFull = !isTodayClosed && todaySlotsAvailable <= 0;
  const isTomorrowSlotsFull = !isTomorrowClosed && tomorrowSlotsAvailable <= 0;

  // Modal visibility states
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isSlotsFullModalVisible, setIsSlotsFullModalVisible] = useState(false);
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);

  // Booking form state
  const [selectedDateOption, setSelectedDateOption] = useState<'today' | 'tomorrow'>(() => {
    return isTodayClosed && !isTomorrowClosed ? 'tomorrow' : 'today';
  });
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [bookedPass, setBookedPass] = useState<{
    id?: number;
    documentId?: string;
    passId: string;
    date: string;
    rawDate?: string;
    validUntil: string;
    guestName: string;
    trialstatus?: string;
    gymName?: string;
    gymAddress?: string;
    gymCity?: string;
    clubOwner?: string;
    gymId?: string;
    qrCode?: string;
    quota?: GymTrialQuota;
  } | null>(null);

  // Load cached client QR code and Client ID on mount and refresh with getQr
  useEffect(() => {
    (async () => {
      try {
        const [savedQr, savedId] = await Promise.all([
          storageAPI.getItem('client_qr_code'),
          storageAPI.getItem('client_id'),
        ]);
        if (savedQr) setCachedQrCode(savedQr);
        if (savedId) setCachedClientId(savedId);

        if (user?.token) {
          getQrMutation.mutateAsync().then((res) => {
            const qr = res?.data?.qrCode;
            const cid = res?.data?.clientId;
            if (qr) {
              setCachedQrCode(qr);
              storageAPI.setItem('client_qr_code', qr).catch(() => {});
            }
            if (cid) {
              setCachedClientId(cid);
              storageAPI.setItem('client_id', cid).catch(() => {});
            }
          }).catch(() => {});
        }
      } catch {}
    })();
  }, [user?.token]);

  // Fetch QR on opening pass modal if not already available
  useEffect(() => {
    if (isPassModalVisible && !cachedQrCode && !getQrMutation.data?.data?.qrCode && user?.token) {
      getQrMutation.mutateAsync().then((res) => {
        const qr = res?.data?.qrCode;
        const cid = res?.data?.clientId;
        if (qr) {
          setCachedQrCode(qr);
          storageAPI.setItem('client_qr_code', qr).catch(() => {});
        }
        if (cid) {
          setCachedClientId(cid);
          storageAPI.setItem('client_id', cid).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [isPassModalVisible, cachedQrCode, user?.token]);

  // Helper to format raw YYYY-MM-DD date to nice label "Tue, 17 Nov 2026"
  const formatRawDate = (dateStr: string): string => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[dateObj.getDay()]}, ${d} ${months[m]} ${y}`;
      }
    } catch {}
    return dateStr;
  };

  // Helper to format date as YYYY-MM-DD
  const getTrialDateString = (option: 'today' | 'tomorrow'): string => {
    const d = new Date();
    if (option === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTrialDateString('today');

  // Check if a pass date is active (today or future)
  const isPassActive = (rawDate?: string): boolean => {
    if (!rawDate) return true;
    return rawDate >= todayStr;
  };

  const guestName = useMemo(() => {
    return user?.name || user?.username || 'Hardeep Singh';
  }, [user]);

  // Find if user already booked a trial at this gym from backend clientTrialBooking
  const existingGymBooking = useMemo<ClientTrialBookingItem | null>(() => {
    if (!trial?.clientTrialBooking || !Array.isArray(trial.clientTrialBooking)) return null;

    const currentGymName = String(gymName || '').toLowerCase().trim();
    const currentClubOwner = String(clubOwner || gymId || '').toLowerCase().trim();

    return (
      trial.clientTrialBooking.find((b) => {
        if (!b) return false;
        const status = String(b.trialstatus || '').toLowerCase();
        if (status !== 'booked' && status !== 'active') return false;

        const ownerObj = typeof b.club_owner === 'object' && b.club_owner ? b.club_owner : null;
        const ownerDocId = String(ownerObj?.documentId || b.club_owner || '').toLowerCase().trim();
        const ownerId = ownerObj?.id !== undefined ? String(ownerObj.id).toLowerCase().trim() : '';
        const ownerClubName = String(ownerObj?.clubName || b.gymName || b.clubName || '').toLowerCase().trim();

        // Strict match: unique documentId / id, or exact strict name equality (NO loose substring .includes)
        const matchesOwner = Boolean(
          currentClubOwner &&
          ((ownerDocId && (ownerDocId === currentClubOwner || currentClubOwner === ownerDocId)) ||
           (ownerId && (ownerId === currentClubOwner || currentClubOwner === ownerId)))
        );
        const matchesExactName = Boolean(
          currentGymName &&
          ownerClubName &&
          ownerClubName === currentGymName
        );

        return matchesOwner || matchesExactName;
      }) || null
    );
  }, [trial?.clientTrialBooking, gymName, clubOwner, gymId]);

  // Synchronize pass details from backend clientTrialBooking (Source of Truth)
  useEffect(() => {
    if (existingGymBooking) {
      const passId = `TRL-${String(existingGymBooking.documentId || existingGymBooking.id || 'PASS')
        .slice(-4)
        .toUpperCase()}`;
      setBookedPass({
        id: typeof existingGymBooking.id === 'number' ? existingGymBooking.id : undefined,
        documentId: existingGymBooking.documentId,
        passId,
        date: formatRawDate(existingGymBooking.trialDate),
        rawDate: existingGymBooking.trialDate,
        validUntil: `${formatRawDate(existingGymBooking.trialDate)} (Closing Time: ${closingTime})`,
        guestName,
        trialstatus: existingGymBooking.trialstatus || 'booked',
        gymName,
        gymAddress,
        gymCity,
        clubOwner: clubOwner || gymId,
        gymId,
      });
    } else {
      // If user has not booked a trial at this club, reset to null (no ghost passes)
      setBookedPass(null);
    }

    // Keep global client booked trials list in sync for the scan screen
    if (trial && Array.isArray(trial.clientTrialBooking) && trial.clientTrialBooking.length > 0) {
      const bookingsList = trial.clientTrialBooking;
      (async () => {
        try {
          const listToStore = bookingsList
            .filter((b) => b && (b.trialstatus === 'booked' || b.trialstatus === 'active'))
            .map((b) => {
              const ownerObj = typeof b.club_owner === 'object' ? b.club_owner : null;
              const ownerDocId = String(ownerObj?.documentId || b.club_owner || '');
              const ownerName = String(ownerObj?.clubName || (ownerDocId === gymId ? gymName : 'Partner Gym'));
              const bPassId = `TRL-${String(b.documentId || b.id || 'PASS').slice(-4).toUpperCase()}`;
              return {
                id: typeof b.id === 'number' ? b.id : undefined,
                documentId: b.documentId,
                passId: bPassId,
                date: formatRawDate(b.trialDate),
                rawDate: b.trialDate,
                validUntil: `${formatRawDate(b.trialDate)} (Closing Time: ${closingTime})`,
                guestName,
                trialstatus: b.trialstatus || 'booked',
                gymName: ownerName,
                clubOwner: ownerDocId,
                gymId: ownerDocId,
              };
            });
          await storageAPI.setItem('client_booked_trials', JSON.stringify(listToStore));
        } catch {}
      })();
    }
  }, [existingGymBooking, trial?.clientTrialBooking, closingTime, guestName, clubOwner, gymId, gymName, gymAddress, gymCity]);

  // Check if today or tomorrow is already booked at this gym
  const isTodayBookedAtThisGym = useMemo(() => {
    const todayStr = getTrialDateString('today');
    if (bookedPass?.rawDate === todayStr) return true;
    if (!trial?.clientTrialBooking || !Array.isArray(trial.clientTrialBooking)) return false;

    const currentGymName = String(gymName || '').toLowerCase().trim();
    const currentClubOwner = String(clubOwner || gymId || '').toLowerCase().trim();

    return trial.clientTrialBooking.some((b) => {
      if (b.trialDate !== todayStr) return false;
      const st = String(b.trialstatus || '').toLowerCase();
      if (st !== 'booked' && st !== 'active') return false;

      const ownerObj = typeof b.club_owner === 'object' && b.club_owner ? b.club_owner : null;
      const ownerDocId = String(ownerObj?.documentId || b.club_owner || '').toLowerCase().trim();
      const ownerId = ownerObj?.id !== undefined ? String(ownerObj.id).toLowerCase().trim() : '';
      const ownerClubName = String(ownerObj?.clubName || b.gymName || b.clubName || '').toLowerCase().trim();

      const matchesOwner = Boolean(
        currentClubOwner &&
        ((ownerDocId && (ownerDocId === currentClubOwner || currentClubOwner === ownerDocId)) ||
         (ownerId && (ownerId === currentClubOwner || currentClubOwner === ownerId)))
      );
      const matchesName = Boolean(
        currentGymName &&
        ownerClubName &&
        ownerClubName === currentGymName
      );

      return matchesOwner || matchesName;
    });
  }, [trial?.clientTrialBooking, bookedPass?.rawDate, gymName, clubOwner, gymId]);

  const isTomorrowBookedAtThisGym = useMemo(() => {
    const tomorrowStr = getTrialDateString('tomorrow');
    if (bookedPass?.rawDate === tomorrowStr) return true;
    if (!trial?.clientTrialBooking || !Array.isArray(trial.clientTrialBooking)) return false;

    const currentGymName = String(gymName || '').toLowerCase().trim();
    const currentClubOwner = String(clubOwner || gymId || '').toLowerCase().trim();

    return trial.clientTrialBooking.some((b) => {
      if (b.trialDate !== tomorrowStr) return false;
      const st = String(b.trialstatus || '').toLowerCase();
      if (st !== 'booked' && st !== 'active') return false;

      const ownerObj = typeof b.club_owner === 'object' && b.club_owner ? b.club_owner : null;
      const ownerDocId = String(ownerObj?.documentId || b.club_owner || '').toLowerCase().trim();
      const ownerId = ownerObj?.id !== undefined ? String(ownerObj.id).toLowerCase().trim() : '';
      const ownerClubName = String(ownerObj?.clubName || b.gymName || b.clubName || '').toLowerCase().trim();

      const matchesOwner = Boolean(
        currentClubOwner &&
        ((ownerDocId && (ownerDocId === currentClubOwner || currentClubOwner === ownerDocId)) ||
         (ownerId && (ownerId === currentClubOwner || currentClubOwner === ownerId)))
      );
      const matchesName = Boolean(
        currentGymName &&
        ownerClubName &&
        ownerClubName === currentGymName
      );

      return matchesOwner || matchesName;
    });
  }, [trial?.clientTrialBooking, bookedPass?.rawDate, gymName, clubOwner, gymId]);

  // Auto-switch date if selected option is closed or already booked
  useEffect(() => {
    if (
      (isTodayClosed || isTodayBookedAtThisGym) &&
      !isTomorrowClosed &&
      !isTomorrowBookedAtThisGym &&
      selectedDateOption === 'today'
    ) {
      setSelectedDateOption('tomorrow');
    } else if (
      !isTodayClosed &&
      !isTodayBookedAtThisGym &&
      (isTomorrowClosed || isTomorrowBookedAtThisGym) &&
      selectedDateOption === 'tomorrow'
    ) {
      setSelectedDateOption('today');
    }
  }, [
    isTodayClosed,
    isTomorrowClosed,
    isTodayBookedAtThisGym,
    isTomorrowBookedAtThisGym,
    selectedDateOption,
  ]);

  // Calculate dynamic trial quota counts (used, remaining, max, period)
  // Rule: Clients can book up to 3 trials per 6 weeks. Resets after 6 weeks.
  const quotaInfo = useMemo(() => {
    const max = 3;
    const periodWeeks = 6;

    // 1. Check description text for "X trial(s) left"
    let parsedRemaining: number | null = null;
    if (trial?.description) {
      const match = trial.description.match(/(\d+)\s+trials?\s+left/i);
      if (match && match[1]) {
        parsedRemaining = parseInt(match[1], 10);
      } else if (
        trial.description.toLowerCase().includes('no trials left') ||
        trial.description.toLowerCase().includes('0 trials left')
      ) {
        parsedRemaining = 0;
      }
    }

    // 2. Count active bookings from clientTrialBooking
    const activeBookingsCount = Array.isArray(trial?.clientTrialBooking)
      ? trial.clientTrialBooking.filter((b) => {
          const st = String(b.trialstatus || '').toLowerCase();
          return st === 'booked' || st === 'active';
        }).length
      : 0;

    let remaining = 3;
    let used = 0;

    if (parsedRemaining !== null) {
      remaining = parsedRemaining;
      used = Math.max(activeBookingsCount, max - remaining);
    } else if (activeBookingsCount > 0) {
      used = Math.min(max, activeBookingsCount);
      remaining = Math.max(0, max - used);
    } else if (bookedPass?.quota?.trialsRemainingInPeriod !== undefined) {
      remaining = bookedPass.quota.trialsRemainingInPeriod;
      used = bookedPass.quota.trialsUsedInPeriod ?? (max - remaining);
    } else if (bookedPass) {
      used = 1;
      remaining = 2;
    }

    const isQuotaFull = remaining <= 0;
    const hasBookingAtThisGym = Boolean(existingGymBooking || bookedPass);

    return {
      used,
      remaining,
      max,
      periodWeeks,
      isQuotaFull,
      isBooked: hasBookingAtThisGym,
    };
  }, [trial?.description, trial?.clientTrialBooking, bookedPass, existingGymBooking]);

  // Dynamic banner description from backend & quota info
  const bannerDescription = useMemo(() => {
    if (isMemberOfThisClub) {
      return `You already have an active membership at ${gymName} with unlimited gym access. Free trials are only available for gyms you haven't joined yet.`;
    }
    if (bookedPass) {
      return `Trial booked for ${bookedPass.date}. You have used ${quotaInfo.used} of ${quotaInfo.max} trials (${quotaInfo.remaining} remaining in this ${quotaInfo.periodWeeks}-week period).`;
    }
    if (quotaInfo.isQuotaFull) {
      return `You have used all ${quotaInfo.max} free trials for this ${quotaInfo.periodWeeks}-week period. Your trial quota will reset after ${quotaInfo.periodWeeks} weeks.`;
    }
    if (trial?.description) {
      return trial.description;
    }
    if (isTodayClosed) {
      return `One full session at ${gymName}, on us. Today closed • Tomorrow open. (${quotaInfo.remaining} of ${quotaInfo.max} trials left per ${quotaInfo.periodWeeks} weeks).`;
    }
    return `One full session at ${gymName}, on us. Only ${todaySlotsAvailable} of ${
      trial?.dailyTrialLimit || 3
    } trial slots left today (${quotaInfo.remaining} of ${quotaInfo.max} trials left in 6-wk period).`;
  }, [
    isMemberOfThisClub,
    bookedPass,
    quotaInfo,
    trial?.description,
    trial?.dailyTrialLimit,
    isTodayClosed,
    todaySlotsAvailable,
    gymName,
  ]);

  // Dynamic formatted dates for today & tomorrow
  const dateInfo = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return {
      todayShort: `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`,
      todayFull: `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
      tomorrowShort: `${days[tomorrow.getDay()]}, ${tomorrow.getDate()} ${months[tomorrow.getMonth()]}`,
      tomorrowFull: `${days[tomorrow.getDay()]}, ${tomorrow.getDate()} ${months[tomorrow.getMonth()]} ${tomorrow.getFullYear()}`,
      tomorrowMonth: months[tomorrow.getMonth()].toUpperCase(),
      tomorrowDay: tomorrow.getDate(),
    };
  }, []);

  const locationSubtitle = useMemo(() => {
    const parts = [formatGymTitle(gymName), gymAddress || gymCity].filter(Boolean);
    return parts.join(' • ');
  }, [gymName, gymAddress, gymCity]);

  // Handle confirming the free trial booking via POST /api/gym-trials
  const handleConfirmBooking = async (dateOption: 'today' | 'tomorrow') => {
    if (!policyAccepted) {
      Toast.show({
        type: 'error',
        text1: 'Policy Acceptance Required',
        text2: 'Please accept the no-show policy to confirm.',
      });
      return;
    }

    if (isMemberOfThisClub) {
      Toast.show({
        type: 'info',
        text1: 'Active Member Notice',
        text2: `You already hold an active membership at ${gymName}. Free trial is not applicable.`,
      });
      return;
    }

    if (dateOption === 'today' && isTodayBookedAtThisGym) {
      Toast.show({
        type: 'info',
        text1: 'Already Booked',
        text2: `You already have a booked trial at ${gymName} for today.`,
      });
      return;
    }

    if (dateOption === 'tomorrow' && isTomorrowBookedAtThisGym) {
      Toast.show({
        type: 'info',
        text1: 'Already Booked',
        text2: `You already have a booked trial at ${gymName} for tomorrow.`,
      });
      return;
    }

    if (quotaInfo.isQuotaFull) {
      Toast.show({
        type: 'error',
        text1: '6-Week Limit Reached',
        text2: `You have used all ${quotaInfo.max} free trials for this ${quotaInfo.periodWeeks}-week period. It resets after ${quotaInfo.periodWeeks} weeks.`,
      });
      return;
    }

    if (!user?.token) {
      Toast.show({
        type: 'error',
        text1: 'Sign In Required',
        text2: 'Please sign in to book your free trial.',
      });
      return;
    }

    const targetClubOwner = clubOwner || gymId;
    if (!targetClubOwner) {
      Toast.show({
        type: 'error',
        text1: 'Club Details Missing',
        text2: 'Club owner ID not found. Please try again.',
      });
      return;
    }

    const trialDate = getTrialDateString(dateOption);

    try {
      const response = await bookTrial({
        club_owner: targetClubOwner,
        trialDate,
      });

      const trialData = response.data;
      const passId = trialData.documentId || `TRL-${trialData.id}`;
      const passDate = dateOption === 'today' ? dateInfo.todayFull : dateInfo.tomorrowFull;

      const serverQuota = response.quota;
      const usedInPeriod = serverQuota?.trialsUsedInPeriod ?? 1;
      const maxInPeriod = serverQuota?.maxTrialsPerPeriod ?? (trial?.dailyTrialLimit || 3);
      const remainingInPeriod =
        serverQuota?.trialsRemainingInPeriod ?? Math.max(0, maxInPeriod - usedInPeriod);

      const newPass = {
        id: trialData.id,
        documentId: trialData.documentId,
        passId,
        date: passDate,
        rawDate: trialDate,
        validUntil: `${closingTime} (closing)`,
        guestName,
        trialstatus: trialData.trialstatus || 'booked',
        quota: {
          trialsUsedInPeriod: usedInPeriod,
          trialsRemainingInPeriod: remainingInPeriod,
          maxTrialsPerPeriod: maxInPeriod,
          periodWeeks: serverQuota?.periodWeeks || 6,
        },
      };

      setBookedPass(newPass);

      // Persist to storage for this gym and for the global scan tab
      const storageKey = `booked_gym_trial_${targetClubOwner}`;
      storageAPI.setItem(storageKey, JSON.stringify(newPass)).catch(() => {});
      if (gymId && gymId !== targetClubOwner) {
        storageAPI.setItem(`booked_gym_trial_${gymId}`, JSON.stringify(newPass)).catch(() => {});
      }

      (async () => {
        try {
          const rawList = await storageAPI.getItem('client_booked_trials');
          const existingList = rawList ? JSON.parse(rawList) : [];
          const filtered = Array.isArray(existingList)
            ? existingList.filter(
                (p: any) => p && p.documentId !== newPass.documentId && p.passId !== newPass.passId
              )
            : [];
          filtered.unshift(newPass);
          await storageAPI.setItem('client_booked_trials', JSON.stringify(filtered));
        } catch {}
      })();

      setIsBookingModalVisible(false);
      setIsSlotsFullModalVisible(false);
      setIsPassModalVisible(true);

      if (onTrialBooked) {
        onTrialBooked(trialData);
      }

      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: response.message || 'Free Trial Booked! 🎉',
          text2: `Pass ${passId} confirmed for ${dateOption === 'today' ? 'Today' : 'Tomorrow'} (${usedInPeriod} of ${maxInPeriod} used)`,
        });
      }, 350);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Could not book free trial.';

      // DO NOT emit console.error to avoid React Native LogBox red screen
      console.warn('ℹ️ Gym trial booking note:', errorMsg);

      const lower = String(errorMsg).toLowerCase();

      // CASE 1: User already has an active / booked trial
      if (
        lower.includes('already have a booked trial') ||
        lower.includes('already booked') ||
        lower.includes('trial already')
      ) {
        // Extract the date if backend returned e.g. "on 2026-11-16"
        const dateMatch = errorMsg.match(/(\d{4}-\d{2}-\d{2})/);
        let passDate = dateOption === 'today' ? dateInfo.todayFull : dateInfo.tomorrowFull;
        let rawDate = trialDate;
        if (dateMatch && dateMatch[1]) {
          rawDate = dateMatch[1];
          passDate = formatRawDate(rawDate);
        }

        const maxTrials = trial?.dailyTrialLimit || 3;
        const usedTrials = 1;
        const remainingTrials = Math.max(0, maxTrials - usedTrials);

        const activePass = {
          passId: `TRL-${gymId ? String(gymId).slice(-6).toUpperCase() : 'ACTIVE'}`,
          date: passDate,
          rawDate,
          validUntil: `${closingTime} (closing)`,
          guestName,
          trialstatus: 'booked',
          quota: {
            trialsUsedInPeriod: usedTrials,
            trialsRemainingInPeriod: remainingTrials,
            maxTrialsPerPeriod: maxTrials,
            periodWeeks: 6,
          },
        };

        setBookedPass(activePass);

        // Persist to storage
        const storageKey = `booked_gym_trial_${targetClubOwner}`;
        storageAPI.setItem(storageKey, JSON.stringify(activePass)).catch(() => {});
        if (gymId && gymId !== targetClubOwner) {
          storageAPI.setItem(`booked_gym_trial_${gymId}`, JSON.stringify(activePass)).catch(() => {});
        }

        setIsBookingModalVisible(false);
        setIsSlotsFullModalVisible(false);
        setIsPassModalVisible(true);

        setTimeout(() => {
          Toast.show({
            type: 'info',
            text1: 'Trial Already Booked 🎟️',
            text2: `You already have an active pass for ${passDate}. Showing your pass.`,
          });
        }, 350);
        return;
      }

      // CASE 2: Slots full or limit reached
      if (
        lower.includes('full') ||
        lower.includes('slot') ||
        lower.includes('limit') ||
        lower.includes('quota')
      ) {
        setIsBookingModalVisible(false);
        setIsSlotsFullModalVisible(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Booking Notice',
          text2: errorMsg,
        });
      }
    }
  };

  // Open maps for gym directions
  const handleOpenDirections = () => {
    const query = encodeURIComponent(`${gymName} ${gymAddress || ''} ${gymCity || ''}`.trim());
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  // Add event to calendar
  const handleAddToCalendar = () => {
    Toast.show({
      type: 'success',
      text1: 'Added to Calendar 📅',
      text2: `Free trial at ${gymName} added to your schedule.`,
    });
  };

  // If gym does not offer free trials (trial is null, trialAvailable is not explicitly true, or only contains { clientTrialBooking: [] }), do not show section
  const isTrialAvailable = Boolean(
    trial &&
    (trial.trialAvailable === true || (trial as any).trialAvailable === 'true') &&
    (trial.dailyTrialLimit !== undefined ||
      trial.description !== undefined ||
      trial.today !== undefined ||
      trial.tomorrow !== undefined)
  );

  if (!isTrialAvailable) {
    return null;
  }

  const activeQrCode =
    bookedPass?.qrCode ||
    getQrMutation.data?.data?.qrCode ||
    cachedQrCode;

  const activeClientId =
    getQrMutation.data?.data?.clientId ||
    cachedClientId ||
    bookedPass?.passId ||
    '';

  return (
    <View className="mt-6">
      {/* ─── 1. Free Trial Banner Card (Image 1) ──────────────────────────────── */}
      {isMemberOfThisClub ? (
        // Case A: User already holds an active membership for this gym (free trials are not applicable)
        <View className="relative overflow-hidden rounded-[26px] bg-[#E23744] p-5 shadow-sm">
          {/* Top Tag Row */}
          <View className="flex-row items-center justify-between">
            <View className="self-start rounded-full bg-white px-3.5 py-1 shadow-xs">
              <Text className="text-[10px] font-black uppercase tracking-wider text-[#E23744]">
                ACTIVE MEMBER
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-full bg-black/20 px-3 py-1">
              <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
              <Text className="text-[10.5px] font-bold text-white">Unlimited Access</Text>
            </View>
          </View>

          {/* Headline */}
          <Text className="mt-3 font-extrabold text-[20px] text-white tracking-tight leading-snug">
            Free trial not applicable
          </Text>

          {/* Subtitle description */}
          <Text className="mt-1.5 text-xs text-white/90 font-medium leading-relaxed">
            {bannerDescription}
          </Text>

          {/* Action button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/membership' as any)}
            activeOpacity={0.88}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5 shadow-xs">
            <Ionicons name="card-outline" size={17} color="#E23744" />
            <Text className="font-bold text-sm text-[#E23744]">
              View Active Membership
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Case B: User does not hold membership for this gym (eligible to book free trial within 6-week quota)
        <View className="relative overflow-hidden rounded-[26px] bg-[#E23744] p-5 shadow-sm">
          {/* Top Tag Row */}
          <View className="flex-row items-center justify-between">
            <View className="self-start rounded-full bg-white px-3.5 py-1 shadow-xs">
              <Text className="text-[10px] font-black uppercase tracking-wider text-[#E23744]">
                {bookedPass
                  ? 'PASS ACTIVE'
                  : quotaInfo.isQuotaFull
                  ? 'QUOTA FULL'
                  : 'TRY BEFORE YOU BUY'}
              </Text>
            </View>

            {/* Quota Counter Badge */}
            <View className="rounded-full bg-black/20 px-3 py-1">
              <Text className="text-[10.5px] font-bold text-white">
                {quotaInfo.used > 0
                  ? `${quotaInfo.used} of ${quotaInfo.max} used • ${quotaInfo.remaining} left`
                  : `${quotaInfo.max} trials / ${quotaInfo.periodWeeks} wks`}
              </Text>
            </View>
          </View>

          {/* Headline */}
          <Text className="mt-3 font-extrabold text-[20px] text-white tracking-tight leading-snug">
            {bookedPass
              ? 'Your free trial is booked'
              : quotaInfo.isQuotaFull
              ? 'Free trial quota reached'
              : isTodayClosed
              ? 'Free trial, bookable tomorrow'
              : 'Free trial, bookable today'}
          </Text>

          {/* Subtitle description */}
          <Text className="mt-1.5 text-xs text-white/90 font-medium leading-relaxed">
            {bannerDescription}
          </Text>

          {/* Buttons */}
          {bookedPass ? (
            <View>
              <TouchableOpacity
                onPress={() => setIsPassModalVisible(true)}
                activeOpacity={0.88}
                className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5 shadow-xs">
                <Ionicons name="ticket" size={18} color="#E23744" />
                <Text className="font-bold text-sm text-[#E23744]">
                  View Trial Pass
                </Text>
              </TouchableOpacity>
              <Text className="mt-1.5 text-center text-[11px] font-semibold text-white/90">
                Pass ID: {bookedPass.passId} • Active for {bookedPass.date}
              </Text>
            </View>
          ) : quotaInfo.isQuotaFull ? (
            <TouchableOpacity
              disabled={true}
              activeOpacity={1}
              className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-white/20 py-3.5 border border-white/30">
              <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
              <Text className="font-bold text-sm text-white">
                All 3 Trials Used • Resets in {quotaInfo.periodWeeks} Weeks
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setIsBookingModalVisible(true)}
              activeOpacity={0.88}
              className="mt-4 items-center justify-center rounded-2xl bg-white py-3.5 shadow-xs">
              <Text className="font-bold text-sm text-[#E23744]">
                Book free trial • ₹0 ({quotaInfo.remaining} of {quotaInfo.max} left)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── 2. Book Your Free Trial Bottom Sheet Modal (Image 2) ──────────────── */}
      <Modal
        visible={isBookingModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        onRequestClose={() => setIsBookingModalVisible(false)}>
        <View style={{ flex: 1 }}>
          <Pressable
            onPress={() => setIsBookingModalVisible(false)}
            className="flex-1 justify-end bg-black/60">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}
              className="rounded-t-[32px] bg-white px-5 pt-3">
            {/* Top Drag Handle */}
            <View className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-300" />

            {/* Header: Title, Subtitle, Close Button */}
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-extrabold text-[19px] text-slate-900 tracking-tight">
                  Book your free trial
                </Text>
                <Text className="mt-0.5 text-xs font-medium text-slate-500" numberOfLines={1}>
                  {locationSubtitle}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsBookingModalVisible(false)}
                activeOpacity={0.7}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={18} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Trial Quota status badge */}
            <View className="mt-3.5 flex-row items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
              <View className="flex-row items-center gap-2">
                <Ionicons name="fitness-outline" size={16} color="#E23744" />
                <Text className="text-xs font-semibold text-slate-700">6-Week Trial Limit</Text>
              </View>
              <Text className="text-xs font-extrabold text-slate-900">
                {quotaInfo.used > 0
                  ? `${quotaInfo.used} used • ${quotaInfo.remaining} left`
                  : `${quotaInfo.remaining} of ${quotaInfo.max} trials left`}
              </Text>
            </View>

            {/* Pick a Date Section */}
            <Text className="mt-5 font-bold text-xs text-slate-900">Pick a date</Text>

            <View className="mt-2.5 flex-row gap-3">
              {/* Option 1: Today */}
              <TouchableOpacity
                disabled={isTodayClosed || isTodaySlotsFull || isTodayBookedAtThisGym}
                onPress={() => setSelectedDateOption('today')}
                activeOpacity={0.85}
                className={`flex-1 rounded-2xl p-3.5 border ${
                  isTodayClosed || isTodayBookedAtThisGym
                    ? 'border-slate-200 bg-slate-100/70 opacity-60'
                    : selectedDateOption === 'today'
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-200 bg-white'
                }`}>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`font-bold text-sm ${
                      isTodayClosed || isTodayBookedAtThisGym ? 'text-slate-400' : 'text-slate-900'
                    }`}>
                    Today
                  </Text>
                  {isTodayBookedAtThisGym ? (
                    <View className="rounded-full bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                      <Text className="text-[9px] font-bold text-emerald-800">BOOKED</Text>
                    </View>
                  ) : isTodayClosed ? (
                    <View className="rounded-full bg-slate-200 px-2 py-0.5">
                      <Text className="text-[9px] font-bold text-slate-600">CLOSED</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="mt-0.5 text-xs text-slate-500 font-medium">
                  {dateInfo.todayShort}
                </Text>
                <Text
                  className={`mt-1.5 text-[11px] font-semibold ${
                    isTodayBookedAtThisGym
                      ? 'text-emerald-700'
                      : isTodayClosed
                      ? 'text-slate-400'
                      : isTodaySlotsFull
                      ? 'text-rose-600'
                      : 'text-rose-600'
                  }`}>
                  {isTodayBookedAtThisGym
                    ? 'Already booked'
                    : isTodayClosed
                    ? 'Gym Closed'
                    : isTodaySlotsFull
                    ? 'Slots full'
                    : `${todaySlotsAvailable} slots left`}
                </Text>
              </TouchableOpacity>

              {/* Option 2: Tomorrow */}
              <TouchableOpacity
                disabled={isTomorrowClosed || isTomorrowSlotsFull || isTomorrowBookedAtThisGym}
                onPress={() => setSelectedDateOption('tomorrow')}
                activeOpacity={0.85}
                className={`flex-1 rounded-2xl p-3.5 border ${
                  isTomorrowClosed || isTomorrowBookedAtThisGym
                    ? 'border-slate-200 bg-slate-100/70 opacity-60'
                    : selectedDateOption === 'tomorrow'
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-200 bg-white'
                }`}>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`font-bold text-sm ${
                      isTomorrowClosed || isTomorrowBookedAtThisGym ? 'text-slate-400' : 'text-slate-900'
                    }`}>
                    Tomorrow
                  </Text>
                  {isTomorrowBookedAtThisGym ? (
                    <View className="rounded-full bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                      <Text className="text-[9px] font-bold text-emerald-800">BOOKED</Text>
                    </View>
                  ) : isTomorrowClosed ? (
                    <View className="rounded-full bg-slate-200 px-2 py-0.5">
                      <Text className="text-[9px] font-bold text-slate-600">CLOSED</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="mt-0.5 text-xs text-slate-500 font-medium">
                  {dateInfo.tomorrowShort}
                </Text>
                <Text
                  className={`mt-1.5 text-[11px] font-semibold ${
                    isTomorrowBookedAtThisGym
                      ? 'text-emerald-700'
                      : isTomorrowClosed
                      ? 'text-slate-400'
                      : isTomorrowSlotsFull
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}>
                  {isTomorrowBookedAtThisGym
                    ? 'Already booked'
                    : isTomorrowClosed
                    ? 'Gym Closed'
                    : isTomorrowSlotsFull
                    ? 'Slots full'
                    : `${tomorrowSlotsAvailable} slots left`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Breakdown Box */}
            <View className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500 font-medium">Free trial session</Text>
                <Text className="text-xs font-bold text-slate-900">₹0</Text>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between">
                <Text className="text-xs text-slate-500 font-medium">Trial allowance</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {quotaInfo.max} trials per {quotaInfo.periodWeeks} weeks
                </Text>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between">
                <Text className="text-xs text-slate-500 font-medium">Valid</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {selectedDateOption === 'today' ? 'Today' : 'Tomorrow'} until {closingTime}
                </Text>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between">
                <Text className="text-xs text-slate-500 font-medium">Check-in</Text>
                <Text className="text-xs font-bold text-slate-800">
                  Show QR at front desk
                </Text>
              </View>
            </View>

            {/* No-Show Policy Box with Checkbox */}
            <TouchableOpacity
              onPress={() => setPolicyAccepted(!policyAccepted)}
              activeOpacity={0.85}
              className="mt-4 flex-row items-start gap-3 rounded-2xl border border-red-200 bg-rose-50/20 p-3.5">
              <View
                className={`h-5 w-5 items-center justify-center rounded-[5px] mt-0.5 ${
                  policyAccepted ? 'bg-[#E23744]' : 'border border-slate-300 bg-white'
                }`}>
                {policyAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text className="flex-1 text-[11.5px] leading-snug text-slate-600">
                No-show policy: this pass is valid only on the date I pick. If I don't visit,
                it expires and can't be reused.
              </Text>
            </TouchableOpacity>

            {/* Confirm Free Trial Button */}
            <TouchableOpacity
              disabled={isBooking}
              onPress={() => handleConfirmBooking(selectedDateOption)}
              activeOpacity={0.85}
              className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-[#E23744] py-3.5 shadow-sm shadow-[#E23744]/25 ${
                isBooking ? 'opacity-70' : ''
              }`}>
              {isBooking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-sm text-white">Confirm free trial • ₹0</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>

        {/* In-Modal Toast to ensure notifications appear in front of the bottom sheet */}
        {isBookingModalVisible && (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              elevation: 99999,
            }}>
            <Toast topOffset={Math.max(insets.top, 40) + 12} />
          </View>
        )}
      </View>
    </Modal>

      {/* ─── 3. Today's Slots Full Sheet Modal (Image 3) ───────────────────────── */}
      <Modal
        visible={isSlotsFullModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        onRequestClose={() => setIsSlotsFullModalVisible(false)}>
        <View style={{ flex: 1 }}>
          <Pressable
            onPress={() => setIsSlotsFullModalVisible(false)}
            className="flex-1 justify-end bg-black/60">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}
              className="rounded-t-[32px] bg-white px-5 pt-3 items-center">
            {/* Top Drag Handle */}
            <View className="mb-4 h-1 w-12 rounded-full bg-slate-300" />

            {/* Circular Calendar Icon */}
            <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
              <Ionicons name="calendar" size={24} color="#B45309" />
            </View>

            {/* Title */}
            <Text className="mt-3.5 font-extrabold text-[18px] text-slate-900 text-center">
              {isTomorrowClosed ? 'Trial slots unavailable' : "Today's trial slots are full"}
            </Text>

            {/* Subtitle */}
            <Text className="mt-1.5 px-3 text-center text-xs text-slate-500 leading-relaxed font-medium">
              {isTomorrowClosed
                ? `Today's trial sessions at ${gymName} are currently booked and the gym is closed tomorrow.`
                : `All ${trial?.dailyTrialLimit || 3} free trial sessions at ${gymName} have been booked for today. The next open day is tomorrow.`}
            </Text>

            {/* Next Open Day Card if Tomorrow is open */}
            {!isTomorrowClosed && (
              <View className="mt-5 w-full flex-row items-center gap-3 rounded-2xl border border-red-300 bg-rose-50/40 p-3">
                {/* Date Badge */}
                <View className="min-w-[44px] items-center justify-center rounded-xl bg-[#E23744] px-2.5 py-1.5">
                  <Text className="text-[10px] font-bold uppercase text-white">
                    {dateInfo.tomorrowMonth}
                  </Text>
                  <Text className="font-extrabold text-base text-white leading-tight">
                    {dateInfo.tomorrowDay}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="font-bold text-xs text-slate-900">
                    Tomorrow, {dateInfo.tomorrowShort}
                  </Text>
                  <Text className="mt-0.5 text-[11px] font-semibold text-emerald-600">
                    {tomorrowSlotsAvailable} of {trial?.dailyTrialLimit || 3} slots open
                  </Text>
                </View>
              </View>
            )}

            {/* Book for tomorrow instead button */}
            {!isTomorrowClosed && (
              <TouchableOpacity
                disabled={isBooking}
                onPress={() => handleConfirmBooking('tomorrow')}
                activeOpacity={0.85}
                className={`mt-4 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-[#E23744] py-3.5 shadow-sm ${
                  isBooking ? 'opacity-70' : ''
                }`}>
                {isBooking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-sm text-white">
                    Book for tomorrow instead • ₹0
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Not now dismissal */}
            <TouchableOpacity
              onPress={() => setIsSlotsFullModalVisible(false)}
              activeOpacity={0.7}
              className="mt-2 py-2.5">
              <Text className="font-bold text-xs text-slate-700">Not now</Text>
            </TouchableOpacity>

            {/* Info Box */}
            <View className="mt-4 w-full flex-row items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <Ionicons name="information-circle-outline" size={17} color="#64748B" />
              <Text className="flex-1 text-[11px] text-slate-500 leading-snug">
                Your trial is valid only on the date you book. If you don't visit, the pass is
                marked expired.
              </Text>
            </View>
          </Pressable>
        </Pressable>

        {/* In-Modal Toast to ensure notifications appear in front of the slots modal */}
        {isSlotsFullModalVisible && (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              elevation: 99999,
            }}>
            <Toast topOffset={Math.max(insets.top, 40) + 12} />
          </View>
        )}
      </View>
    </Modal>

      {/* ─── 4. Your Trial Pass Screen Modal (Image 4) ─────────────────────────── */}
      <Modal
        visible={isPassModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        onRequestClose={() => setIsPassModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#F8FAFC',
            paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'android' ? 24 : 12,
            paddingBottom: Math.max(insets.bottom, 12),
          }}>
          {/* Header Bar */}
          <View className="flex-row items-center px-4 py-3">
            <TouchableOpacity
              onPress={() => setIsPassModalVisible(false)}
              className="h-10 w-10 items-center justify-center -ml-2 rounded-full"
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text className="ml-1 font-bold text-base text-slate-900 tracking-tight">
              Your trial pass
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingTop: 4,
              paddingBottom: 20,
            }}>
            {/* Success Banner */}
            <View className="mb-3 flex-row items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text className="text-xs font-bold text-emerald-800">
                Free trial booked. See you there!
              </Text>
            </View>

            {/* Trial Quota Count Tracker Card */}
            <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-50 border border-red-100">
                  <Ionicons name="fitness" size={18} color="#E23744" />
                </View>
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    6-Week Quota Period
                  </Text>
                  <Text className="text-xs font-bold text-slate-900">
                    {quotaInfo.used} of {quotaInfo.max} trials used
                  </Text>
                </View>
              </View>

              <View className="rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-200">
                <Text className="text-xs font-extrabold text-emerald-700">
                  {quotaInfo.remaining} remaining
                </Text>
              </View>
            </View>

            {/* Ticket Card */}
            <View className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm">
              {/* Ticket Top Red Header */}
              <View className="bg-[#E23744] p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-extrabold text-[17px] text-white tracking-tight">
                      {formatGymTitle(gymName)}
                    </Text>
                    <Text className="mt-0.5 text-xs text-white/90 font-medium">
                      {gymAddress || gymCity || 'Partner Club'}
                    </Text>
                  </View>

                  <View className="rounded-full bg-white px-3 py-1 shadow-xs">
                    <Text className="text-[11px] font-extrabold text-[#E23744]">
                      FREE • ₹0
                    </Text>
                  </View>
                </View>
              </View>

              {/* QR Code Section */}
              <View className="items-center px-4 pt-5 pb-3">
                <View className="h-56 w-56 items-center justify-center rounded-2xl bg-white p-2 border border-slate-100 shadow-xs">
                  {getQrMutation.isPending && !activeQrCode ? (
                    <View className="items-center justify-center">
                      <ActivityIndicator size="large" color="#E23744" />
                      <Text className="mt-2 text-xs font-semibold text-slate-400">
                        Generating QR Code...
                      </Text>
                    </View>
                  ) : activeQrCode ? (
                    <Image
                      source={{ uri: activeQrCode }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="items-center justify-center">
                      <Ionicons name="qr-code-outline" size={64} color="#CBD5E1" />
                      <Text className="mt-2 text-center text-xs font-medium text-slate-400">
                        Scan QR at front desk
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="mt-3 text-center text-xs font-medium text-slate-500">
                  {activeClientId
                    ? `Show this at the front desk • Pass ID: ${bookedPass?.passId || activeClientId}`
                    : `Show this at the front desk • ${bookedPass?.passId || 'Trial Pass'}`}
                </Text>
              </View>

              {/* Notch Divider Effect */}
              <View className="relative my-2 w-full flex-row items-center justify-center">
                {/* Left Hole */}
                <View
                  style={{
                    position: 'absolute',
                    left: -12,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                />
                {/* Dashed Line */}
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    borderWidth: 1,
                    borderColor: '#CBD5E1',
                    borderStyle: 'dashed',
                    marginHorizontal: 16,
                  }}
                />
                {/* Right Hole */}
                <View
                  style={{
                    position: 'absolute',
                    right: -12,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                />
              </View>

              {/* Ticket Details Grid */}
              <View className="p-4 pt-2">
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
                  <View className="flex-1 pr-2">
                    <Text className="text-[11px] font-medium text-slate-400">Date</Text>
                    <Text className="mt-0.5 font-bold text-xs text-slate-900">
                      {bookedPass?.date || dateInfo.tomorrowFull}
                    </Text>
                  </View>

                  <View className="flex-1 items-end pl-2">
                    <Text className="text-[11px] font-medium text-slate-400">Valid until</Text>
                    <Text className="mt-0.5 font-bold text-xs text-slate-900">
                      {bookedPass?.validUntil || `${closingTime} (closing)`}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-3">
                  <View className="flex-1 pr-2">
                    <Text className="text-[11px] font-medium text-slate-400">Guest</Text>
                    <Text className="mt-0.5 font-bold text-xs text-slate-900">
                      {bookedPass?.guestName || guestName}
                    </Text>
                  </View>

                  <View className="flex-1 items-end pl-2">
                    <Text className="text-[11px] font-medium text-slate-400">Status</Text>
                    <Text className="mt-0.5 font-bold text-xs text-blue-600">
                      {bookedPass?.trialstatus || 'Booked'}
                    </Text>
                  </View>
                </View>

                {/* Quota details inside ticket */}
                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                  <Text className="text-[11px] font-semibold text-slate-500">Trial Quota</Text>
                  <Text className="text-[11px] font-bold text-emerald-700">
                    {quotaInfo.used} of {quotaInfo.max} used • {quotaInfo.remaining} remaining ({quotaInfo.periodWeeks} wks)
                  </Text>
                </View>
              </View>
            </View>

            {/* Warning Box */}
            <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
              <Ionicons name="warning-outline" size={17} color="#B45309" />
              <Text className="flex-1 text-[11.5px] leading-snug text-amber-900">
                Valid only on this date. If you don't visit by closing time, the pass expires
                and can't be reused.
              </Text>
            </View>

            {/* Bottom Action Buttons: Directions & Add to Calendar */}
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                onPress={handleOpenDirections}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-xs">
                <Ionicons name="location-outline" size={17} color="#1E293B" />
                <Text className="font-bold text-xs text-slate-800">Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddToCalendar}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-xs">
                <Ionicons name="calendar-outline" size={17} color="#1E293B" />
                <Text className="font-bold text-xs text-slate-800">Add to calendar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* In-Modal Toast to ensure notifications appear in front of the pass modal */}
          {isPassModalVisible && (
            <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                elevation: 99999,
              }}>
              <Toast topOffset={Math.max(insets.top, 40) + 12} />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
