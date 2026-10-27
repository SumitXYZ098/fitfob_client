import { useEffect } from 'react';
import '../global.css';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { registerDeviceTokenWithBackend } from '@/services/notificationService';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function Layout() {
  const { user, isInitializing, initializeAuth } = useAuthStore();

  const [loaded, fontError] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Helvetica-Regular': require('../assets/fonts/HelveticaforTarget.ttf'),
    'Helvetica-Bold': require('../assets/fonts/HelveticaforTarget-Bold.ttf'),
  });

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (user?.token) {
      registerDeviceTokenWithBackend().catch((e) =>
        console.warn('Notification registration warning:', e)
      );
    }
  }, [user?.token]);

  useEffect(() => {
    if (loaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, fontError]);

  if (!loaded || isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F6163C" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="gym" options={{ headerShown: false }} />
        </Stack>
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}