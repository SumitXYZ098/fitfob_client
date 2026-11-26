import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/modules/Button';
import { Container } from '@/components/modules/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import Toast from 'react-native-toast-message';
import { useResetPassword } from '@/hook/useAuth';

// 1. Validation Schema
const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type NewPasswordData = z.infer<typeof newPasswordSchema>;

export default function CreateNewPassword() {
  const { email, identifier: paramIdentifier, resetToken } = useLocalSearchParams();

  const { mutate: resetPassword, isPending } = useResetPassword();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (data: NewPasswordData) => {
    // Force params to be strings (handles string | string[] from useLocalSearchParams)
    const rawId = Array.isArray(paramIdentifier)
      ? paramIdentifier[0]
      : paramIdentifier || (Array.isArray(email) ? email[0] : email);
    const tokenStr = Array.isArray(resetToken) ? resetToken[0] : resetToken;

    if (!tokenStr || !rawId) {
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please start the forgot password process again.',
      });
      return;
    }

    const cleanId = decodeURIComponent(String(rawId)).trim();
    const formattedId = cleanId.includes('@') ? cleanId.toLowerCase() : cleanId;

    const payload = {
      identifier: formattedId,
      password: data.password,
      confirmPassword: data.confirmPassword,
      resetToken: decodeURIComponent(String(tokenStr)),
    };

    resetPassword(payload);
  };

  return (
    <Container>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1">
          {/* Header Section */}
          <View className="mt-8">
            <Text
              className="font-bold text-[32px] leading-tight text-[#1C1C1C]"
              style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Create A New{'\n'}Password
            </Text>
            <Text
              className="mt-3 text-base text-[#697281]"
              style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              Enter a new password and try not to forget it.
            </Text>
          </View>

          {/* Input Section */}
          <View className="mt-10 gap-y-6">
            {/* New Password Field */}
            <View>
              <Text className="mb-2 ml-1 font-medium text-sm text-[#697281]">Set New Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`h-14 flex-row items-center rounded-2xl border ${
                      errors.password ? 'border-red-500' : 'border-slate-200'
                    } bg-white px-4`}>
                    <TextInput
                      placeholder="********"
                      secureTextEntry={!showPass}
                      className="flex-1 text-base text-slate-900"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      editable={!isPending}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Ionicons
                        name={showPass ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#697281"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="ml-1 mt-1 text-xs text-red-500">{errors.password.message}</Text>
              )}
            </View>

            {/* Confirm Password Field */}
            <View>
              <Text className="mb-2 ml-1 font-medium text-sm text-[#697281]">Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`h-14 flex-row items-center rounded-2xl border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-slate-200'
                    } bg-white px-4`}>
                    <TextInput
                      placeholder="********"
                      secureTextEntry={!showConfirmPass}
                      className="flex-1 text-base text-slate-900"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      editable={!isPending}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                      <Ionicons
                        name={showConfirmPass ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#697281"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text className="ml-1 mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          </View>

          <View className="flex-1" />

          {/* Continue Button */}
          <View className="mb-6">
            <Button
              title={isPending ? 'Updating...' : 'Continue'}
              onPress={() => handleSubmit(onSubmit)()}
              disabled={isPending}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
