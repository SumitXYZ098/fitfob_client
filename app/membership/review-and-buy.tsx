import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import GradientDivider from '@/components/GradientDivider';
import { createMembershipCheckoutBuy } from '@/api/clientApi';
import { openRazorpayPayment } from '@/services/razorpayService';
import { useAuthStore } from '@/store/useAuthStore';
import { useOutdoorPassStore } from '@/store/useOutdoorPassStore';

export default function ReviewAndBuyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { setActivePass } = useOutdoorPassStore();

  const [isProcessing, setIsProcessing] = useState(false);

  const gymName = (params.gymName as string) || 'ANY Fitness gym Sector 71';
  const membershipTier = (params.membershipTier as string) || 'Premium Membership';
  const duration = (params.duration as string) || 'Monthly';
  const membershipPrice = parseFloat((params.membershipPrice as string) || '1899');

  const passTitle = (params.passTitle as string) || 'Premium Pass';
  const visits = (params.visits as string) || '7';
  const validityDays = (params.validityDays as string) || '15';
  const outdoorPassPrice = parseFloat((params.outdoorPassPrice as string) || '1399');

  const localPlanDocumentId = (params.planDocumentId as string) || '';
  const outdoorPlanDocumentId = (params.outdoorPlanDocumentId as string) || '';

  const hasOutdoorPass = outdoorPassPrice > 0;
  const totalAmount = membershipPrice + outdoorPassPrice;

  const handlePayAndActivate = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // 1. Create order via /api/membership-checkout/buy
      const payload = {
        local_membership_plan: localPlanDocumentId,
        ...(outdoorPlanDocumentId ? { outdoor_membership_plan: outdoorPlanDocumentId } : {}),
      };

      console.log('💳 Initiating /api/membership-checkout/buy with payload:', payload);
      const checkoutResponse = await createMembershipCheckoutBuy(payload);
      console.log('📦 Received checkout response:', checkoutResponse);

      const razorpayOrderId = checkoutResponse.razorpayOrderId;
      const razorpayKeyId = checkoutResponse.razorpayKeyId;
      const totalAmountInPaise =
        checkoutResponse.totalAmountInPaise || Math.round(totalAmount * 100);
      const currency = checkoutResponse.currency || 'INR';

      // 2. Configure Razorpay checkout options
      const options = {
        description: `${membershipTier} - ${gymName}`,
        image:
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
        currency,
        key: razorpayKeyId,
        amount: totalAmountInPaise,
        name: 'FitFob',
        order_id: razorpayOrderId,
        prefill: {
          email: user?.email || '',
          contact: user?.mobile_number || (user as any)?.phone || '',
          name: user?.full_name || user?.username || 'FitFob Member',
        },
        theme: { color: '#E23744' },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      try {
        // 3. Open Razorpay native modal
        const paymentResult = await openRazorpayPayment(options);
        console.log('🎉 Razorpay payment succeeded:', paymentResult);

        // Store active pass if outdoor pass was included
        const generatedPassId = paymentResult.razorpay_payment_id || `FF-${Date.now()}`;
        if (hasOutdoorPass) {
          setActivePass({
            id: generatedPassId,
            passName: passTitle,
            tierId: passTitle.toLowerCase().includes('luxury') ? 'luxury' : 'premium',
            visits: parseInt(visits, 10) || 7,
            totalVisits: parseInt(visits, 10) || 7,
            expiresOn: '30 Days',
            price: outdoorPassPrice,
            location: gymName,
            isPaused: false,
            purchasedAt: new Date().toISOString(),
          });
        }

        Toast.show({
          type: 'success',
          text1: 'Payment Successful! 🎉',
          text2: `Payment ID: ${paymentResult.razorpay_payment_id}`,
        });

        router.replace({
          pathname: '/membership/gym-verification' as any,
          params: {
            gymName,
            location: gymName,
            passId: generatedPassId,
            orderId: razorpayOrderId,
          },
        });
      } catch (nativeError: any) {
        if (nativeError?.message === 'NATIVE_MODULE_NOT_LINKED') {
          // If testing in standard Expo Go, navigate to payment screen with order data
          Toast.show({
            type: 'info',
            text1: 'Order Created',
            text2: `Order: ${razorpayOrderId}. Use Dev Build for native Razorpay modal.`,
          });
          router.push({
            pathname: '/membership/payment' as any,
            params: {
              totalAmount: totalAmount.toString(),
              gymName,
              membershipTier,
              passTitle,
              visits,
              razorpayOrderId,
              razorpayKeyId,
              totalAmountInPaise: totalAmountInPaise.toString(),
              currency,
              planDocumentId: localPlanDocumentId,
              outdoorPlanDocumentId,
            },
          });
          return;
        }

        const isCancelled =
          nativeError?.code === 2 ||
          nativeError?.code === 0 ||
          nativeError?.description?.toLowerCase()?.includes('cancelled');

        if (isCancelled) {
          Toast.show({
            type: 'info',
            text1: 'Payment Cancelled',
            text2: 'You closed the checkout modal without paying.',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Payment Failed',
            text2: nativeError?.description || nativeError?.message || 'Transaction could not be completed.',
          });
        }
      }
    } catch (apiError: any) {
      console.error('❌ Membership checkout error:', apiError);
      Toast.show({
        type: 'error',
        text1: 'Checkout Order Failed',
        text2: apiError?.response?.data?.message || apiError?.message || 'Could not initiate checkout with server.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 1. Top Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center -ml-2"
          activeOpacity={0.7}
          disabled={isProcessing}>
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-semibold text-[17px] text-slate-800 tracking-tight">
          Review & Buy
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 120,
        }}>
        {/* 2. Regular Membership Card */}
        <View className="rounded-[22px] bg-[#F8FAFC] p-5 border border-slate-100 shadow-xs mb-4">
          <Text className="font-bold text-[15px] text-slate-800 pb-3">
            Regular Membership
          </Text>

          <GradientDivider />

          <View className="pt-3.5 space-y-2.5">
            {[gymName, membershipTier, duration].map((item, idx) => (
              <View key={idx} className="flex-row items-center mb-2.5">
                <View className="h-4 w-4 items-center justify-center rounded-[4px] bg-[#DCFCE7] mr-2.5">
                  <Ionicons name="checkmark-done" size={11} color="#16A34A" />
                </View>
                <Text className="font-normal text-[13px] text-slate-700">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Outdoor Add-on Card (Shown if outdoor pass selected) */}
        {hasOutdoorPass && (
          <View className="rounded-[22px] bg-[#F8FAFC] p-5 border border-slate-100 shadow-xs mb-5">
            <Text className="font-bold text-[15px] text-slate-800 pb-3">
              Outdoor Add-on
            </Text>

            <GradientDivider />

            <View className="pt-3.5 space-y-2.5">
              {[passTitle, `${visits} Visits`, `Expires in ${validityDays} days`].map(
                (item, idx) => (
                  <View key={idx} className="flex-row items-center mb-2.5">
                    <View className="h-4 w-4 items-center justify-center rounded-[4px] bg-[#DCFCE7] mr-2.5">
                      <Ionicons name="checkmark-done" size={11} color="#16A34A" />
                    </View>
                    <Text className="font-normal text-[13px] text-slate-700">
                      {item}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {/* 4. Pricing Breakdown Card */}
        <View className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-xs">
          <View className="flex-row items-center justify-between pb-2.5">
            <Text className="font-normal text-[13.5px] text-slate-600">
              Membership
            </Text>
            <Text className="font-medium text-[13.5px] text-slate-800">
              ₹{membershipPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {hasOutdoorPass && (
            <View className="flex-row items-center justify-between pb-3">
              <Text className="font-normal text-[13.5px] text-slate-600">
                Outdoor Pass
              </Text>
              <Text className="font-medium text-[13.5px] text-slate-800">
                ₹{outdoorPassPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          <GradientDivider />

          <View className="flex-row items-center justify-between pt-3">
            <Text className="font-bold text-[14.5px] text-slate-800">
              Total Amount
            </Text>
            <Text className="font-bold text-[16px] text-slate-900">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Action Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white">
        <GradientDivider />
        <View className="px-5 pt-3 pb-6">
          <TouchableOpacity
            onPress={handlePayAndActivate}
            activeOpacity={0.88}
            disabled={isProcessing}
            style={{ borderRadius: 14 }}
            className={`w-full items-center justify-center py-3.5 flex-row gap-2 ${
              isProcessing ? 'bg-rose-400' : 'bg-[#E23744]'
            }`}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="font-bold text-[16px] text-white">
                  Opening Checkout...
                </Text>
              </>
            ) : (
              <Text className="font-bold text-[16px] text-white">
                Pay & Activate Membership
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
