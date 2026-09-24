import {
  View,
  Text,
  ImageBackground,
  Dimensions,
  Pressable,
  FlatList,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface SlideData {
  id: string;
  image: any;
  badge: string;
  badgeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  quote: string;
  subtitle: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    image: require('../assets/images/welcome1.png'),
    badge: 'DAILY MOTIVATION',
    badgeIcon: 'fire',
    title: 'Discipline Over Motivation',
    quote: 'When motivation fades, discipline is what keeps you moving forward.',
    subtitle: 'Show up every single day. Your future self will thank you.',
  },
  {
    id: '2',
    image: require('../assets/images/welcome2.png'),
    badge: 'STRENGTH & POWER',
    badgeIcon: 'arm-flex',
    title: 'Break Every Barrier',
    quote: "The body achieves what the mind believes. Don't stop until you're proud.",
    subtitle: 'Push past your comfort zone. Strength is built in the struggle.',
  },
  {
    id: '3',
    image: require('../assets/images/welcome3.png'),
    badge: 'CHAMPION MINDSET',
    badgeIcon: 'lightning-bolt',
    title: 'Mind Over Muscle',
    quote: 'The pain you feel today will be the strength you feel tomorrow.',
    subtitle: 'Conquer the mental resistance and your body will follow.',
  },
  {
    id: '4',
    image: require('../assets/images/welcome1.png'),
    badge: 'CONSISTENCY IS KEY',
    badgeIcon: 'trophy',
    title: 'Every Rep Counts',
    quote: 'Small daily disciplines repeated with consistency lead to greatness.',
    subtitle: 'Stay committed to the process and celebrate every bit of progress.',
  },
  {
    id: '5',
    image: require('../assets/images/welcome2.png'),
    badge: 'UNSTOPPABLE WILL',
    badgeIcon: 'crown',
    title: 'Own Your Greatness',
    quote: "Don't count the days, make every single workout count.",
    subtitle: 'You are one workout away from a better, stronger version of you.',
  },
];

// Create loop data
const loopSlides = [SLIDES[SLIDES.length - 1], ...SLIDES, SLIDES[0]];

const { width } = Dimensions.get('window');

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(1);
  const ref = useRef<FlatList>(null);

  // Animated values for motivational card transition
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Active slide index (0 to SLIDES.length - 1)
  const activeIndex = (index - 1 + SLIDES.length) % SLIDES.length;
  const currentSlide = SLIDES[activeIndex] || SLIDES[0];

  // ⏱ Autoplay carousel
  useEffect(() => {
    const interval = setInterval(() => {
      ref.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [index]);

  // ✨ Animate motivational quote on slide change
  useEffect(() => {
    fadeAnim.setValue(0.2);
    translateYAnim.setValue(10);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, fadeAnim, translateYAnim]);

  // 🔁 Handle seamless looping
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentIndex = Math.round(e.nativeEvent.contentOffset.x / width);

    if (currentIndex === 0) {
      ref.current?.scrollToIndex({
        index: SLIDES.length,
        animated: false,
      });
      setIndex(SLIDES.length);
    } else if (currentIndex === loopSlides.length - 1) {
      ref.current?.scrollToIndex({
        index: 1,
        animated: false,
      });
      setIndex(1);
    } else {
      setIndex(currentIndex);
    }
  };

  const handleDotPress = (dotIndex: number) => {
    const target = dotIndex + 1;
    ref.current?.scrollToIndex({
      index: target,
      animated: true,
    });
    setIndex(target);
  };

  return (
    <View className="flex-1 bg-black">
      {/* Background Image Carousel */}
      <FlatList
        ref={ref}
        data={loopSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={1}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={onScrollEnd}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <ImageBackground source={item.image} style={{ width, height: '100%' }} resizeMode="cover" />
        )}
      />

      {/* Overlay UI */}
      <View className="absolute inset-0 h-full">
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.5)',
            'rgba(0,0,0,0.1)',
            'rgba(0,0,0,0.55)',
            'rgba(0,0,0,0.92)',
            '#000000',
          ]}
          locations={[0, 0.28, 0.52, 0.78, 1]}
          style={{
            height: '100%',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: Math.max(insets.top + 16, 54),
            paddingBottom: Math.max(insets.bottom + 16, 28),
          }}>
          {/* Header: Logo & Indicators */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Image
                source={require('../assets/images/logoVector.png')}
                className="h-[46px] w-[46px]"
                resizeMode="contain"
              />
              {/* <Text className="font-bold text-xl tracking-wide text-white">fitfob</Text> */}
            </View>

            {/* Interactive Indicators */}
            <View className="flex-row items-center">
              {SLIDES.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleDotPress(i)}
                  hitSlop={8}
                  className={`mr-1.5 h-2 rounded-full ${i === activeIndex ? 'w-7 bg-primary' : 'w-2 bg-white/40'
                    }`}
                />
              ))}
            </View>
          </View>

          {/* Bottom Area: Motivational Thought + CTA Buttons */}
          <View>
            {/* Motivational Thought Section (Clean, No Card BG) */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              }}
              className="mb-8">
              {/* Badge & Quote Icon */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 rounded-full border border-primary/70 px-3 py-1">
                  <MaterialCommunityIcons name={currentSlide.badgeIcon} size={13} color="#E23744" />
                  <Text className="font-bold text-[11px] uppercase tracking-wider text-primary">
                    {currentSlide.badge}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="format-quote-open"
                  size={26}
                  color="rgba(255, 255, 255, 0.4)"
                />
              </View>

              {/* Thought Title */}
              <Text className="mt-3 font-bold text-3xl leading-tight text-white">
                {currentSlide.title}
              </Text>

              {/* Motivational Quote */}
              <Text className="mt-2 font-medium text-base leading-snug text-white/90">
                "{currentSlide.quote}"
              </Text>

              {/* Subtitle / Tip */}
              <Text className="mt-2 font-sans text-xs leading-relaxed text-white/60">
                {currentSlide.subtitle}
              </Text>
            </Animated.View>

            {/* Action Buttons */}
            <Pressable
              onPress={() => router.push('/auth/Login')}
              className="mb-3 rounded-2xl border border-primary bg-primary py-4 active:opacity-90">
              <Text className="text-center font-bold text-base leading-base text-background">
                Login
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/auth/SignUp')}
              className="mb-6 rounded-2xl border border-white py-4 active:opacity-80">
              <Text className="text-center font-bold text-base leading-base text-background">
                Sign Up
              </Text>
            </Pressable>

            {/* Footer Terms */}
            <View className="items-center">
              <Text className="font-sans text-xs text-white/60">
                By proceeding, you agree to our
              </Text>
              <View className="mt-1 flex-row items-center">
                <Pressable
                  onPress={() => router.push('/support/terms' as any)}
                  hitSlop={8}
                  className="active:opacity-60">
                  <Text className="text-xs font-semibold text-[#E23744] underline">
                    Terms of Service
                  </Text>
                </Pressable>
                <Text className="mx-1.5 font-sans text-xs text-white/50">and</Text>
                <Pressable
                  onPress={() => router.push('/support/privacy' as any)}
                  hitSlop={8}
                  className="active:opacity-60">
                  <Text className="text-xs font-semibold text-[#E23744] underline">
                    Privacy Policy
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

