import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clientBasicDetails,
  clientBodyInfo,
  clientLocation,
  clientSelfie,
  clientGovId,
  clientSubmit,
  checkUserStep,
  getQr,
  clientVerifyOtp,
  clientResendOtp,
  searchNearbyGyms,
  getGymDetail,
  clientSendOtp,
  getFavorites,
  addFavorite,
  removeFavorite,
  getMyCheckins,
  CheckinItem,
  MyCheckinsResponse,
  getOutdoorMembershipPlans,
  OutdoorMembershipClub,
  OutdoorPlanItem,
  createMembershipCheckoutBuy,
  MembershipCheckoutBuyPayload,
  MembershipCheckoutBuyResponse,
  getClientSubscriptions,
  ClientSubscriptionItem,
  ClientSubscriptionsResponse,
  bookGymTrial,
  getClientGymTrials,
  cancelGymTrial,
  rescheduleGymTrial,
  BookGymTrialPayload,
  BookGymTrialResponse,
  GymTrialData,
  GymTrialQuota,
  ClientTrialItem,
  CancelGymTrialPayload,
  CancelGymTrialResponse,
  RescheduleGymTrialPayload,
  RescheduleGymTrialResponse,
} from '@/api/clientApi';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';
import { storageAPI } from '@/utility/storage';

