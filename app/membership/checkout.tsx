import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  CheckoutScreen,
  PaymentPendingStep,
  RequestDeclinedStep,
  MembershipSuccessStep,
  CheckoutDetails,
} from '@/components/modules/payAtGym';

type StepType = 'checkout' | 'pending' | 'declined' | 'success';

export default function MembershipCheckoutRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Read params passed from GymDetail or fallback to mockup defaults
  const gymName = (params.gymName as string) || (params.title as string) || 'PowerHouse Gym';
  const gymLocation = (params.gymLocation as string) || (params.address as string) || 'Phase 7, Mohali';
  const planName = (params.selectedPlanName as string) || (params.planName as string) || '3–Month Pro';
  const rawPrice = params.selectedPlanPrice || params.price || '4500';
  const price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 4500 : (rawPrice as number);

  const details: CheckoutDetails = {
    gymName,
    gymLocation,
    planName,
    price,
    duration: (params.duration as string) || '3 Months',
  };

  const initialMode = (params.initialMode as 'online' | 'gym') || 'gym';

  const [currentStep, setCurrentStep] = useState<StepType>(() => {
    if (params.initialStep && ['checkout', 'pending', 'declined', 'success'].includes(params.initialStep as string)) {
      return params.initialStep as StepType;
    }
    return 'checkout';
  });

  const [lastPaymentMethod, setLastPaymentMethod] = useState<'Online (UPI)' | 'Verified by Gym'>('Online (UPI)');

  // Handlers for user actions
  const handlePayOnline = () => {
    // Run the previous online payment process (review-and-buy)
    router.push({
      pathname: '/membership/review-and-buy' as any,
      params: {
        gymName,
        membershipTier: planName,
        membershipPrice: price.toString(),
        duration: details.duration || '3 Months',
        passTitle: 'None',
        visits: '0',
        outdoorPassPrice: '0',
        validityDays: '0',
        planDocumentId: (params.planDocumentId as string) || (params.selectedPlanId as string) || '',
        gymContract: (params.gymContract as string) || '',
      },
    });
  };

  const handlePayAtGym = () => {
    Toast.show({
      type: 'info',
      text1: 'Request Sent! 📩',
      text2: `Gym notified for ${planName}`,
    });
    setCurrentStep('pending');
  };

  const handleViewDirections = () => {
    const query = encodeURIComponent(`${gymName} ${gymLocation}`);
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(mapUrl).catch(() => {
      Toast.show({
        type: 'info',
        text1: 'Directions',
        text2: `Opening directions to ${gymName}`,
      });
    });
  };

  const handleCancelRequest = () => {
    Toast.show({
      type: 'info',
      text1: 'Request Cancelled',
      text2: 'Your pay-at-gym request was cancelled',
    });
    setCurrentStep('checkout');
  };

  const handleViewEntryQr = () => {
    router.push('/(tab)/scan' as any);
  };

  const handleBack = () => {
    if (currentStep === 'pending' || currentStep === 'declined' || currentStep === 'success') {
      setCurrentStep('checkout');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Render Current Step */}
      <View style={{ flex: 1 }}>
        {currentStep === 'checkout' && (
          <CheckoutScreen
            details={details}
            initialMode={initialMode}
            onPayOnline={handlePayOnline}
            onPayAtGym={handlePayAtGym}
            onBack={handleBack}
          />
        )}

        {currentStep === 'pending' && (
          <PaymentPendingStep
            details={details}
            onViewDirections={handleViewDirections}
            onCancelRequest={handleCancelRequest}
            onBack={handleBack}
          />
        )}

        {currentStep === 'declined' && (
          <RequestDeclinedStep
            details={details}
            onPayOnlineNow={handlePayOnline}
            onSendNewRequest={() => setCurrentStep('checkout')}
            onBack={handleBack}
          />
        )}

        {currentStep === 'success' && (
          <MembershipSuccessStep
            details={details}
            paymentMethodLabel={lastPaymentMethod}
            onViewEntryQr={handleViewEntryQr}
            onBack={handleBack}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
