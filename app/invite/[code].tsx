/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  WelcomePhoneStep,
  EnterOtpStep,
  ClaimMembershipStep,
  DigitalEntryQrStep,
} from '@/components/modules/gymClaim';
import {
  sendOfflineMemberOtp,
  verifyOfflineMemberOtp,
  claimMembershipApi,
  getQr,
} from '@/api/clientApi';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Decodes and sanitizes a phone parameter from deep link query params or path params.
 * Handles URL-encoded characters (like %2B for +), strips country code (+91/91/0),
 * and formats cleanly as "70182 35911" for the UI.
 */
function parseAndCleanPhone(raw?: string): { formatted: string; rawDigits: string } {
  if (!raw) return { formatted: '', rawDigits: '' };
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  // Extract all digit characters
  let digits = decoded.replace(/\D/g, '');

  // Strip Indian international prefix: 91 with 12 digits (e.g. 917018235911 -> 7018235911)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Strip domestic trunk prefix: 0 (e.g. 07018235911 -> 7018235911)
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    // Keep last 10 digits
    digits = digits.slice(-10);
  }

  let formatted = digits;
  if (digits.length === 10) {
    formatted = `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return { formatted, rawDigits: digits };
}

export default function InviteClaimScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const params = useLocalSearchParams<{
    code?: string;
    phone?: string;
    number?: string;
    mobile?: string;
    passNumber?: string;
    passId?: string;
    pass?: string;
    invite?: string;
    name?: string;
    gymName?: string;
  }>();

  // Active step in the invite flow: 1 (Phone) -> 2 (OTP) -> 3 (Claim) -> 4 (QR Pass)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Authenticated state from backend
  const [sentIdentifier, setSentIdentifier] = useState<string>('');
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [pendingClaim, setPendingClaim] = useState<any>(null);
  const [claimedPass, setClaimedPass] = useState<any>(null);

  // Extract phone & pass details from route param or query params
  const rawParamPhone = params.phone || params.number || params.mobile;
  const isCodePhone = Boolean(
    !rawParamPhone &&
      params.code &&
      /^(?:\+?91)?[6-9]\d{9}$/.test(params.code.trim().replace(/\D/g, ''))
  );

  const phoneSource = rawParamPhone || (isCodePhone ? params.code : undefined);
  const parsedPhone = parseAndCleanPhone(phoneSource);

  const [phone, setPhone] = useState(parsedPhone.formatted);
  const [isPrefilled, setIsPrefilled] = useState(Boolean(parsedPhone.formatted));

  const passNumber =
    params.passNumber ||
    params.passId ||
    params.pass ||
    params.invite ||
    (!isCodePhone && params.code ? params.code : undefined);

  useEffect(() => {
    if (parsedPhone.formatted) {
      setPhone(parsedPhone.formatted);
      setIsPrefilled(true);
    }
  }, [params.phone, params.number, params.mobile, params.code]);

  const handlePhoneChange = (val: string) => {
    let clean = val;
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 10 && digitsOnly.startsWith('91')) {
      const stripped = digitsOnly.slice(2);
      clean = stripped.length === 10 ? `${stripped.slice(0, 5)} ${stripped.slice(5)}` : stripped;
    }
    setPhone(clean);
    if (isPrefilled && digitsOnly !== parsedPhone.rawDigits) {
      setIsPrefilled(false);
    }
  };

  // OTP state
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

  // 1. Send OTP
  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit mobile number',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOfflineMemberOtp(digits);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: res.message || `OTP sent successfully to +91${digits}`,
      });
      setSentIdentifier(res.identifier || `+91${digits}`);
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(30);
      setCurrentStep(2);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send OTP. Please check your number and try again.';
      Toast.show({
        type: 'error',
        text1: 'Send OTP Failed',
        text2: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Resend OTP
  const handleResendOtp = async () => {
    const digits = phone.replace(/\D/g, '').slice(-10);
    setIsLoading(true);
    try {
      const res = await sendOfflineMemberOtp(digits);
      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: res.message || `OTP resent to +91${digits}`,
      });
      setResendTimer(30);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Failed to resend OTP. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete OTP',
        text2: 'Please enter the complete 6-digit verification code',
      });
      return;
    }

    const identifier = sentIdentifier || `+91${phone.replace(/\D/g, '').slice(-10)}`;
    setIsLoading(true);
    try {
      const res = await verifyOfflineMemberOtp(identifier, otp);

      // Authenticate session in AuthStore
      const userWithToken = {
        ...res.user,
        token: res.jwt,
        name: res.user?.fullName || res.user?.name,
      };
      await setUser(userWithToken, true);

      setVerifiedUser(res.user);
      setPendingClaim(res.pendingClaim);

      Toast.show({
        type: 'success',
        text1: 'Verified Successfully',
        text2: res.message || 'Welcome to Fitfob!',
      });

      if (res.pendingClaim) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Invalid verification code. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Claim Membership Pass
  const handleClaimMembership = async () => {
    const docId = pendingClaim?.documentId || pendingClaim?.id || params.code;
    if (!docId) {
      setCurrentStep(4);
      return;
    }

    setIsLoading(true);
    try {
      const res = await claimMembershipApi(docId);
      setClaimedPass(res);
      Toast.show({
        type: 'success',
        text1: 'Pass Claimed!',
        text2: res?.message || 'Your membership pass is now active.',
      });
      setCurrentStep(4);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to claim membership';
      Toast.show({
        type: 'error',
        text1: 'Claim Failed',
        text2: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real QR code from /api/client-details/me/qr once authenticated in step 4
  useEffect(() => {
    if (currentStep === 4 && !claimedPass?.qrCode) {
      getQr()
        .then((res: any) => {
          if (res?.data?.qrCode) {
            setClaimedPass((prev: any) => ({
              ...prev,
              qrCode: res.data.qrCode,
              clientId: res.data.clientId || prev?.clientId,
            }));
          }
        })
        .catch(() => {});
    }
  }, [currentStep]);

  // Resolved dynamic fields from backend response / route params
  const resolvedMemberName =
    verifiedUser?.fullName ||
    verifiedUser?.clientDetail?.name ||
    params.name ||
    '';

  const resolvedGymName =
    pendingClaim?.gymName ||
    params.gymName ||
    '';

  const resolvedPlanName =
    pendingClaim?.planName
      ? pendingClaim.planName.charAt(0).toUpperCase() + pendingClaim.planName.slice(1)
      : '';

  const resolvedMemberId =
    claimedPass?.clientId ||
    verifiedUser?.clientDetail?.clientId ||
    (passNumber ? `Pass #${passNumber}` : '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
      {/* ─── Screen 01: Welcome & Phone ─── */}
      {currentStep === 1 && (
        <WelcomePhoneStep
          phone={phone}
          onChangePhone={handlePhoneChange}
          passNumber={passNumber}
          inviteCode={params.code}
          isPrefilled={isPrefilled}
          isLoading={isLoading}
          onSendOtp={handleSendOtp}
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
          isLoading={isLoading}
          onResendOtp={handleResendOtp}
          onEditPhone={() => setCurrentStep(1)}
          onVerify={handleVerifyOtp}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {/* ─── Screen 03: Claim Membership ─── */}
      {currentStep === 3 && (
        <ClaimMembershipStep
          memberName={resolvedMemberName}
          passNumber={passNumber}
          gymName={resolvedGymName}
          planName={resolvedPlanName}
          startDate={pendingClaim?.startDate}
          endDate={pendingClaim?.endDate}
          isLoading={isLoading}
          onClaim={handleClaimMembership}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {/* ─── Screen 04: Digital Entry QR Pass ─── */}
      {currentStep === 4 && (
        <DigitalEntryQrStep
          memberName={resolvedMemberName}
          memberId={resolvedMemberId}
          passNumber={passNumber}
          gymName={resolvedGymName}
          planName={resolvedPlanName}
          endDate={pendingClaim?.endDate}
          qrCode={claimedPass?.qrCode || verifiedUser?.clientDetail?.qrCode}
          onBack={() => setCurrentStep(3)}
          onDone={() => router.replace('/(tabs)/scan' as any)}
        />
      )}
    </SafeAreaView>
  );
}