export const useClientBasicDetails = () => {
  const { logOut } = useAuthStore();
  return useMutation({
    mutationFn: ({
      name,
      email,
      phoneNumber,
      gender,
    }: {
      name: string;
      email: string;
      phoneNumber: string;
      gender?: string;
    }) => clientBasicDetails(name, email, phoneNumber, gender),
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Failed to save basic details';
      if (
        msg === 'Client detail already exists' ||
        msg?.toLowerCase()?.includes('client detail already exists')
      ) {
        logOut();
      }
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useClientBodyInfo = () => {
  return useMutation({
    mutationFn: ({
      height,
      weight,
      date_of_birth,
    }: {
      height: string;
      weight: string;
      date_of_birth: string;
    }) => clientBodyInfo(height, weight, date_of_birth),
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Failed to save body info';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useClientLocation = () => {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: string; longitude: string }) =>
      clientLocation(latitude, longitude),
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Failed to save location';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useClientSelfie = () => {
  return useMutation({
    mutationFn: (image: string) => clientSelfie(image),
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Failed to upload selfie';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useClientGovId = () => {
  return useMutation({
    mutationFn: (image: string) => clientGovId(image),
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Failed to upload government ID';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useClientSubmit = () => {
  return useMutation({
    mutationFn: clientSubmit,
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Failed to submit verification';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useCheckUserStep = () => {
  const { logOut } = useAuthStore();
  return useMutation({
    mutationFn: checkUserStep,
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Failed to fetch status';
      if (
        msg === 'Client detail already exists' ||
        msg?.toLowerCase()?.includes('client detail already exists')
      ) {
        logOut();
      }
      Toast.show({ type: 'error', text1: 'Error Checks', text2: msg });
    },
  });
};

export const useGetQr = () => {
  return useMutation({
    mutationFn: getQr,
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Failed to fetch QR';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

// Auto-fetching Query hook for the client's verified QR code from /api/client-details/me/qr
export const useClientQrCode = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['client-verified-qr'],
    queryFn: async () => {
      const response = await getQr();
      const qrCode = response?.data?.qrCode;
      const clientId = response?.data?.clientId;
      if (qrCode) {
        await storageAPI.setItem('client_qr_code', qrCode).catch(() => {});
      }
      if (clientId) {
        await storageAPI.setItem('client_id', clientId).catch(() => {});
      }
      return response?.data;
    },
    enabled: !!user?.token,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    refetchOnMount: 'always',
  });
};

export const useClientSendOtp = () => {
  return useMutation({
    mutationFn: (identifier?: string) => clientSendOtp(identifier),
    onSuccess: (data: any) => {
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: data?.message || 'Verification code sent successfully.',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Failed to send OTP';
      if (msg.toLowerCase().includes('30 seconds') || msg.toLowerCase().includes('wait')) {
        Toast.show({
          type: 'info',
          text1: 'OTP Already Sent 📩',
          text2: 'Please check your SMS. The code is valid for 2 minutes.',
        });
        return;
      }
      Toast.show({ type: 'error', text1: 'Request Failed', text2: msg });
    },
  });
};

export const useClientVerifyOtp = () => {
  return useMutation({
    mutationFn: (param: string | { otp: string; identifier?: string }) => {
      if (typeof param === 'string') {
        return clientVerifyOtp(param);
      }
      return clientVerifyOtp(param.otp, param.identifier);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Invalid or expired OTP';
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: msg });
    },
  });
};

export const useClientResendOtp = () => {
  return useMutation({
    mutationFn: (payload?: { identifier?: string; phoneNumber?: string; email?: string }) =>
      clientResendOtp(payload),
    onSuccess: (data: any) => {
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: data?.message || 'Verification code sent successfully.',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Failed to send OTP';
      if (msg.toLowerCase().includes('30 seconds') || msg.toLowerCase().includes('wait')) {
        Toast.show({
          type: 'info',
          text1: 'OTP Already Sent 📩',
          text2: 'Please check your SMS. The code is valid for 2 minutes.',
        });
        return;
      }
      Toast.show({ type: 'error', text1: 'Request Failed', text2: msg });
    },
  });
};

export const useNearbyGyms = (params: {
  city?: string;
  latitude?: number | string;
  longitude?: number | string;
  query?: string;
  radius?: number | string;
}) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['nearby-gyms', params.city, params.latitude, params.longitude, params.query, params.radius],
    queryFn: () => searchNearbyGyms(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
    enabled: !!user?.token && user.verification_status === 'approved'
  });
};

export const useGymDetail = (id: string | undefined) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['gym-detail', id],
    queryFn: () => getGymDetail(id!),
    enabled: !!id && !!user?.token,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
};

// ─── Favorites Hooks ─────────────────────────────────────────────────────────

// Helper to extract a set of favorite IDs/documentIds from response
export const extractFavoriteIds = (favData: any): Set<string> => {
  const ids = new Set<string>();
  if (!favData) return ids;

  const list = Array.isArray(favData)
    ? favData
    : Array.isArray(favData?.data)
      ? favData.data
      : Array.isArray(favData?.favorites)
        ? favData.favorites
        : [];

  list.forEach((item: any) => {
    const docId =
      item?.documentId ||
      item?.club?.documentId ||
      item?.clubDocumentId ||
      (typeof item === 'string' ? item : null);
    const rawId = item?.id || item?.club?.id || item?.clubId;

    if (docId) ids.add(String(docId));
    if (rawId) ids.add(String(rawId));
  });

  return ids;
};

// 1. Get all client favorites
export const useGetFavorites = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['client-favorites'],
    queryFn: getFavorites,
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!user?.token
  });
};

// 2. Add to favorites
export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clubDocumentId: string) => addFavorite(clubDocumentId),
    onSuccess: (_data, clubDocumentId) => {
      queryClient.setQueryData(['client-favorites'], (old: any) => {
        if (!old) return [{ documentId: clubDocumentId }];
        const list = Array.isArray(old) ? old : Array.isArray(old?.data) ? old.data : [];
        return [...list, { documentId: clubDocumentId }];
      });
    },
    onError: () => { },
  });
};

// 3. Remove from favorites
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clubDocumentId: string) => removeFavorite(clubDocumentId),
    onSuccess: (_data, clubDocumentId) => {
      queryClient.setQueryData(['client-favorites'], (old: any) => {
        if (!old) return [];
        const list = Array.isArray(old) ? old : Array.isArray(old?.data) ? old.data : [];
        return list.filter((item: any) => {
          const docId = item?.documentId || item?.club?.documentId || item?.id;
          return String(docId) !== String(clubDocumentId);
        });
      });
    },
    onError: () => { },
  });
};

