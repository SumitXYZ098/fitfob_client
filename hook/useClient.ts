import { useMutation, useQuery } from '@tanstack/react-query';
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
} from '@/api/clientApi';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';

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
}) => {
  return useQuery({
    queryKey: ['nearby-gyms', params.city, params.latitude, params.longitude, params.query],
    queryFn: () => searchNearbyGyms(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};

export const useGymDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['gym-detail', id],
    queryFn: () => getGymDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};
