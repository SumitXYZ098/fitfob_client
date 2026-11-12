/* eslint-disable @typescript-eslint/no-require-imports */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import apiInstance from '@/api/apiInstance';
import { ENDPOINTS } from '@/api/endpoint';

let Notifications: typeof import('expo-notifications') | null = null;

try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('⚠️ Could not load expo-notifications module:', error);
}

// Fallback EAS project ID from app.json
const FALLBACK_PROJECT_ID = 'dfb97cd0-979d-4d1c-9682-2564ae05896b';

// Helper to determine if running in standard Expo Go app
const isExpoGoClient = () => {
  return isRunningInExpoGo() || (Constants as any)?.appOwnership === 'expo';
};

// Configure notification behavior when app is in foreground
try {
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (handlerError) {
  console.warn('⚠️ Failed to set notification handler:', handlerError);
}

/**
 * Configure Android Notification Channels
 * Android 8.0+ (API 26+) requires a channel for ANY notification to display.
 */
export async function setupNotificationChannelsAsync() {
  if (Platform.OS !== 'android' || !Notifications) return;

  // In Expo Go on Android (SDK 53+), ExpoNotificationChannelManager has no provider and throws NullPointerException
  if (isExpoGoClient()) {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F6163C',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      sound: 'default',
    });
    console.log('🔔 Android notification channel "default" ready');
  } catch (channelError: any) {
    console.warn(
      '⚠️ Failed to set Android notification channel:',
      channelError?.message || channelError
    );
  }
}

// Ensure channel is registered on module load for Android (in Dev Build / Standalone)
if (Platform.OS === 'android' && !isExpoGoClient()) {
  setupNotificationChannelsAsync().catch(() => {});
}

/**
 * Registers device for push notifications and returns Expo or Device Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  try {
    const notif = Notifications;
    if (!notif) {
      console.warn('⚠️ Notifications module is not available');
      return undefined;
    }

    // Remote push notifications were removed from Expo Go on Android in SDK 53+.
    // A development build (`npx expo run:android`) or standalone build is required for real push tokens.
    if (isExpoGoClient() && Platform.OS === 'android') {
      console.log(
        'ℹ️ Android push notifications require a Development Build (npx expo run:android). Push tokens are unavailable in Expo Go.'
      );
      return undefined;
    }

    // Always ensure Android channel exists in dev build / standalone
    if (Platform.OS === 'android') {
      await setupNotificationChannelsAsync();
    }

    // 1. Check & Request Permissions (Required on Android 13+ / API 33+)
    let finalStatus = 'undetermined';
    try {
      const { status: existingStatus } = await notif.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await notif.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (permError) {
      console.warn('⚠️ Error requesting notification permissions:', permError);
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permissions denied on this device.');
      return undefined;
    }

    // 2. Resolve EAS Project ID with multiple fallbacks
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      (Constants as any)?.manifest?.extra?.eas?.projectId ??
      (Constants as any)?.manifest2?.extra?.eas?.projectId ??
      FALLBACK_PROJECT_ID;

    let token: string | undefined;

    // 3. Attempt to fetch Expo Push Token
    try {
      const pushTokenData = await notif.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData.data;
      console.log('✅ Registered Expo Push Token:', token);
    } catch (expoPushError: any) {
      console.warn(
        '⚠️ getExpoPushTokenAsync failed, attempting native device token fallback:',
        expoPushError?.message || expoPushError
      );

      // 4. Fallback to native Device Push Token (FCM on Android / APNs on iOS)
      try {
        const deviceTokenData = await notif.getDevicePushTokenAsync();
        if (deviceTokenData?.data) {
          token = deviceTokenData.data;
          console.log('✅ Registered Native Device Push Token:', token);
        }
      } catch (deviceError: any) {
        console.warn(
          '⚠️ getDevicePushTokenAsync also failed:',
          deviceError?.message || deviceError
        );
      }
    }

    return token;
  } catch (err) {
    console.warn('⚠️ Push notification registration skipped or failed:', err);
    return undefined;
  }
}

/**
 * Register device push token with the FitFob backend
 */
export async function registerDeviceTokenWithBackend(expoPushToken?: string) {
  try {
    const token = expoPushToken || (await registerForPushNotificationsAsync());

    if (token) {
      console.log('📡 Registering device token with backend:', { token, platform: Platform.OS });
      const response = await apiInstance.post(ENDPOINTS.REGISTER_DEVICE_TOKEN, {
        token,
        platform: Platform.OS,
      });
      console.log('✅ Device token successfully registered with backend:', response.data);
      return response.data;
    } else if (!isExpoGoClient() || Platform.OS !== 'android') {
      console.warn('⚠️ No device push token available to register with backend');
    }
  } catch (error: any) {
    console.error(
      '❌ Failed to register device token with backend:',
      error?.response?.data || error.message
    );
  }
}

/**
 * Unregister device push token from backend upon logout
 */
export async function unregisterDeviceTokenWithBackend(expoPushToken?: string) {
  try {
    const token = expoPushToken || (await registerForPushNotificationsAsync());

    if (token) {
      console.log('📡 Unregistering device token from backend:', { token, platform: Platform.OS });
      const response = await apiInstance.post(ENDPOINTS.UNREGISTER_DEVICE_TOKEN, {
        token,
        platform: Platform.OS,
      });
      console.log('✅ Device token successfully unregistered from backend:', response.data);
      return response.data;
    }
  } catch (error: any) {
    console.error(
      '❌ Failed to unregister device token with backend:',
      error?.response?.data || error.message
    );
  }
}

/**
 * Helper to display an immediate local notification (useful for in-app alerts and testing)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  try {
    if (!Notifications) return;
    await setupNotificationChannelsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // show immediately
    });
  } catch (error) {
    console.warn('⚠️ Failed to display local notification:', error);
  }
}
