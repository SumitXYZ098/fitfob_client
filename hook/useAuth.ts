import { useMutation } from '@tanstack/react-query';
import {
  forgotResendOtpApi,
  forgotSendOtpApi,
  forgotVerifyOtpApi,
  loginUserApi,
  resendOtpApi,
  resetPasswordApi,
  signupStep1Api,
  verifyOtpApi,
  googleLoginApi,
  facebookLoginApi,
} from '@/api/authApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export const useSignupRequest = () => {
  return useMutation({
    mutationFn: signupStep1Api,
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: resendOtpApi,
    onSuccess: (data) => {
      console.log('✅ OTP Resent Successfully:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: 'A new code has been sent to your email.',
        position: 'top',
        visibilityTime: 4000,
      });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Failed to resend OTP.';
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: errorMsg,
        position: 'top',
      });
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: verifyOtpApi,
  });
};

export const useLoginRequest = () => {
  return useMutation({
    mutationFn: loginUserApi,
  });
};

export const useForgotSendOtp = () => {
  return useMutation({
    mutationFn: forgotSendOtpApi,
    onSuccess: (data) => {
      console.log('✅ Forgot Password OTP Sent:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: 'Check your email for the recovery code.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message || 'Failed to send OTP';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useForgotResendOtp = () => {
  return useMutation({
    mutationFn: forgotResendOtpApi,
    onSuccess: (data) => {
      console.log('✅ Forgot Password OTP Resent:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: 'A new code has been sent to your email.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message || 'Failed to resend OTP';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

// verify
export const useForgotVerifyOtp = () => {
  return useMutation<any, any, { identifier: string; otp: string }>({
    mutationFn: forgotVerifyOtpApi,
    onSuccess: (data) => {
      console.log('✅ Forgot OTP Verified:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Verified! ✅',
        text2: 'Set your new password now.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message || 'Invalid OTP code';
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: msg });
    },
  });
};
//  set password
export const useResetPassword = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: (data) => {
      console.log('✅ Password Reset Success:', data);
      Toast.show({ type: 'success', text1: 'Password Changed Successfully!' });
      router.replace('/auth/Login');
    },
    onError: (error: any) => {
      console.log('❌ BACKEND FULL ERROR:', JSON.stringify(error.response?.data, null, 2));

      const msg = error.response?.data?.error?.message || 'Unable to reset password.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useGoogleLogin = () => {
  const { setUser } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: googleLoginApi,
    onSuccess: (data) => {
      const user = data?.user || data;
      const role = user?.role || data?.role;
      const roleType = (
        typeof role === 'string' ? role : role?.type || role?.name || ''
      ).toLowerCase().trim();

      if (roleType && roleType !== 'client') {
        console.warn('⛔ Google Login rejected: User role is not client:', roleType);
        useAuthStore.getState().logOut();
        Toast.show({
          type: 'error',
          text1: 'Access Denied 🚫',
          text2: 'Only client account can log in here. Please register as a client.',
        });
        return;
      }

      const token = data?.jwt || data?.token || user?.token;
      if (token && user) {
        console.log('✅ Google Login Success:', user.username);

        const userWithToken = {
          ...user,
          token,
        };

        setUser(userWithToken, true);
        console.log(userWithToken, 'usr Data');

        if (router.canDismiss()) {
          router.dismissAll();
        }

        if (userWithToken.verification_status === 'approved') {
          router.replace('/(tabs)');
        } else if (userWithToken.verification_status === 'in-review') {
          router.replace('/onBoardingScreen/UnderReview');
        } else {
          router.replace('/onBoardingScreen/OnBoardingStep');
        }
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Failed',
        text2:
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          'Something went wrong',
      });
    },
  });
};

export const useFacebookLogin = () => {
  const { setUser } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: facebookLoginApi,
    onSuccess: (data) => {
      const user = data?.user || data;
      const role = user?.role || data?.role;
      const roleType = (
        typeof role === 'string' ? role : role?.type || role?.name || ''
      ).toLowerCase().trim();

      if (roleType && roleType !== 'client') {
        console.warn('⛔ Facebook Login rejected: User role is not client:', roleType);
        useAuthStore.getState().logOut();
        Toast.show({
          type: 'error',
          text1: 'Access Denied 🚫',
          text2: 'Only client account can log in here. Please register as a client.',
        });
        return;
      }

      const token = data?.jwt || data?.token || user?.token;
      if (token && user) {
        console.log('✅ Facebook Login Success:', user.username);

        const userWithToken = {
          ...user,
          token,
        };

        setUser(userWithToken, true);
        console.log(userWithToken, 'usr Data');

        if (router.canDismiss()) {
          router.dismissAll();
        }

        if (userWithToken.verification_status === 'approved') {
          router.replace('/(tabs)');
        } else if (userWithToken.verification_status === 'in-review') {
          router.replace('/onBoardingScreen/UnderReview');
        } else {
          router.replace('/onBoardingScreen/OnBoardingStep');
        }
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Facebook Sign-In Failed',
        text2:
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          'Something went wrong',
      });
    },
  });
};
