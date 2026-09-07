import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Container } from '@/components/modules/Container';
import { Button } from '@/components/modules/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useCheckUserStep } from '@/hook/useClient';

export default function UnderReview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string; reason?: string }>();
  const { user, setUser, logOut } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const checkStatusMutation = useCheckUserStep();

  // Verification status and rejection reason state
  const [verificationStatus, setVerificationStatus] = useState<string>(
    params.status || user?.verification_status || 'in-review'
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(
    params.reason || user?.rejection_reason || null
  );

  const isRejected =
    verificationStatus === 'rejected' ||
    verificationStatus === 'declined' ||
    verificationStatus === 'failed' ||
    verificationStatus === 'mismatch' ||
    verificationStatus === 'in-review'
    Boolean(rejectionReason);

  const checkVerificationStatus = async (showToast = true) => {
    try {
      const userData = await checkStatusMutation.mutateAsync();
      if (userData) {
        const userDetails = userData?.details?.user;
        const currentStatus =
          userData?.verification_status ||
          userDetails?.verification_status ||
          userData?.status;
        const reason =
          userData?.rejection_reason ||
          userDetails?.rejection_reason ||
          userData?.details?.rejection_reason ||
          (userData?.details?.documentVerified === false &&
          (currentStatus === 'rejected' || currentStatus === 'failed')
            ? 'Face recognition photo did not match the uploaded Government ID.'
            : null);

        if (user) {
          await setUser({
            ...user,
            verification_status: currentStatus,
            rejection_reason: reason,
          });
        }

        if (currentStatus === 'approved') {
          if (showToast) {
            Toast.show({
              type: 'success',
              text1: 'Verification Approved! 🎉',
              text2: 'Welcome to FitFob.',
            });
          }
          router.replace('/onBoardingScreen/Congratulations');
          return true;
        }

        if (
          currentStatus === 'rejected' ||
          currentStatus === 'declined' ||
          currentStatus === 'failed' ||
          currentStatus === 'mismatch' ||
          currentStatus === 'in-review' ||
          Boolean(reason)
        ) {
          setVerificationStatus('rejected');
          setRejectionReason(
            reason || 'Face recognition photo does not match the uploaded Government ID.'
          );
          if (showToast) {
            Toast.show({
              type: 'error',
              text1: 'Verification Failed',
              text2: reason || 'Face photo and Government ID did not match.',
            });
          }
          return false;
        } else {
          setVerificationStatus('in-review');
          setRejectionReason(null);
          if (showToast) {
            Toast.show({
              type: 'info',
              text1: 'Still Under Review ⏳',
              text2: 'Your account review is still in progress.',
            });
          }
        }
      }
      return false;
    } catch (error) {
      console.log('Error checking status:', error);
      if (showToast) {
        Toast.show({
          type: 'error',
          text1: 'Status Check Failed',
          text2: 'Unable to verify status. Please try again.',
        });
      }
      return false;
    }
  };

  useEffect(() => {
    if (params.status) {
      setVerificationStatus(params.status);
    }
    if (params.reason) {
      setRejectionReason(params.reason);
    }
    // Check status automatically on mount
    checkVerificationStatus(false);
  }, [params.status, params.reason]);

  const handleDone = async () => {
    setLoading(true);
    try {
      await checkVerificationStatus(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await checkVerificationStatus(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleUploadNewId = () => {
    router.replace({
      pathname: '/onBoardingScreen/OnBoardingStep',
      params: {
        step: '5',
        reupload: 'govId',
      },
    });
  };

  const handleRetakeSelfie = () => {
    router.replace({
      pathname: '/onBoardingScreen/OnBoardingStep',
      params: {
        step: '4',
        reupload: 'selfie',
      },
    });
  };

  return (
    <Container>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F6163C']} />
        }>
        <View className="flex-1 bg-white">

          {isRejected ? (
            /* --- REJECTED / MISMATCH STATE --- */
            <View className="flex-1 items-center justify-center px-4 py-6">
              {/* Alert Icon Badge */}
              <View className="relative mb-5">
                <View className="h-28 w-28 items-center justify-center rounded-full bg-red-50 border-4 border-red-100">
                  <MaterialCommunityIcons name="face-recognition" size={54} color="#F6163C" />
                </View>
                <View className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full bg-[#F6163C] border-2 border-white shadow-md">
                  <Ionicons name="close" size={20} color="white" />
                </View>
              </View>

              {/* Status Pill */}
              <View className="mb-3 flex-row items-center rounded-full bg-red-50 border border-red-200 px-4 py-1">
                <View className="mr-2 h-2 w-2 rounded-full bg-[#F6163C]" />
                <Text className="font-bold text-xs uppercase tracking-wider text-[#F6163C]">
                  Verification Mismatch
                </Text>
              </View>

              {/* Title Area */}
              <Text className="mb-3 text-center font-bold text-[28px] leading-tight text-slate-900">
                Face & ID Did Not Match
              </Text>

              <Text className="mb-5 text-center text-sm leading-relaxed text-slate-500">
                We could not verify your identity because your selfie and uploaded Government ID do not match. Please upload a clear Government ID to continue creating your account.
              </Text>

              {/* Rejection Reason Card */}
              <View className="mb-5 w-full rounded-2xl bg-red-50/70 border border-red-100 p-4">
                <View className="mb-1.5 flex-row items-center">
                  <Ionicons name="alert-circle" size={18} color="#F6163C" />
                  <Text className="ml-2 font-bold text-xs uppercase tracking-wider text-[#F6163C]">
                    Rejection Reason
                  </Text>
                </View>
                <Text className="text-[13px] font-medium leading-relaxed text-slate-800">
                  {rejectionReason || 'Face recognition photo did not match the uploaded Government ID.'}
                </Text>
              </View>

              {/* Tips Checklist Card */}
              <View className="mb-6 w-full rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <Text className="mb-2.5 font-bold text-xs uppercase tracking-wider text-slate-700">
                  Tips for your next upload:
                </Text>
                <View className="mb-2 flex-row items-start">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 1 }} />
                  <Text className="ml-2 flex-1 text-xs text-slate-600 leading-relaxed">
                    Upload a valid Government ID (Passport, Driving License, National ID).
                  </Text>
                </View>
                <View className="mb-2 flex-row items-start">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 1 }} />
                  <Text className="ml-2 flex-1 text-xs text-slate-600 leading-relaxed">
                    Ensure your face photo on the ID is sharp, glare-free, and unobstructed.
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 1 }} />
                  <Text className="ml-2 flex-1 text-xs text-slate-600 leading-relaxed">
                    Make sure the selfie and Government ID belong to the exact same person.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="w-full gap-3">
                <Button
                  title="Upload New Government ID"
                  onPress={handleUploadNewId}
                  loading={loading}
                />

                <TouchableOpacity
                  onPress={handleRetakeSelfie}
                  disabled={loading}
                  className="w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
                  activeOpacity={0.8}>
                  <Text className="font-bold text-sm text-slate-700">Retake Selfie & ID</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDone}
                  disabled={loading}
                  className="mt-1 items-center justify-center py-2"
                  activeOpacity={0.7}>
                  <Text className="font-semibold text-xs text-slate-400">
                    Pull down or tap to re-check status
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* --- IN-REVIEW STATE --- */
            <View className="-mt-12 flex-1 items-center justify-center px-4">
              {/* Title Area */}
              <Text className="mb-4 text-center font-bold text-[30px] leading-tight text-slate-900">
                We’re reviewing your submission
              </Text>
              <Text className="mb-12 text-center text-sm leading-relaxed text-slate-400">
                We need more time to verify your identity. Pull down to refresh status at any time.
              </Text>

              {/* Megaphone Icon */}
              <Image source={require('../../assets/images/reviewing.png')} className="h-31 w-31" />

              {/* Done Button */}
              <View className="mb-8 mt-12 w-full">
                <Button title="Check Status" onPress={handleDone} loading={loading} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
