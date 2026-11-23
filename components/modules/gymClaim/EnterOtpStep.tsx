import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnterOtpStepProps {
  phone: string;
  otpDigits: string[];
  onChangeOtp: (text: string, index: number) => void;
  onOtpKeyPress: (e: any, index: number) => void;
  resendTimer: number;
  onResendOtp: () => void;
  onEditPhone: () => void;
  onVerify: () => void;
  onBack: () => void;
}

export default function EnterOtpStep({
  phone,
  otpDigits,
  onChangeOtp,
  onOtpKeyPress,
  resendTimer,
  onResendOtp,
  onEditPhone,
  onVerify,
  onBack,
}: EnterOtpStepProps) {
  const otpInputs = useRef<any[]>([]);

  // Auto-focus the first OTP input box on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      otpInputs.current[0]?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Find the first unfilled index to highlight as focused cursor
  const firstEmptyIndex = otpDigits.findIndex((d) => !d);
  const activeFocusIndex = firstEmptyIndex === -1 ? 5 : firstEmptyIndex;

  const handleTextChange = (val: string, index: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length > 1) {
      // Handle multi-character paste / autofill
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((d, i) => onChangeOtp(d, i));
      const nextFocus = Math.min(pasted.length, 5);
      otpInputs.current[nextFocus]?.focus();
      return;
    }
    onChangeOtp(clean, index);
    if (clean && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    onOtpKeyPress(e, index);
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}>
            {/* Header: Back & Verify Phone */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={{
                  position: 'absolute',
                  left: 0,
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#F8FAFC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="chevron-back" size={22} color="#0F172A" />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                Verify Phone
              </Text>
            </View>

            {/* Title & Subtitle */}
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: '#0F172A',
                letterSpacing: -0.4,
                marginTop: 28,
              }}>
              Enter the 6–digit code
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}>
                Sent via SMS to +91 {phone}{' '}
              </Text>
              <TouchableOpacity onPress={onEditPhone} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#E23744' }}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            {/* 6 Square OTP Boxes */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 28,
                gap: 8,
              }}>
              {otpDigits.map((digit, index) => {
                const isCursorBox = index === activeFocusIndex && !digit;
                const isFilled = Boolean(digit);
                return (
                  <View
                    key={index}
                    style={{
                      flex: 1,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      borderWidth: isCursorBox ? 1.5 : 1,
                      borderColor: isCursorBox ? '#E23744' : isFilled ? '#CBD5E1' : '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: isCursorBox ? '#E23744' : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isCursorBox ? 0.1 : 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}>
                    <TextInput
                      ref={(el) => {
                        otpInputs.current[index] = el;
                      }}
                      value={digit}
                      onChangeText={(val) => handleTextChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      style={{
                        width: '100%',
                        height: '100%',
                        fontSize: 22,
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    />
                    {isCursorBox && (
                      <View
                        style={{
                          position: 'absolute',
                          width: 2,
                          height: 24,
                          backgroundColor: '#E23744',
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Resend in countdown */}
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 18 }}>
              Didn't get the code?{' '}
              {resendTimer > 0 ? (
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                  Resend in 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                </Text>
              ) : (
                <Text
                  onPress={onResendOtp}
                  style={{ fontWeight: '800', color: '#E23744' }}>
                  Resend now
                </Text>
              )}
            </Text>
          </ScrollView>

          {/* Bottom Action CTA: Automatically sits above the keyboard */}
          <View style={{ paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 12 }}>
            <TouchableOpacity
              onPress={onVerify}
              activeOpacity={0.88}
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: '#E23744',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#E23744',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                Verify & Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
