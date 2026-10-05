import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import {
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  View,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import {
  useClientBasicDetails,
  useClientResendOtp,
  useClientVerifyOtp,
} from '@/hook/useClient';
import { Button } from '@/components/modules/Button';
import Toast from 'react-native-toast-message';

const getMaxPhoneLength = (code: string): number => {
  const lengths: Record<string, number> = {
    IN: 10, // India
    US: 10, // USA
    CA: 10, // Canada
    GB: 10, // UK
    AU: 9, // Australia
    NZ: 9, // New Zealand
    SG: 8, // Singapore
    AE: 9, // UAE
    DE: 11, // Germany
    FR: 9, // France
    PK: 10, // Pakistan
    BD: 10, // Bangladesh
    NP: 10, // Nepal
    LK: 9, // Sri Lanka
  };
  return lengths[code] || 15; // Default E.164 max length
};

export interface BasicDetailsRef {
  submit: () => Promise<boolean>;
}

interface BasicDetailsProps {
  prefill?: any;
  onVerificationChange?: (isVerified: boolean) => void;
  onSaveData?: (data: any) => void;
}

const BasicDetails = forwardRef<BasicDetailsRef, BasicDetailsProps>(
  ({ prefill, onVerificationChange, onSaveData }, ref) => {
    const { user, setUser } = useAuthStore();
    const { mutateAsync } = useClientBasicDetails();
    const resendOtpMutation = useClientResendOtp();
    const verifyOtpMutation = useClientVerifyOtp();

    const parsePhone = (fullPhone: string) => {
      if (!fullPhone || !fullPhone.startsWith('+')) {
        return { callingCode: '91', countryCode: 'IN' as CountryCode, number: fullPhone || '' };
      }
      const countryCallingMap: { prefix: string; cca2: CountryCode }[] = [
        { prefix: '91', cca2: 'IN' },
        { prefix: '1', cca2: 'US' },
        { prefix: '44', cca2: 'GB' },
        { prefix: '61', cca2: 'AU' },
        { prefix: '64', cca2: 'NZ' },
        { prefix: '65', cca2: 'SG' },
        { prefix: '971', cca2: 'AE' },
        { prefix: '49', cca2: 'DE' },
        { prefix: '33', cca2: 'FR' },
        { prefix: '92', cca2: 'PK' },
        { prefix: '880', cca2: 'BD' },
        { prefix: '977', cca2: 'NP' },
        { prefix: '94', cca2: 'LK' },
      ];
      const raw = fullPhone.slice(1);
      for (const item of countryCallingMap) {
        if (raw.startsWith(item.prefix)) {
          return {
            callingCode: item.prefix,
            countryCode: item.cca2,
            number: raw.slice(item.prefix.length),
          };
        }
      }
      return { callingCode: '91', countryCode: 'IN' as CountryCode, number: raw };
    };

    const isRealEmail = (em?: string | null): boolean => {
      if (!em) return false;
      const clean = em.trim().toLowerCase();
      return (
        clean.includes('@') &&
        !clean.endsWith('@phone.user') &&
        !clean.includes('phone.user') &&
        !clean.startsWith('+')
      );
    };

    // User signed up with real Gmail / Email if user.email is a genuine email address
    const isEmailSignUp = isRealEmail(user?.email);
    const isPhoneSignUp = !isEmailSignUp;

    // Extract signup phone number if phone signup
    const signupPhoneRaw = isPhoneSignUp
      ? user?.phoneNumber ||
        (user?.email && user.email.includes('@phone.user') ? user.email.split('@')[0] : null) ||
        (user?.username && /^\+?[0-9]{10,15}$/.test(user.username) ? user.username : null) ||
        ''
      : '';

    const signupPhone = signupPhoneRaw ? parsePhone(signupPhoneRaw) : null;
    const initialPhone = prefill?.phoneNumber ? parsePhone(prefill.phoneNumber) : signupPhone;

    const [name, setName] = useState(prefill?.name || '');
    const [email, setEmail] = useState(
      isRealEmail(prefill?.email)
        ? prefill.email
        : isEmailSignUp
          ? user?.email || ''
          : ''
    );
    const [selectedGender, setSelectedGender] = useState(prefill?.gender || 'male');
    const [countryCode, setCountryCode] = useState<CountryCode>(initialPhone?.countryCode || 'IN');
    const [callingCode, setCallingCode] = useState(initialPhone?.callingCode || '91');
    const [phoneNumber, setPhoneNumber] = useState(initialPhone?.number || '');

    // Verification states:
    // If Gmail/Email signup -> Email is ALREADY verified! Only phone needs OTP verification.
    // If Phone signup -> Phone is ALREADY verified! Only email needs OTP verification.
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(
      isEmailSignUp || (isRealEmail(prefill?.email) && Boolean(prefill?.isEmailVerified))
    );
    const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(
      isPhoneSignUp || Boolean(prefill?.isPhoneVerified) || Boolean(prefill?.phoneNumber)
    );

    // BottomSheet Modal states
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [verifyingType, setVerifyingType] = useState<'phone' | 'email'>('phone');
    const [isSendingOtp, setIsSendingOtp] = useState<'phone' | 'email' | null>(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const otpInputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
      if (prefill) {
        if (prefill.name && !name) {
          setName(prefill.name);
        }
        if (isRealEmail(prefill.email) && !email) {
          setEmail(prefill.email);
        }
        if (prefill.gender && !selectedGender) {
          setSelectedGender(prefill.gender);
        }
        if (prefill.phoneNumber && !phoneNumber) {
          const parsed = parsePhone(prefill.phoneNumber);
          setCountryCode(parsed.countryCode);
          setCallingCode(parsed.callingCode);
          setPhoneNumber(parsed.number);
          setIsPhoneVerified(true);
        }
        if (prefill.isPhoneVerified) {
          setIsPhoneVerified(true);
        }
        if (isRealEmail(prefill.email) && prefill.isEmailVerified) {
          setIsEmailVerified(true);
        }
      }
    }, [prefill]);

    useEffect(() => {
      if (isEmailSignUp) {
        const latestEmail = isRealEmail(prefill?.email) ? prefill?.email : user?.email;
        if (latestEmail && !email) {
          setEmail(latestEmail);
        }
      }
    }, [prefill?.email, user?.email, email, isEmailSignUp]);

    // Track overall verification to enable/disable "Next" button
    const isFullyVerified = isEmailSignUp ? isPhoneVerified : isEmailVerified;

    useEffect(() => {
      onVerificationChange?.(isFullyVerified);
    }, [isFullyVerified, onVerificationChange]);

    // Timer effect for OTP bottom sheet
    useEffect(() => {
      let interval: any;
      if (isOtpModalOpen && timer > 0) {
        interval = setInterval(() => {
          setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
      }
      return () => clearInterval(interval);
    }, [isOtpModalOpen, timer]);

    const requiredPhoneLength = getMaxPhoneLength(countryCode);
    const cleanPhoneDigits = phoneNumber.replace(/\D/g, '');
    const isPhoneLengthValid =
      requiredPhoneLength === 15
        ? cleanPhoneDigits.length >= 8 && cleanPhoneDigits.length <= 15
        : cleanPhoneDigits.length === requiredPhoneLength;

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    // Send OTP handler
    const handleSendOtp = async (type: 'phone' | 'email') => {
      if (isSendingOtp || resendOtpMutation.isPending) return;

      if (type === 'phone') {
        if (!cleanPhoneDigits) {
          Alert.alert('Phone Required', 'Please enter your phone number.');
          return;
        }
        if (!isPhoneLengthValid) {
          Alert.alert(
            'Invalid Phone Number',
            `Phone number must be exactly ${requiredPhoneLength} digits for ${countryCode}.`
          );
          return;
        }

        setIsSendingOtp('phone');
        setVerifyingType('phone');
        const fullPhone = `+${callingCode}${cleanPhoneDigits}`;
        try {
          // If name is filled, update basic details first so backend has user's phone number stored
          if (name.trim()) {
            try {
              console.log('📡 Updating basic details before sending phone OTP...');
              await mutateAsync({
                name: name.trim(),
                email: email.trim(),
                phoneNumber: fullPhone,
                gender: selectedGender,
              });
            } catch (saveErr) {
              console.log('Note: basic details save returned:', saveErr);
            }
          }

          await resendOtpMutation.mutateAsync({
            identifier: fullPhone,
            phoneNumber: fullPhone,
          });
          setOtp(['', '', '', '', '', '']);
          setTimer(60);
          setIsOtpModalOpen(true);
        } catch (error: any) {
          console.error('Error sending OTP to phone:', error);
          const errorMsg =
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            'Failed to send OTP to phone. Please check your number.';
          // If 30-second cooldown is active, the OTP was already sent and is active (valid for 2 mins)
          if (
            errorMsg.toLowerCase().includes('wait') ||
            errorMsg.toLowerCase().includes('30 seconds')
          ) {
            setOtp(['', '', '', '', '', '']);
            setTimer(60);
            setIsOtpModalOpen(true);
            return;
          }
          Alert.alert('Send OTP Failed', errorMsg);
        } finally {
          setIsSendingOtp(null);
        }
      } else {
        if (!email.trim() || !isEmailValid) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          return;
        }

        setIsSendingOtp('email');
        setVerifyingType('email');
        try {
          const cleanEmail = email.trim().toLowerCase();
          await resendOtpMutation.mutateAsync({
            identifier: cleanEmail,
            email: cleanEmail,
          });
          setOtp(['', '', '', '', '', '']);
          setTimer(60);
          setIsOtpModalOpen(true);
        } catch (error: any) {
          console.error('Error sending OTP to email:', error);
          const errorMsg =
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            'Failed to send OTP to email.';
          if (
            errorMsg.toLowerCase().includes('wait') ||
            errorMsg.toLowerCase().includes('30 seconds')
          ) {
            setOtp(['', '', '', '', '', '']);
            setTimer(60);
            setIsOtpModalOpen(true);
            return;
          }
          Alert.alert('Send OTP Failed', errorMsg);
        } finally {
          setIsSendingOtp(null);
        }
      }
    };

    // OTP Input handlers
    const handleOtpChange = (text: string, index: number) => {
      const cleanText = text.replace(/[^0-9]/g, '');

      if (cleanText.length > 1) {
        const pastedOtp = cleanText.split('').slice(0, 6);
        const newOtp = [...otp];
        pastedOtp.forEach((char, i) => {
          if (index + i < 6) newOtp[index + i] = char;
        });
        setOtp(newOtp);
        const nextFocus = Math.min(index + pastedOtp.length - 1, 5);
        otpInputRefs.current[nextFocus]?.focus();
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = cleanText.slice(-1);
      setOtp(newOtp);

      if (cleanText.length !== 0 && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    };

    const handleOtpKeyPress = (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    };

    const isOtpComplete = otp.every((digit) => digit !== '');

    // Verify OTP Handler
    const handleVerifyOtp = async () => {
      const otpCode = otp.join('').trim();
      if (otpCode.length < 6) {
        Toast.show({
          type: 'error',
          text1: 'Incomplete OTP',
          text2: 'Please enter all 6 digits of the code.',
        });
        return;
      }

      try {
        const fullPhone = `+${callingCode}${cleanPhoneDigits}`;
        const targetId = verifyingType === 'phone' ? fullPhone : email.trim().toLowerCase();
        await verifyOtpMutation.mutateAsync({ otp: otpCode, identifier: targetId });
        if (verifyingType === 'phone') {
          setIsPhoneVerified(true);
          onSaveData?.({
            name,
            email,
            phoneNumber: fullPhone,
            gender: selectedGender,
            isPhoneVerified: true,
          });
        } else {
          setIsEmailVerified(true);
          onSaveData?.({
            name,
            email: email.trim().toLowerCase(),
            phoneNumber: fullPhone,
            gender: selectedGender,
            isEmailVerified: true,
          });
        }
        setIsOtpModalOpen(false);
        Toast.show({
          type: 'success',
          text1: 'Verified Successfully! 🎉',
          text2: `${verifyingType === 'phone' ? 'Phone number' : 'Email'} has been verified.`,
        });
      } catch (error) {
        console.error('Error verifying OTP:', error);
      }
    };

    // Resend OTP from Modal
    const handleResendFromModal = async () => {
      if (timer > 0 || resendOtpMutation.isPending) return;
      const fullPhone = `+${callingCode}${cleanPhoneDigits}`;
      try {
        await resendOtpMutation.mutateAsync(
          verifyingType === 'phone'
            ? { identifier: fullPhone, phoneNumber: fullPhone }
            : { identifier: email.trim().toLowerCase(), email: email.trim().toLowerCase() }
        );
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
      } catch (error) {
        console.error('Error resending OTP from modal:', error);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!name.trim()) {
          Alert.alert('Validation Error', 'Please enter your name.');
          return false;
        }
        if (!email.trim() || !isEmailValid) {
          Alert.alert('Validation Error', 'Please enter a valid email address.');
          return false;
        }
        if (!phoneNumber.trim()) {
          Alert.alert('Validation Error', 'Please enter your phone number.');
          return false;
        }
        if (!isPhoneLengthValid) {
          Alert.alert(
            'Validation Error',
            `Phone number must be exactly ${requiredPhoneLength} digits for ${countryCode}.`
          );
          return false;
        }
        if (!isEmailVerified) {
          Alert.alert('Verification Required', 'Please verify your email address before proceeding.');
          return false;
        }
        if (!isPhoneVerified) {
          Alert.alert(
            'Verification Required',
            'Please verify your phone number with OTP before proceeding.'
          );
          return false;
        }
        try {
          const fullPhone = `+${callingCode}${cleanPhoneDigits}`;
          await mutateAsync({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: fullPhone,
            gender: selectedGender,
          });

          if (user) {
            await setUser(
              {
                ...user,
                name: name.trim(),
                clientDetail: {
                  ...(user.clientDetail || {}),
                  name: name.trim(),
                  phoneNumber: fullPhone,
                  email: email.trim().toLowerCase(),
                  gender: selectedGender,
                },
              },
              true
            );
          }

          onSaveData?.({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: fullPhone,
            gender: selectedGender,
            isPhoneVerified: true,
            isEmailVerified: true,
          });
          return true;
        } catch (error) {
          console.error('Error submitting basic details:', error);
          return false;
        }
      },
    }));

    const genders = [
      {
        id: 'male',
        label: 'Male',
        icon: 'male-outline',
        image: require('../../../assets/images/male.png'),
      },
      {
        id: 'female',
        label: 'Female',
        icon: 'female-outline',
        image: require('../../../assets/images/female.png'),
      },
      { id: 'other', label: 'Other', icon: 'male-female-outline' },
    ];

    const isEmailSending =
      isSendingOtp === 'email' || (resendOtpMutation.isPending && verifyingType === 'email');
    const isPhoneSending =
      isSendingOtp === 'phone' || (resendOtpMutation.isPending && verifyingType === 'phone');

    return (
      <View className="flex-1 bg-white">
        <Text className="font-bold text-3xl leading-tight text-slate-900">What’s your name?</Text>
        <Text className="font-bold text-3xl text-slate-900">Let’s get started.</Text>

        {/* Name Input */}
        <View className="mt-4">
          <Text className="mb-1 font-medium text-slate-400">Name</Text>
          <TextInput
            placeholder="Enter Name"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            className="h-16 rounded-2xl border border-slate-200 bg-white px-5 text-slate-900"
          />
        </View>

        {/* Email Input */}
        <View className="mt-4">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="font-medium text-slate-400">Email</Text>
            {isEmailVerified ? (
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="font-semibold text-xs text-emerald-600">Verified</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <Ionicons name="alert-circle-outline" size={13} color="#F97316" />
                <Text className="font-medium text-xs text-orange-500">Unverified</Text>
              </View>
            )}
          </View>
          <View
            className={`h-16 flex-row items-center justify-between rounded-2xl border px-5 ${
              isEmailVerified
                ? 'border-slate-200 bg-slate-100/80'
                : 'border-slate-200 bg-white focus:border-[#F6163C]'
            }`}>
            <TextInput
              placeholder="Enter Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              editable={!isEmailVerified}
              keyboardType="email-address"
              autoCapitalize="none"
              selectTextOnFocus={!isEmailVerified}
              className={`flex-1 font-medium ${isEmailVerified ? 'text-slate-600' : 'text-slate-900'}`}
            />
            {isEmailVerified ? (
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
            ) : (
              <TouchableOpacity
                onPress={() => handleSendOtp('email')}
                disabled={!isEmailValid || isEmailSending || isPhoneSending}
                activeOpacity={0.8}
                className={`ml-2 rounded-xl px-3 py-2 ${
                  isEmailSending || (isEmailValid && !isPhoneSending)
                    ? 'bg-[#F6163C]'
                    : 'bg-slate-100'
                }`}>
                {isEmailSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    className={`font-bold text-xs ${
                      isEmailValid && !isPhoneSending ? 'text-white' : 'text-slate-400'
                    }`}>
                    Send OTP
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Phone Number Field with Country Picker & Send OTP / Verified Button */}
        <View className="mt-4">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="font-medium text-slate-400">Phone Number</Text>
            {isPhoneVerified ? (
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="font-semibold text-xs text-emerald-600">Verified</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <Ionicons name="alert-circle-outline" size={13} color="#F97316" />
                <Text className="font-medium text-xs text-orange-500">Unverified</Text>
              </View>
            )}
          </View>
          <View
            className={`h-16 flex-row items-center rounded-2xl border px-4 ${
              isPhoneVerified ? 'border-slate-200 bg-slate-100/80' : 'border-slate-200 bg-white'
            }`}>
            {/* Country Selector with Flag and Arrow */}
            <View
              pointerEvents={isPhoneVerified ? 'none' : 'auto'}
              className="flex-row items-center">
              <CountryPicker
                countryCode={countryCode}
                withFilter
                withFlag
                withCallingCode
                withAlphaFilter
                onSelect={(country: Country) => {
                  setCountryCode(country.cca2);
                  setCallingCode(country.callingCode[0]);
                  setPhoneNumber('');
                }}
              />
              <Ionicons
                name="chevron-down"
                size={16}
                color={isPhoneVerified ? '#94a3b8' : '#475569'}
                className="ml-1"
              />
            </View>

            {/* Calling Code Text */}
            <Text className="ml-2 font-medium text-slate-900">+{callingCode}</Text>

            {/* Vertical Separator */}
            <View className="mx-3 h-6 w-[1px] bg-slate-200" />

            {/* Phone Number Input */}
            <TextInput
              placeholder="Enter phone number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phoneNumber}
              editable={!isPhoneVerified}
              onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
              maxLength={requiredPhoneLength}
              className={`h-full flex-1 ${isPhoneVerified ? 'text-slate-600' : 'text-slate-900'}`}
            />

            {/* Send OTP button or Lock icon */}
            {isPhoneVerified ? (
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
            ) : (
              <TouchableOpacity
                onPress={() => handleSendOtp('phone')}
                disabled={!isPhoneLengthValid || isPhoneSending || isEmailSending}
                activeOpacity={0.8}
                className={`ml-2 rounded-xl px-3 py-2 ${
                  isPhoneSending || (isPhoneLengthValid && !isEmailSending)
                    ? 'bg-[#F6163C]'
                    : 'bg-slate-100'
                }`}>
                {isPhoneSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    className={`font-bold text-xs ${
                      isPhoneLengthValid && !isEmailSending ? 'text-white' : 'text-slate-400'
                    }`}>
                    Send OTP
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Gender Selection */}
        <View className="mt-8">
          <Text className="mb-4 font-medium text-slate-400">Gender (optional)</Text>
          <View className="flex-row justify-between">
            {genders.map((item) => {
              const isSelected = selectedGender === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedGender(item.id)}
                  activeOpacity={0.8}
                  className="items-center">
                  <View
                    className={`h-20 w-20 items-center justify-center rounded-full border-2 bg-white ${
                      isSelected ? 'border-[#F6163C]' : 'border-slate-100'
                    }`}
                    style={{
                      elevation: 4,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}>
                    {isSelected && item.image ? (
                      <Image
                        source={item.image}
                        className="h-full w-full rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name={item.icon as any}
                        size={32}
                        color={isSelected ? '#F6163C' : '#CBD5E1'}
                      />
                    )}
                  </View>
                  <Text
                    className={`mt-2 font-medium ${
                      isSelected ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* --- OTP BottomSheet Modal --- */}
        <Modal
          visible={isOtpModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsOtpModalOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-end bg-black/60">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsOtpModalOpen(false)}
              className="flex-1"
            />
            <View className="rounded-t-[32px] bg-white p-6 shadow-2xl">
              {/* Drag Handle Indicator */}
              <View className="mb-4 items-center">
                <View className="h-1.5 w-12 rounded-full bg-slate-200" />
              </View>

              {/* Header */}
              <View className="mb-4 flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="font-bold text-2xl text-slate-900">
                    Verify {verifyingType === 'phone' ? 'Phone Number' : 'Email Address'}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    Enter the 6-digit code sent to{' '}
                    <Text className="font-semibold text-slate-800">
                      {verifyingType === 'phone' ? `+${callingCode} ${phoneNumber}` : email}
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsOtpModalOpen(false)}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
                  activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* 6 OTP Input Boxes */}
              <View className="my-5 flex-row justify-between">
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, idx)}
                    onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    keyboardType="number-pad"
                    maxLength={idx === 0 ? 6 : 1}
                    className={`h-14 w-12 rounded-2xl border text-center font-bold text-xl ${
                      digit
                        ? 'border-[#F6163C] bg-red-50/20 text-slate-900'
                        : 'border-slate-200 bg-slate-50 text-slate-900'
                    }`}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Resend OTP & Timer */}
              <View className="mb-6 flex-row items-center justify-center">
                <Text className="text-sm text-slate-500">Didn't receive the code? </Text>
                {timer > 0 ? (
                  <Text className="font-semibold text-sm text-slate-400">
                    Resend in {timer}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendFromModal}
                    disabled={resendOtpMutation.isPending}
                    activeOpacity={0.7}>
                    {resendOtpMutation.isPending ? (
                      <ActivityIndicator size="small" color="#F6163C" />
                    ) : (
                      <Text className="font-bold text-sm text-[#F6163C]">Resend OTP</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify OTP Button */}
              <View className="mb-2">
                <Button
                  title="Verify OTP"
                  onPress={handleVerifyOtp}
                  loading={verifyOtpMutation.isPending}
                  disabled={!isOtpComplete || verifyOtpMutation.isPending}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }
);

BasicDetails.displayName = 'BasicDetails';

export default BasicDetails;
