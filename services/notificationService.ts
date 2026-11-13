/* eslint-disable @typescript-eslint/no-require-imports */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import apiInstance from '@/api/apiInstance';
import { ENDPOINTS } from '@/api/endpoint';

// Optional expo-notifications import for channels and foreground local presentation
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

// Safe getter for @react-native-firebase/messaging
export const getFirebaseMessaging = () => {
  try {
    const messagingModule = require('@react-native-firebase/messaging');
    const messaging = messagingModule?.default || messagingModule;
    if (typeof messaging === 'function') {
      return messaging;
    }
    return null;
  } catch (e) {
    return null;
  }
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

// Register background message handler as early as possible
try {
  const messaging = getFirebaseMessaging();
  if (messaging && typeof messaging().setBackgroundMessageHandler === 'function') {
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('📩 [Firebase FCM] Background Message handled:', remoteMessage);
    });
  }
} catch (bgError) {
  // Ignored in unsupported environments (e.g. Expo Go)
}

/**
 * Registers device for push notifications using Firebase SDK (FCM) first,
 * with graceful fallback to Expo push token when running in Expo Go or non-Firebase runtimes.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  try {
    // Remote push notifications were removed from Expo Go on Android in SDK 53+.
    if (isExpoGoClient() && Platform.OS === 'android') {
      console.log(
        'ℹ️ Android push notifications require a Development Build (npx expo run:android) or Standalone Build. Push tokens are unavailable in Expo Go.'
      );
      return undefined;
    }

    // Always ensure Android channel exists in dev build / standalone
    if (Platform.OS === 'android') {
      await setupNotificationChannelsAsync();
    }

    // 1. Try Firebase Cloud Messaging (FCM) via Firebase SDK
    try {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        // Request FCM Permissions (Handles POST_NOTIFICATIONS on Android 13+)
        const authStatus = await messaging().requestPermission();
        const isAuthorized =
          authStatus === 1 || // AuthorizationStatus.AUTHORIZED
          authStatus === 2 || // AuthorizationStatus.PROVISIONAL
          authStatus === true;

        if (isAuthorized) {
          // If iOS, ensure device is registered for remote messages
          if (
            Platform.OS === 'ios' &&
            typeof messaging().registerDeviceForRemoteMessages === 'function'
          ) {
            await messaging().registerDeviceForRemoteMessages();
          }

          const fcmToken = await messaging().getToken();
          if (fcmToken) {
            console.log('🔥 [Firebase FCM] Retrieved authentic device token:', fcmToken);
            return fcmToken;
          }
        } else {
          console.warn('⚠️ Push notification permission not authorized in Firebase SDK.');
        }
      }
    } catch (firebaseErr: any) {
      console.warn(
        '⚠️ Firebase Messaging getToken failed, falling back to Expo notifications:',
        firebaseErr?.message || firebaseErr
      );
    }

    // 2. Fallback to Expo Notifications if Firebase native module is not linked
    const notif = Notifications;
    if (!notif) {
      console.warn('⚠️ Neither Firebase nor expo-notifications module is available.');
      return undefined;
    }

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

    // Attempt to fetch Expo Push Token
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      (Constants as any)?.manifest?.extra?.eas?.projectId ??
      (Constants as any)?.manifest2?.extra?.eas?.projectId ??
      FALLBACK_PROJECT_ID;

    let token: string | undefined;
    try {
      const pushTokenData = await notif.getExpoPushTokenAsync({ projectId });
      token = pushTokenData.data;
      console.log('✅ Registered Expo Push Token:', token);
    } catch (expoPushError: any) {
      console.warn(
        '⚠️ getExpoPushTokenAsync failed, attempting native device token fallback:',
        expoPushError?.message || expoPushError
      );

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
export async function registerDeviceTokenWithBackend(deviceToken?: string) {
  try {
    const token = deviceToken || (await registerForPushNotificationsAsync());

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
export async function unregisterDeviceTokenWithBackend(deviceToken?: string) {
  try {
    const token = deviceToken || (await registerForPushNotificationsAsync());

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

/**
 * Attaches Firebase foreground notification and token refresh listeners.
 * Returns a cleanup function.
 */
export function setupFirebaseNotificationListeners(
  onNotificationReceived?: (message: any) => void
) {
  const unsubscribers: Array<() => void> = [];

  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) return () => {};

    // 1. Foreground message handler
    if (typeof messaging().onMessage === 'function') {
      const unsubMessage = messaging().onMessage(async (remoteMessage: any) => {
        console.log('🔔 [Firebase FCM] Foreground notification received:', remoteMessage);

        // Display local banner if notification payload is included
        if (remoteMessage?.notification) {
          await sendLocalNotification(
            remoteMessage.notification.title || 'FitFob',
            remoteMessage.notification.body || '',
            remoteMessage.data || {}
          );
        }

        if (onNotificationReceived) {
          onNotificationReceived(remoteMessage);
        }
      });
      unsubscribers.push(unsubMessage);
    }

    // 2. Token refresh listener
    if (typeof messaging().onTokenRefresh === 'function') {
      const unsubRefresh = messaging().onTokenRefresh(async (newToken: string) => {
        console.log('🔄 [Firebase FCM] Device token refreshed:', newToken);
        await registerDeviceTokenWithBackend(newToken);
      });
      unsubscribers.push(unsubRefresh);
    }

    // 3. User clicked notification when app was in background
    if (typeof messaging().onNotificationOpenedApp === 'function') {
      const unsubOpen = messaging().onNotificationOpenedApp((remoteMessage: any) => {
        console.log('📲 [Firebase FCM] Notification opened app from background:', remoteMessage);
      });
      unsubscribers.push(unsubOpen);
    }

    // 4. User clicked notification when app was quit/killed
    if (typeof messaging().getInitialNotification === 'function') {
      messaging()
        .getInitialNotification()
        .then((remoteMessage: any) => {
          if (remoteMessage) {
            console.log(
              '📲 [Firebase FCM] Notification opened app from quit state:',
              remoteMessage
            );
          }
        });
    }
  } catch (error) {
    console.warn('⚠️ Could not setup Firebase notification listeners:', error);
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {}
    });
  };
}
