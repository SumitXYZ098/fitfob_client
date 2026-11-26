import React, { useState } from 'react';
import { View, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  CheckoutScreen,
  PaymentPendingStep,
  RequestDeclinedStep,
  MembershipSuccessStep,
  CheckoutDetails,
} from '@/components/modules/payAtGym';
import { usePayAtGym, useCancelPayAtGym, PayAtGymData } from '@/hook/useClient';

type StepType = 'checkout' | 'pending' | 'declined' | 'success';

export default function MembershipCheckoutRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Read params passed from GymDetail or fallback to mockup defaults
  const gymName = (params.gymName as string) || (params.title as string) || 'PowerHouse Gym';
  const gymLocation =
    (params.gymLocation as string) ||
    (params.gymAddress as string) ||
    (params.address as string) ||
    'Phase 7, Mohali';
  const planName = (params.selectedPlanName as string) || (params.planName as string) || '3–Month Pro';
  const rawPrice = params.selectedPlanPrice || params.price || '4500';
  const price =
    typeof rawPrice === 'string'
      ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 4500
      : (rawPrice as unknown as number);

  const duration = (params.duration as string) || '3 Months';

  const clubOwner =
    (params.club_owner as string) ||
    (params.clubOwner as string) ||
    (params.clubOwnerId as string) ||
    (params.ownerId as string) ||
    (params.gymId as string) ||
    '';

  const planPriceId =
    (params.membership_plan_price as string) ||
    (params.planDocumentId as string) ||
    (params.selectedPlanId as string) ||
    (params.planId as string) ||
    (params.planKey as string) ||
    (params.duration as string) ||
    '';

  const initialMode = (params.initialMode as 'online' | 'gym') || 'gym';

  const [currentStep, setCurrentStep] = useState<StepType>(() => {
    if (params.initialStep && ['checkout', 'pending', 'declined', 'success'].includes(params.initialStep as string)) {
      return params.initialStep as StepType;
    }
    return 'checkout';
  });

  const [lastPaymentMethod] = useState<'Online (UPI)' | 'Verified by Gym'>('Verified by Gym');
  const [pendingData, setPendingData] = useState<PayAtGymData | null>(null);

  const { mutate: payAtGym, isPending: isPayingAtGym } = usePayAtGym();
  const { mutate: cancelPayAtGym, isPending: isCancellingPayAtGym } = useCancelPayAtGym();

  const details: CheckoutDetails = {
    gymName: pendingData?.gymName || gymName,
    gymLocation: pendingData?.gymAddress || gymLocation,
    planName: pendingData?.planName || planName,
    price: pendingData?.amountDue !== undefined ? pendingData.amountDue : price,
    duration,
  };

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
    if (!clubOwner) {
      Toast.show({
        type: 'error',
        text1: 'Gym Information Missing',
        text2: 'Unable to identify the gym owner. Please return and select the gym again.',
      });
      return;
    }

    if (!planPriceId) {
      Toast.show({
        type: 'error',
        text1: 'Plan Information Missing',
        text2: 'Please select a valid membership plan.',
      });
      return;
    }

    payAtGym(
      {
        club_owner: clubOwner,
        membership_plan_price: planPriceId,
      },
      {
        onSuccess: (res) => {
          if (res?.data) {
            setPendingData(res.data);
          }
          Toast.show({
            type: 'success',
            text1: 'Request Submitted! 📩',
            text2:
              res?.message ||
              'Please visit the gym reception to pay via Cash or UPI and activate your pass.',
          });
          setCurrentStep('pending');
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            'Failed to submit payment request. Please try again.';
          Toast.show({
            type: 'error',
            text1: 'Request Failed',
            text2: errMsg,
          });
        },
      }
    );
  };

  const formatRequestDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const handleViewDirections = () => {
    const query = encodeURIComponent(`${details.gymName} ${details.gymLocation}`);
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(mapUrl).catch(() => {
      Toast.show({
        type: 'info',
        text1: 'Directions',
        text2: `Opening directions to ${details.gymName}`,
      });
    });
  };

  const handleCancelRequest = (explicitDocId?: string | number) => {
    const docId =
      explicitDocId ||
      pendingData?.documentId ||
      pendingData?.id ||
      (params.documentId as string) ||
      (params.payAtGymDocumentId as string) ||
      '';

    if (!docId) {
      Toast.show({
        type: 'info',
        text1: 'Request Cancelled',
        text2: 'Your pay-at-gym request was cancelled',
      });
      setCurrentStep('checkout');
      return;
    }

    Alert.alert(
      'Cancel Payment Request',
      'Are you sure you want to cancel your pay-at-gym request?',
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelPayAtGym(docId, {
              onSuccess: (res) => {
                Toast.show({
                  type: 'success',
                  text1: 'Request Cancelled',
                  text2: res?.message || 'Your pay-at-gym request was cancelled successfully.',
                });
                setPendingData(null);
                setCurrentStep('declined');
              },
              onError: (err: any) => {
                const errMsg =
                  err?.response?.data?.error?.message ||
                  err?.response?.data?.message ||
                  err?.message ||
                  'Failed to cancel request. Please try again.';
                Toast.show({
                  type: 'error',
                  text1: 'Cancellation Failed',
                  text2: errMsg,
                });
              },
            });
          },
        },
      ]
    );
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
            isLoading={isPayingAtGym}
            onPayOnline={handlePayOnline}
            onPayAtGym={handlePayAtGym}
            onBack={handleBack}
          />
        )}

        {currentStep === 'pending' && (
          <PaymentPendingStep
            details={details}
            requestDate={formatRequestDate(pendingData?.requestedAt)}
            isCancelling={isCancellingPayAtGym}
            onViewDirections={handleViewDirections}
            onCancelRequest={handleCancelRequest}
            onBack={handleBack}
          />
        )}

        {currentStep === 'declined' && (
          <RequestDeclinedStep
            details={details}
            onSendNewRequest={() => router.push('/(tabs)' as any)}
            onBack={() => router.push('/(tabs)' as any)}
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