// 4. Combined toggle hook for easy usage across cards and screens
export const useToggleFavorite = () => {
  const addMutation = useAddFavorite();
  const removeMutation = useRemoveFavorite();

  const toggleFavorite = async (clubDocumentId: string, isCurrentlyFav: boolean) => {
    if (!clubDocumentId) return;

    if (isCurrentlyFav) {
      await removeMutation.mutateAsync(clubDocumentId);
    } else {
      await addMutation.mutateAsync(clubDocumentId);
    }
  };

  return {
    toggleFavorite,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
};

// ─── Outdoor Membership Plans Hook ──────────────────────────────────────────
export const useOutdoorMembershipPlans = (params?: {
  latitude?: number | string;
  longitude?: number | string;
  city?: string;
  radius?: number | string;
  search?: string;
}) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: [
      'outdoor-membership-plans',
      params?.city,
      params?.latitude,
      params?.longitude,
      params?.search,
      params?.radius,
    ],
    queryFn: () => getOutdoorMembershipPlans(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
    enabled: !!user?.token,
  });
};

// ─── Visits / Check-ins Hooks ──────────────────────────────────────────────
export const useMyCheckins = () => {
  return useQuery({
    queryKey: ['client-my-checkins'],
    queryFn: getMyCheckins,
    staleTime: 1000 * 60, // 1 minute
  });
};

// ─── Membership Checkout Hook ──────────────────────────────────────────────
export const useMembershipCheckoutBuy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MembershipCheckoutBuyPayload) => createMembershipCheckoutBuy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['gym-detail'] });
      queryClient.invalidateQueries({ queryKey: ['club-detail'] });
    },
  });
};

// ─── Client Subscriptions Hook ─────────────────────────────────────────────
export const useClientSubscriptions = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['client-subscriptions'],
    queryFn: getClientSubscriptions,
    enabled: !!user?.token,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnMount: 'always',
  });
};

// ─── Gym Free Trial Hooks ───────────────────────────────────────────────────
export const useBookGymTrial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookGymTrialPayload) => bookGymTrial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-trials'] });
      queryClient.invalidateQueries({ queryKey: ['gym-detail'] });
      queryClient.invalidateQueries({ queryKey: ['club-detail'] });
      queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
    },
  });
};

export const useClientGymTrials = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['gym-trials'],
    queryFn: getClientGymTrials,
    enabled: !!user?.token,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useCancelGymTrial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, reason }: { docId: string | number; reason?: string }) =>
      cancelGymTrial(docId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-trials'] });
      queryClient.invalidateQueries({ queryKey: ['gym-detail'] });
      queryClient.invalidateQueries({ queryKey: ['club-detail'] });
      queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
    },
  });
};

export const useRescheduleGymTrial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, payload }: { docId: string | number; payload?: RescheduleGymTrialPayload }) =>
      rescheduleGymTrial(docId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-trials'] });
      queryClient.invalidateQueries({ queryKey: ['gym-detail'] });
      queryClient.invalidateQueries({ queryKey: ['club-detail'] });
      queryClient.invalidateQueries({ queryKey: ['client-subscriptions'] });
    },
  });
};

export type {
  CheckinItem,
  MyCheckinsResponse,
  OutdoorMembershipClub,
  OutdoorPlanItem,
  MembershipCheckoutBuyPayload,
  MembershipCheckoutBuyResponse,
  ClientSubscriptionItem,
  ClientSubscriptionsResponse,
  BookGymTrialPayload,
  BookGymTrialResponse,
  GymTrialData,
  GymTrialQuota,
  ClientTrialItem,
  CancelGymTrialPayload,
  CancelGymTrialResponse,
  RescheduleGymTrialPayload,
  RescheduleGymTrialResponse,
};



