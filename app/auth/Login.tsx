/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/modules/Button';
import { Container } from '@/components/modules/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { LinearGradient } from 'expo-linear-gradient';

// Validation Imports
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFacebookLogin, useGoogleLogin, useLoginRequest } from '@/hook/useAuth';
import FacebookButton from '@/components/modules/FacebookButton';
import { facebookAuthService } from '@/services/facebookAuth';
import { googleAuthService } from '@/services/googleAuth';
import GoogleButton from '@/components/modules/GoogleButton';

// 1. Validation Schema
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or Phone is required')
    .refine((val) => {
      const clean = val.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
      const isPhone = /^\+?[0-9]{8,15}$/.test(clean.replace(/[\s-]/g, ''));
      return isEmail || isPhone;
    }, 'Please enter a valid email or phone number'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const { mutate: loginMutation, isPending: loginIsPending } = useLoginRequest();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { mutate: googleLogin, isPending: googleIsPending } = useGoogleLogin();
  const { mutate: facebookLogin, isPending: facebookIsPending } = useFacebookLogin();

  // Loading state shortcut
  const isLoading = loginIsPending || googleIsPending || facebookIsPending;

  // 2. Form Hook Setup
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  // Load remembered user on mount
  React.useEffect(() => {
    const loadRememberedUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('rememberedUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.identifier) {
            setValue('identifier', parsed.identifier);
            setRememberMe(true);
          }
        }
      } catch (err) {
        console.log('Error loading remembered user:', err);
      }
    };
    loadRememberedUser();
  }, [setValue]);

  const { setUser } = useAuthStore();
  const onSubmit = (data: LoginFormData) => {
    const cleanIdentifier = data.identifier.trim();
    const formattedIdentifier = cleanIdentifier.includes('@')
      ? cleanIdentifier.toLowerCase()
      : cleanIdentifier;

    const payload = {
      identifier: formattedIdentifier,
      password: data.password,
    };

    loginMutation(payload, {
      onSuccess: async (response) => {
        if (response && response.jwt && response.user) {
          if (rememberMe) {
            await AsyncStorage.setItem(
              'rememberedUser',
              JSON.stringify({ identifier: formattedIdentifier })
            );
          } else {
            await AsyncStorage.removeItem('rememberedUser');
          }

          const userWithToken = {
            ...response.user,
            token: response.jwt,
          };
          await setUser(userWithToken, rememberMe);

          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome back! 👋',
          });

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
        console.log('Login Error Detail:', error?.response?.data || error.message || error);
        const serverMsg =
          error?.response?.data?.error?.message || error?.message || 'Something went wrong';
        const status = error?.response?.status;

        if (status === 401 || serverMsg.toLowerCase().includes('password')) {
          setError('password', {
            type: 'manual',
            message: 'Incorrect password! Please try again.',
          });

          Toast.show({
            type: 'error',
            text1: 'Authentication Failed',
            text2: 'The password you entered is incorrect. ',
          });
        } else if (
          status === 404 ||
          serverMsg.toLowerCase().includes('user') ||
          serverMsg.toLowerCase().includes('identifier')
        ) {
          setError('identifier', {
            type: 'manual',
            message: 'Email/Phone is not registered. Please sign up first.',
          });

          Toast.show({
            type: 'error',
            text1: 'User Not Found',
            text2: 'Please check your email or sign up. ✉️',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Connection Error',
            text2: serverMsg,
          });
        }
      },
    });
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    console.log('Google Login: Button pressed.');
    try {
      console.log('Google Login: Triggering native Google Sign-In flow...');
      const idToken = await googleAuthService.signIn();
      console.log('Google Login: Obtained ID Token successfully. Sending to backend...');
      googleLogin(
        { idToken },
        {
          onSuccess: () => {
            console.log('Google Login: Backend verification succeeded.');
            Toast.show({
              type: 'success',
              text1: 'Google Login Success',
              text2: 'Welcome back! 👋',
            });
          },
          onError: (err: any) => {
            Toast.show({
              type: 'error',
              text1: 'Google Login Failed',
              text2: err?.message || 'Google Login failed',
            });
          },
        }
      );
    } catch (err: any) {
      if (err.message && !err.message.includes('cancelled')) {
        console.log('Google Login: Error - ', err?.message);
        Toast.show({
          type: 'error',
          text1: 'Google Login Failed',
          text2: err?.message || 'Google Login failed',
        });
      }
    }
  };

  // Handle Facebook Login
  const handleFacebookLogin = async () => {
    console.log('Facebook Login: Button pressed.');
    try {
      console.log('Facebook Login: Triggering native Facebook login...');
      const credentials = await facebookAuthService.signIn();
      console.log('Facebook Login: Obtained Facebook credentials. Sending to backend...');
      facebookLogin(credentials, {
        onSuccess: () => {
          console.log('Facebook Login: Backend verification succeeded.');
          Toast.show({
            type: 'success',
            text1: 'Facebook Login Success',
            text2: 'Welcome back! 👋',
          });
        },
        onError: (err: any) => {
          Toast.show({
            type: 'error',
            text1: 'Facebook Login Failed',
            text2: err?.message || 'Facebook Login failed',
          });
        },
      });
    } catch (err: any) {
      if (err.message && !err.message.includes('cancelled')) {
        Toast.show({
          type: 'error',
          text1: 'Facebook Login Failed',
          text2: err?.message || 'Facebook Login failed',
        });
      }
    }
  };

  return (
    <Container>
      {/* --- FULL SCREEN LOADING OVERLAY --- */}
      {isLoading && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <View className="items-center justify-center rounded-3xl border border-[#CCCECE]  bg-white p-8">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-4 font-bold text-lg text-slate-900">Logging In</Text>
            <Text className="mt-1 text-slate-400">Authenticating your account...</Text>
          </View>
        </View>
      )}

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        pointerEvents={isLoading ? 'none' : 'auto'}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        {/* Header Section */}
        <View className="mt-12 items-center">
          <Image
            source={require('../../assets/images/Vector.png')}
            className="h-[54px] w-[54px]"
            resizeMode="contain"
          />
          <Text className="font-bold text-4xl text-darkText">Get Started now</Text>
          <Text className="mt-2 text-center font-medium text-sm text-secondaryText">
            Please login to your account!
          </Text>
        </View>

        <View className="mt-10 space-y-5">
          {/* Identifier Field */}
          <View>
            <Text className="mb-2 ml-1 text-sm text-secondaryText">Email or Phone number</Text>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 justify-center rounded-2xl border ${errors.identifier ? 'border-red-500' : 'border-border'} bg-white px-4 `}>
                  <TextInput
                    placeholder="Email or Phone number"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="h-full text-darkText"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              )}
            />
            {errors.identifier && (
              <Text className="ml-1 mt-1 text-xs text-red-500">{errors.identifier.message}</Text>
            )}
          </View>

          {/* Password Field */}
          <View>
            <Text className="mb-2 ml-1 mt-4 text-sm text-secondaryText">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 flex-row items-center rounded-2xl border ${errors.password ? 'border-red-500' : 'border-border'} bg-white px-4 `}>
                  <TextInput
                    placeholder="*******"
                    secureTextEntry={!isPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="h-full flex-1 text-darkText"
                  />
                  <TouchableOpacity
                    disabled={isLoading}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons
                      name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="ml-1 mt-1 text-xs text-red-500">{errors.password.message}</Text>
            )}
          </View>

          {/* Remember Me & Forgot Password Row */}
          <View className="mt-3 flex-row items-center justify-between px-1">
            <TouchableOpacity
              disabled={isLoading}
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center">
              <View
                className={`h-5 w-5 items-center justify-center rounded border ${rememberMe ? 'border-[#F6163C] bg-[#F6163C]' : 'border-slate-300'}`}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="ml-2 font-medium text-sm text-secondaryText">Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isLoading}
              onPress={() => router.push('/auth/ForgotPasswordScreen')}>
              <Text className="font-bold text-sm text-primary">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button */}
        <View className="mt-8">
          <Button
            className="rounded-xl"
            title="Login"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          />
        </View>

        {/* Divider */}
        <View className="mb-2 mt-8 flex-row items-center px-4">
          <LinearGradient
            colors={['rgba(0,0,0,0)', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />
          <Text className="mx-2 font-medium text-xs text-darkText">OR</Text>
          <LinearGradient
            colors={['#000000', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />
        </View>

        {/* Social Buttons */}
        <View className="mb-6 mt-2 flex-col gap-3">
          <GoogleButton
            onPress={handleGoogleLogin}
            isLoading={googleIsPending}
            disabled={isLoading}
          />
          <FacebookButton
            onPress={handleFacebookLogin}
            isLoading={facebookIsPending}
            disabled={isLoading}
          />
        </View>

        {/* Footer */}
        <View className="flex-row justify-center pb-6">
          <Text className="text-secondaryText">Don't have an account? </Text>
          <TouchableOpacity disabled={isLoading} onPress={() => router.push('/auth/SignUp')}>
            <Text className="font-bold text-primary">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
