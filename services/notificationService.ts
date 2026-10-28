/* eslint-disable @typescript-eslint/no-require-imports */
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import apiInstance from '@/api/apiInstance';
import { ENDPOINTS } from '@/api/endpoint';

let Notifications: typeof import('expo-notifications') | null = null;

// Remote push notifications were removed from Expo Go on Android in SDK 53+.
// Loading expo-notifications on Android in Expo Go throws an unhandled exception at import time.
if (isRunningInExpoGo() && Platform.OS === 'android') {
  console.warn(
    'expo-notifications: Android Push notifications functionality provided by expo-notifications was removed from Expo Go in SDK 53+. Push notification setup is skipped in Expo Go. Use a development build (npx expo run:android) instead.'
  );
} else {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('Failed to load expo-notifications module:', error);
  }
}

// Configure notification behavior when app is in foreground
try {
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (handlerError) {
  console.warn('Failed to set notification handler:', handlerError);
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  try {
    const notif = Notifications;
    if (!notif) {
      return undefined;
    }

    let token: string | undefined;

    // Android Notification Channel Setup
    if (Platform.OS === 'android') {
      try {
        await notif.setNotificationChannelAsync('default', {
          name: 'Default Channel',
          importance: notif.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F6163C',
        });
      } catch (channelError) {
        console.warn('Failed to set notification channel:', channelError);
      }
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await notif.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await notif.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions denied.');
        return undefined;
      }

      // Retrieve EAS Project ID from Expo Constants
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error('Project ID not found in app.json extra.eas.projectId');
        return undefined;
      }

      try {
        const pushTokenData = await notif.getExpoPushTokenAsync({
          projectId,
        });
        token = pushTokenData.data;
        console.log('✅ Registered Expo Push Token:', token);
      } catch (error) {
        console.error('❌ Error getting Expo Push Token:', error);
      }
    } else {
      console.log('Must use a physical device for Push Notifications');
    }

    return token;
  } catch (err) {
    console.warn('Push notification registration skipped or failed:', err);
    return undefined;
  }
}

export async function registerDeviceTokenWithBackend(expoPushToken?: string) {
  try {
    const token = expoPushToken || (await registerForPushNotificationsAsync());

    if (token) {
      const response = await apiInstance.post(ENDPOINTS.REGISTER_DEVICE_TOKEN, {
        token,
        platform: Platform.OS,
      });
      console.log('✅ Device token registered with backend:', response.data);
      return response.data;
    }
  } catch (error: any) {
    console.error(
      '❌ Failed to register device token with backend:',
      error?.response?.data || error.message
    );
  }
}

export async function unregisterDeviceTokenWithBackend(expoPushToken?: string) {
  try {
    const token = expoPushToken || (await registerForPushNotificationsAsync());

    if (token) {
      const response = await apiInstance.post(ENDPOINTS.UNREGISTER_DEVICE_TOKEN, {
        token,
        platform: Platform.OS,
      });
      console.log('✅ Device token unregistered with backend:', response.data);
      return response.data;
    }
  } catch (error: any) {
    console.error(
      '❌ Failed to unregister device token with backend:',
      error?.response?.data || error.message
    );
  }
}
