import { View, Text, ImageBackground, Image } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import Entypo from '@expo/vector-icons/Entypo';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAuthStore } from '@/store/useAuthStore';

export default function Splash() {
  const router = useRouter();
  const { user, isInitializing } = useAuthStore();

  // Logo animation values
  const translateY = useSharedValue(40);
  const logoOpacity = useSharedValue(0);

  // Text animation value
  const textOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  useEffect(() => {
    // Logo comes up
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    logoOpacity.value = withTiming(1, {
      duration: 500,
    });

    // Text fades slightly after
    textOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });

    const t = setTimeout(() => {
      if (isInitializing) return;

      if (!user) {
        router.replace('/welcome');
      } else {
        if (user.verification_status === 'in-review') {
          router.replace('/onBoardingScreen/UnderReview');
        } else if (user.verification_status === 'pending') {
          router.replace('/onBoardingScreen/OnBoardingStep');
        } else {
          router.replace('/(tabs)');
        }
      }
    }, 1500);

    return () => clearTimeout(t);
  }, [isInitializing, logoOpacity, router, textOpacity, translateY, user]);

  return (
    <ImageBackground
      source={require('../assets/images/splash-grid.png')}
      className="flex-1 items-center justify-center bg-primary px-6"
      resizeMode="cover">
      {/* Logo + Title */}
      <View className="items-center justify-center gap-4">
        <Animated.View style={logoStyle}>
          <Image
            source={require('../assets/images/logoVector.png')}
            className="h-[117px] w-[117px]"
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          style={textStyle}
          className="font-bold text-[40px] leading-[44px] text-background">
          fitfob
        </Animated.Text>
      </View>

      {/* Quote Card */}
      <View className="absolute bottom-20 flex w-full flex-col items-start gap-2 rounded-2xl bg-background px-5 py-4">
        <Entypo name="quote" size={24} className="scale-x-[-1]" color="red" />
        <Text className="font-sans text-sm leading-snug text-darkText">
          Every rep takes you closer.
        </Text>
      </View>
    </ImageBackground>
  );
}
