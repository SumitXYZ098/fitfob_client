import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Button } from '@/components/modules/Button';
import { Container } from '@/components/modules/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import BasicDetails from '@/components/screens/OnBoardingScreens/BasicDetails';
import BodyInfo from '@/components/screens/OnBoardingScreens/BodyInfo';
import LocationScreen from '@/components/screens/OnBoardingScreens/LocationScreen';
import SelfieScreen from '@/components/screens/OnBoardingScreens/SelfieScreen';
import GovernmentId from '@/components/screens/OnBoardingScreens/GovernmentId';
import { useClientSubmit, useCheckUserStep } from '@/hook/useClient';
import { useAuthStore } from '@/store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

export default function OnBoardingStep() {
  const router = useRouter();
  const { step: paramStep, reupload } = useLocalSearchParams<{ step?: string; reupload?: string }>();
  const [step, setStep] = useState(paramStep ? Number(paramStep) : 1);
  const [loading, setLoading] = useState(false);
  const [checkingStep, setCheckingStep] = useState(true);

  // Refs for each step screen
  const basicDetailsRef = useRef<any>(null);
  const bodyInfoRef = useRef<any>(null);
  const locationRef = useRef<any>(null);
  const selfieRef = useRef<any>(null);
  const govIdRef = useRef<any>(null);

  // Selfie & ID states
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [govIdUri, setGovIdUri] = useState<string | null>(null);

  const { user, setUser, logOut } = useAuthStore();
  const verifyClient = useClientSubmit();
  const checkUserStepMutation = useCheckUserStep();

  const [prefillData, setPrefillData] = useState<any>(null);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const response = await checkUserStepMutation.mutateAsync();
        if (response) {
          if (response.status === 'completed') {
            router.replace('/(tabs)');
            return;
          }
          if (response.details) {
            setPrefillData(response.details);

            // Prefill local state selfieUri and govIdUri if present in response (skip if reupload requested)
            if (response.details.selfieUpload?.url && reupload !== 'selfie') {
              const url = response.details.selfieUpload.url;
              setSelfieUri(
                url.startsWith('http') ? url : `${process.env.EXPO_PUBLIC_API_URL}${url}`
              );
            }
            if (
              response.details.governmentId?.url &&
              reupload !== 'govId' &&
              reupload !== 'selfie'
            ) {
              const url = response.details.governmentId.url;
              setGovIdUri(
                url.startsWith('http') ? url : `${process.env.EXPO_PUBLIC_API_URL}${url}`
              );
            }
          }
          if (paramStep) {
            setStep(Number(paramStep));
          } else if (response.currentStep) {
            setStep(response.currentStep);
          }
        }
      } catch (error) {
        console.error('Error fetching onboarding step progress:', error);
      } finally {
        setCheckingStep(false);
      }
    };

    checkProgress();
  }, [router, paramStep]);

  const handleNext = async () => {
    setLoading(true);
    try {
      if (step === 1) {
        const success = await basicDetailsRef.current?.submit();
        if (success) setStep(2);
      } else if (step === 2) {
        const success = await bodyInfoRef.current?.submit();
        if (success) setStep(3);
      } else if (step === 3) {
        const success = await locationRef.current?.submit();
        if (success) setStep(4);
      } else if (step === 4) {
        if (!selfieUri) {
          // Trigger camera capture in SelfieScreen
          await selfieRef.current?.takePhoto();
        } else {
          const success = await selfieRef.current?.submit();
          if (success) setStep(5);
        }
      } else if (step === 5) {
        if (!govIdUri) {
          // Trigger ID upload selection in GovernmentId
          await govIdRef.current?.uploadId();
        } else {
          // 1. Submit Gov ID (this uploads it to strapi temp-media)
          const uploadSuccess = await govIdRef.current?.submit();
          console.log('Gov ID Upload Success:', uploadSuccess);
          if (uploadSuccess) {
            // 2. Call final client verification endpoint
            const verifyResult = await verifyClient.mutateAsync();

            // 3. Update verification status in local auth store if status is returned
            if (verifyResult && user) {
              await setUser(
                {
                  ...user,
                  verification_status: verifyResult.status,
                },
                true
              );
            }

            // 4. Navigate based on approval status
            if (verifyResult && verifyResult.status === 'approved') {
              router.replace('/onBoardingScreen/Congratulations');
            } else if (
              verifyResult &&
              (verifyResult.status === 'rejected' ||
                verifyResult.status === 'declined' ||
                verifyResult.status === 'failed')
            ) {
              router.replace({
                pathname: '/onBoardingScreen/UnderReview',
                params: {
                  status: 'rejected',
                  reason:
                    verifyResult.reason ||
                    verifyResult.rejection_reason ||
                    'Face recognition photo and Government ID do not match.',
                },
              });
            } else {
              router.replace('/onBoardingScreen/UnderReview');
            }
          }
        }
      }
    } catch (error) {
      console.log('Error advancing step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await logOut();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
      });
      router.replace('/auth/Login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/welcome');
    }
  }
  const handleSignUp = async () => {
    try {
      await logOut();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
      });
      router.replace('/auth/SignUp');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/welcome');
    }
  }


  if (checkingStep) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F6163C" />
      </View>
    );
  }

  return (
    <Container>
      {/* --- FIXED PROGRESS BAR (Sticky) --- */}
      <View className=" mt-1 flex-row">
        {[1, 2, 3, 4, 5].map((item) => {
          let bgColor = ' ';
          if (item === step) bgColor = 'bg-primary border-2 border-[#FFC1C1] h-4';
          else if (item < step) bgColor = 'bg-[#FFC1C1] h-3';
          else bgColor = 'border h-3 border-border';

          return (
            <TouchableOpacity
              key={item}
              onPress={() => item < step && setStep(item)}
              disabled={item >= step || loading}
              className="mx-1 h-auto flex-1 justify-center"
              activeOpacity={0.7}>
              <View className={`w-full rounded-full ${bgColor}`} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- SCROLLABLE CONTENT --- */}
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: 'white' }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View className="mt-6 flex-1">
          {step === 1 && <BasicDetails ref={basicDetailsRef} prefill={prefillData} />}
          {step === 2 && <BodyInfo ref={bodyInfoRef} prefill={prefillData} />}
          {step === 3 && <LocationScreen ref={locationRef} prefill={prefillData} />}
          {step === 4 && (
            <SelfieScreen ref={selfieRef} selfieUri={selfieUri} setSelfieUri={setSelfieUri} />
          )}
          {step === 5 && (
            <GovernmentId ref={govIdRef} govIdUri={govIdUri} setGovIdUri={setGovIdUri} />
          )}
        </View>

        <View className="pt-6">
          <Button
            title={
              step === 4
                ? selfieUri
                  ? 'Next'
                  : 'Take Photo'
                : step === 5
                  ? govIdUri
                    ? 'Submit'
                    : 'Upload government ID'
                  : 'Next'
            }
            onPress={handleNext}
            loading={loading}
          />
        </View>

        <View className="mt-5 flex-row items-center my-2">
          <LinearGradient
            colors={['transparent', '#F6163C']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, height: 1.5 }}
          />
          <View className="px-3 flex-row items-center">
            <TouchableOpacity onPress={handleBackToLogin} activeOpacity={0.7} className="px-1 py-0.5">
              <Text className="text-xs font-bold text-[#F6163C]">Log In</Text>
            </TouchableOpacity>
            <Text className="mx-1.5 text-slate-300">|</Text>
            <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7} className="px-1 py-0.5">
              <Text className="text-xs font-bold text-[#F6163C]">Sign Up</Text>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['#F6163C', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, height: 1.5 }}
          />

        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
