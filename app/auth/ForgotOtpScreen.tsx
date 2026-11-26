/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/modules/Button';
import { Container } from '@/components/modules/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import Toast from 'react-native-toast-message';
import { useForgotResendOtp, useForgotVerifyOtp } from '@/hook/useAuth';

export default function ForgotOtpScreen() {
  const router = useRouter();
  const { email, identifier: paramIdentifier } = useLocalSearchParams();
  const rawIdentifier = ((paramIdentifier as string) || (email as string) || '').trim();
  const identifier = rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : rawIdentifier;

  const { mutate: resendOtp, isPending: isResending } = useForgotResendOtp();
  const { mutate: verifyOtp, isPending: isVerifying } = useForgotVerifyOtp();

  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) setTimer(timer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');

    // Support for Paste / Auto-fill
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

    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

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

  const handleVerify = () => {
    const otpString = otp.join('').trim();

    verifyOtp(
      {
        identifier: identifier,
        otp: otpString,
      },
      {
        onSuccess: (data) => {
          if (data?.resetToken) {
            router.push({
              pathname: '/auth/CreateNewPassword',
              params: {
                identifier: identifier,
                email: identifier,
                resetToken: data.resetToken,
              },
            });
          } else {
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
      }
    );
  };

  const handleResend = () => {
    if (!identifier) return;
    resendOtp(
      { identifier: identifier },
      {
        onSuccess: () => {
          setTimer(60);
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        },
      }
    );
  };

  return (
    <Container>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 ">
          <View className="mt-6">
            <Text
              className="font-bold text-[32px] leading-tight text-slate-900"
              style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Verification Code
            </Text>
            <Text
              className="mt-3 text-base leading-6 text-slate-400"
              style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              We sent a verification code to{' '}
              <Text className="font-semibold text-[#F6163C]">{identifier || 'your account'}</Text>
              {'\n'}
              Enter the 6-digit code to reset your password
            </Text>
          </View>

          <View className="mb-4 mt-6 flex-row justify-between">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className={`h-14 w-[14%] rounded-[10px] border bg-white text-center font-bold text-xl text-slate-900 ${
                  focusedIndex === index || digit ? 'border-[#F6163C]' : 'border-slate-200'
                }`}
                onFocus={() => setFocusedIndex(index)}
                keyboardType="number-pad"
                maxLength={6}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
                editable={!isResending && !isVerifying}
              />
            ))}
          </View>

          <View className="mb-2">
            <Button
              title={isVerifying ? 'Verifying...' : 'Verify Code'}
              onPress={handleVerify}
              disabled={!isOtpComplete || isResending || isVerifying}
            />
          </View>

          <View className="flex-row items-center justify-center">
            <Text className="text-sm text-slate-400">Haven't got the email yet? </Text>
            <TouchableOpacity disabled={timer > 0 || isResending} onPress={handleResend}>
              {isResending ? (
                <ActivityIndicator size="small" color="#F6163C" className="ml-2" />
              ) : (
                <Text
                  className={`font-bold text-sm ${timer > 0 ? 'text-slate-300' : 'text-[#F6163C]'}`}>
                  Resend email {timer > 0 && `(00:${timer < 10 ? `0${timer}` : timer})`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
