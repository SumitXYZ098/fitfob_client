import { Platform } from 'react-native';

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
  try {
    // Dynamic require so unlinked environments (like Expo Go) don't crash on bundle load
    const RazorpayModule = require('react-native-razorpay');
    const RazorpayCheckout = RazorpayModule?.default || RazorpayModule;

    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      throw new Error('NATIVE_MODULE_NOT_LINKED');
    }

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
      error?.message?.includes('RNRazorpayCheckout')
    ) {
      console.warn(
        '⚠️ Razorpay native module requires Expo Android Dev Build (`npx expo run:android`).'
      );
      const customErr = new Error('NATIVE_MODULE_NOT_LINKED');
      (customErr as any).description =
        'Razorpay Native Checkout requires Android Dev Build (`npx expo run:android`).';
      throw customErr;
    }
    console.error('❌ Razorpay checkout error:', error);
    throw error;
  }
};
