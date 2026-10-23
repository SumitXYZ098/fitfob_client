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

    console.log('🚀 Opening Razorpay Native Checkout:', {
      order_id: options.order_id,
      amount: options.amount,
      currency: options.currency,
      key: `${(options.key || '').substring(0, 8)}...`,
    });

    const result: RazorpayPaymentSuccess = await RazorpayCheckout.open(options);
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
