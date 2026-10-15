import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/modules/Button';
import { Container } from '@/components/modules/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';

import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';
import { useResendOtp, useVerifyOtp } from '@/hook/useAuth';

export default function SignUpOtpScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const { email, signupToken } = useLocalSearchParams();
  const { mutate: verifyMutation, isPending } = useVerifyOtp();
  const { mutate: resendMutation, isPending: isResending } = useResendOtp();

  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) setTimer(timer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');

    if (cleanText.length > 1) {
      const pastedOtp = cleanText.split('').slice(0, 6);
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + pastedOtp.length - 1, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    // Normal typing: Only keep the last character entered in this box
    const newOtp = [...otp];
    newOtp[index] = cleanText.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (cleanText.length !== 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  // --- Extraction logic ---
  // Using direct access from params for maximum reliability
  const rawEmail = Array.isArray(email) ? email[0] : email;
  const rawToken = Array.isArray(signupToken) ? signupToken[0] : signupToken;

  const decodedEmail = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : '';

  const decodedToken = typeof rawToken === 'string' ? rawToken.trim() : '';

  // --- Verify Logic ---
  const handleVerify = () => {
    // Join digits strictly
    const otpString = otp.join('').trim();

    if (otpString.length < 6) {
      Toast.show({ type: 'error', text1: 'Incomplete OTP', text2: 'Please enter all 6 digits.' });
      return;
    }

    if (!decodedEmail || !decodedToken) {
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Required parameters missing. Please signup again.',
      });
      return;
    }

    const finalPayload = {
      identifier: decodedEmail,
      otp: otpString,
      signupToken: decodedToken,
    };

    console.log('📡 [OtpScreen] SENDING TO API:', JSON.stringify(finalPayload, null, 2));

    verifyMutation(finalPayload, {
      onSuccess: async (data) => {
        console.log(data, 'Vergiy otp');

        if (data && data.jwt && data.user) {
          console.log('✅ OTP Verified. Finalizing User Session...');

          const userWithToken = {
            ...data.user,
            token: data.jwt,
            verification_status: data.user.verification_status || 'pending',
          };

          await setUser(userWithToken, true);

          Toast.show({
            type: 'success',
            text1: 'Verification Success ✅',
            text2: 'Welcome to the app!',
          });
          router.replace('/onBoardingScreen/OnBoardingStep');
          console.log('🚀 User Data Saved. Redirecting to Onboarding...');
        } else {
          console.warn('⚠️ API Success but missing fields in response:', data);
          router.replace('/auth/Login');
        }
      },
      onError: (error: any) => {
        const errorData = error.response?.data;
        const msg = errorData?.error?.message || errorData?.message || 'Verification Failed';

        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: msg,
        });
      },
    });
  };

  const handleResend = () => {
    if (!decodedEmail || !decodedToken) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Session expired. Please start again.',
      });
      return;
    }

    const resendPayload = {
      identifier: decodedEmail,
      signupToken: decodedToken,
    };

    console.log('📡 [OtpScreen] Resending OTP Payload:', resendPayload);

    resendMutation(resendPayload, {
      onSuccess: () => {
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      },
    });
  };

  return (
    <Container>
      {/* Loading Overlay */}
      {(isPending || isResending) && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <View className="items-center justify-center rounded-3xl border border-slate-50 bg-white p-8 shadow-xl">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-4 font-bold text-lg text-slate-900">
              {isResending ? 'Sending OTP...' : 'Verifying...'}
            </Text>
          </View>
        </View>
      )}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 ">
          {/* Header */}
          <View className="mt-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center">
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="font-bold text-lg text-slate-900">OTP Verification</Text>
            <View className="w-10" />
          </View>

          {/* Subtitle */}
          <View className="mt-12 items-center">
            <Text className="px-4 text-center text-base leading-6 text-slate-400">
              Please enter the code we just sent to{'\n'}
              <Text className="font-bold text-slate-900">{decodedEmail || 'your email'}</Text> to
              proceed
            </Text>
          </View>

          {/* OTP Inputs */}
          <View className="mt-10 flex-row justify-between px-2">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className={`h-14 w-12 rounded-lg border text-center font-bold text-xl text-slate-900 ${
                  digit ? 'border-[#F6163C]' : 'border-slate-200'
                }`}
                keyboardType="number-pad"
                maxLength={6}
                value={digit ? digit.slice(-1) : ''}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
                editable={!isPending && !isResending}
              />
            ))}
          </View>

          {/* Resend Section */}
          <View className="mt-10 flex-row items-center justify-center">
            <Text className="text-sm text-slate-400">Didn&lsquo;t receive OTP? </Text>
            <TouchableOpacity disabled={timer > 0 || isResending} onPress={handleResend}>
              <Text
                className={`font-bold text-sm ${timer > 0 || isResending ? 'text-slate-300' : 'text-[#F6163C]'}`}>
                {isResending
                  ? 'Sending...'
                  : `Resend OTP ${timer > 0 ? `in (00:${timer < 10 ? `0${timer}` : timer})` : ''}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          <View className="mb-4 mt-auto pt-10">
            <Button
              title={isPending ? 'Verifying...' : 'Continue'}
              onPress={handleVerify}
              disabled={!isOtpComplete || isPending || isResending}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
