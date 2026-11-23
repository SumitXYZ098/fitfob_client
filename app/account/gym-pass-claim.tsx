import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  WelcomePhoneStep,
  EnterOtpStep,
  ClaimMembershipStep,
  DigitalEntryQrStep,
} from '@/components/modules/gymClaim';

export default function GymPassClaimScreen() {
  const router = useRouter();

  // Active step in the invite flow: 1 (Phone) -> 2 (OTP) -> 3 (Claim) -> 4 (QR Pass)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Phone number state
  const [phone, setPhone] = useState('98765 43210');

  // OTP state starts completely empty (no dummy digits pre-filled)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(24);

  // OTP resend timer countdown
  useEffect(() => {
    if (currentStep === 2 && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, resendTimer]);

  const handleOtpChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean ? clean[clean.length - 1] : '';
    setOtpDigits(newDigits);
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const newDigits = [...otpDigits];
      newDigits[index - 1] = '';
      setOtpDigits(newDigits);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
      {/* ─── Screen 01: Welcome & Phone ─── */}
      {currentStep === 1 && (
        <WelcomePhoneStep
          phone={phone}
          onChangePhone={setPhone}
          onSendOtp={() => {
            setOtpDigits(['', '', '', '', '', '']);
            setResendTimer(24);
            setCurrentStep(2);
          }}
          onBack={() => router.back()}
        />
      )}

      {/* ─── Screen 02: Enter OTP ─── */}
      {currentStep === 2 && (
        <EnterOtpStep
          phone={phone}
          otpDigits={otpDigits}
          onChangeOtp={handleOtpChange}
          onOtpKeyPress={handleOtpKeyPress}
          resendTimer={resendTimer}
          onResendOtp={() => setResendTimer(30)}
          onEditPhone={() => setCurrentStep(1)}
          onVerify={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {/* ─── Screen 03: Claim Membership ─── */}
      {currentStep === 3 && (
        <ClaimMembershipStep
          onClaim={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {/* ─── Screen 04: Digital Entry QR Pass ─── */}
      {currentStep === 4 && (
        <DigitalEntryQrStep
          onBack={() => setCurrentStep(3)}
        />
      )}
    </SafeAreaView>
  );
}
