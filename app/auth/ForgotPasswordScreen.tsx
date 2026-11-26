import React from 'react';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/modules/Button';
import { Container } from '@/components/modules/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { useForgotSendOtp } from '@/hook/useAuth';

const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or Phone is required')
    .refine((val) => {
      const clean = val.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
      const isPhone = /^\+?[0-9]{8,15}$/.test(clean.replace(/[\s-]/g, ''));
      return isEmail || isPhone;
    }, 'Please enter a valid email or phone number'),
});

type ForgotFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // --- ADDED: Mutation Hook ---
  const { mutate: sendOtp, isPending } = useForgotSendOtp();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = (data: ForgotFormData) => {
    const clean = data.identifier.trim();
    const formattedIdentifier = clean.includes('@')
      ? clean.toLowerCase()
      : clean.startsWith('+')
      ? clean
      : clean.replace(/\D/g, '').length === 10
      ? `+91${clean.replace(/\D/g, '')}`
      : clean;

    sendOtp(
      { identifier: formattedIdentifier },
      {
        onSuccess: () => {
          router.push({
            pathname: '/auth/ForgotOtpScreen',
            params: {
              identifier: formattedIdentifier,
              email: formattedIdentifier,
            },
          });
        },
      }
    );
  };

  return (
    <Container>
      {/* --- LOADING OVERLAY --- */}
      {isPending && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
          <ActivityIndicator size="large" color="#F6163C" />
        </View>
      )}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 ">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/auth/Login');
              }
            }}
            className="mt-2 h-10 w-10 items-center justify-center rounded-full"
            activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
          </TouchableOpacity>

          {/* Title Section */}
          <View className="mt-4">
            <Text
              className="font-bold text-4xl text-slate-900"
              style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Forgot Password
            </Text>
            <Text
              className="mt-3 text-base text-slate-400"
              style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              Please enter your email or phone number to reset your password
            </Text>
          </View>

          {/* Input Section */}
          <View className="mt-10">
            <Text className="mb-2 ml-1 font-medium text-sm text-slate-400">
              Email Address or Phone Number
            </Text>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 justify-center rounded-2xl border ${
                    errors.identifier ? 'border-red-500' : 'border-slate-200'
                  } bg-white px-4`}>
                  <TextInput
                    placeholder="Enter email or phone number"
                    placeholderTextColor="#CBD5E1"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className="h-full text-base text-slate-900"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isPending}
                  />
                </View>
              )}
            />
            {errors.identifier && (
              <Text className="ml-1 mt-1 text-xs text-red-500">
                {errors.identifier.message}
              </Text>
            )}
          </View>

          {/* Spacer - pushes button to bottom */}
          <View className="flex-1" />

          {/* Action Button */}
          <View className="mb-6">
            <Button
              title={isPending ? 'Sending...' : 'Reset Password'}
              onPress={() => handleSubmit(onSubmit)()}
              disabled={isPending}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
