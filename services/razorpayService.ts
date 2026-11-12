/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NativeModules, Platform } from 'react-native';

export interface RazorpayOptions {
  description: string;
  image?: string;
  currency: string;
  key: string;
  amount: number; // in paise (e.g., 300000 = ₹3000)
  name: string;
  order_id: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
    method?: string;
  };
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    backdrop_color?: string;
    backdropclose?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
  };
  retry?: {
    enabled: boolean;
    max_count?: number;
  };
  notes?: Record<string, string>;
  send_sms_hash?: boolean;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature?: string;
}

export const openRazorpayPayment = async (
  options: RazorpayOptions
): Promise<RazorpayPaymentSuccess> => {
  // 1. Verify if native module is present in the native binary (e.g. Expo Dev Client / Standalone APK)
  const isNativeLinked = !!(
    NativeModules?.RNRazorpayCheckout ||
    (globalThis as any)?.__turboModuleProxy?.('RNRazorpayCheckout')
  );

  if (!isNativeLinked) {
    console.warn(
      '⚠️ Razorpay native binary is not compiled into this APK/Expo Go. Falling back to payment options flow.'
    );
    const customErr = new Error('NATIVE_MODULE_NOT_LINKED');
    (customErr as any).description =
      'Razorpay Native Checkout requires an Android build containing react-native-razorpay.';
    throw customErr;
  }

  let RazorpayCheckout: any = null;
  try {
    const RazorpayModule = require('react-native-razorpay');
    RazorpayCheckout = RazorpayModule?.default || RazorpayModule;
  } catch (requireError: any) {
    console.warn(
      '⚠️ react-native-razorpay module not linked or unlinked in Expo Go. Falling back to Dev Build flow.'
    );
    const customErr = new Error('NATIVE_MODULE_NOT_LINKED');
    (customErr as any).description =
      'Razorpay Native Checkout requires Android Dev Build (`npx expo run:android`).';
    throw customErr;
  }

  if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
    console.warn(
      '⚠️ Razorpay native checkout method unavailable. Falling back to payment options.'
    );
    const customErr = new Error('NATIVE_MODULE_NOT_LINKED');
    (customErr as any).description =
      'Razorpay Native Checkout requires Android Dev Build (`npx expo run:android`).';
    throw customErr;
  }

  try {
    // Ensure white backdrop and navigation bar backgrounds so no red line leaks underneath
    const checkoutPayload = {
      ...options,
      theme: {
        color: '#E23744',
        backdrop_color: '#FFFFFF',
        ...(options.theme || {}),
      },
      modal: {
        backdrop_color: '#FFFFFF',
        ...(options.modal || {}),
      },
    };

    console.log('🚀 Opening Razorpay Native Checkout:', {
      order_id: checkoutPayload.order_id,
      amount: checkoutPayload.amount,
      currency: checkoutPayload.currency,
      key: `${(checkoutPayload.key || '').substring(0, 8)}...`,
    });

    const result: RazorpayPaymentSuccess = await RazorpayCheckout.open(checkoutPayload);
    console.log('✅ Razorpay Payment Success Callback:', result);
    return result;
  } catch (error: any) {
    if (
      error?.message === 'NATIVE_MODULE_NOT_LINKED' ||
      error?.message?.includes('NativeModules') ||
      error?.message?.includes('RNRazorpayCheckout') ||
      error?.message?.includes('Cannot find module') ||
      error?.message?.includes('not linked') ||
      error?.message?.includes('NativeEventEmitter') ||
      error?.code === 'MODULE_NOT_FOUND'
    ) {
      console.warn(
        '⚠️ Razorpay native module requires Expo Android Dev Build (`npx expo run:android`).'
      );
      const customErr = new Error('NATIVE_MODULE_NOT_LINKED');
      (customErr as any).description =
        'Razorpay Native Checkout requires Android Dev Build (`npx expo run:android`).';
      throw customErr;
    }
    const isCancelled =
      error?.code === 2 ||
      error?.code === 0 ||
      error?.description?.toLowerCase()?.includes('cancelled');

    if (!isCancelled) {
      console.error('❌ Razorpay checkout error:', error);
    }
    throw error;
  }
};
