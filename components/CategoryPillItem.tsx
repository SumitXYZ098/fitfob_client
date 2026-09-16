import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, Easing, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CategoryOption {
  id: string;
  name: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'Gyms', name: 'Gyms', iconActive: 'barbell', iconInactive: 'barbell-outline' },
  { id: 'Yoga', name: 'Yoga', iconActive: 'body', iconInactive: 'body-outline' },
  { id: 'Boxing', name: 'Boxing', iconActive: 'flame', iconInactive: 'flame-outline' },
  { id: 'Dance', name: 'Dance', iconActive: 'musical-notes', iconInactive: 'musical-notes-outline' },
  { id: 'Crossfit', name: 'CrossFit', iconActive: 'trophy', iconInactive: 'trophy-outline' },
  { id: 'Zumba', name: 'Zumba', iconActive: 'heart', iconInactive: 'heart-outline' },
  { id: 'Pilates', name: 'Pilates', iconActive: 'leaf', iconInactive: 'leaf-outline' },
];

export interface CategoryPillItemProps {
  cat: CategoryOption;
  isSelected: boolean;
  onPress: () => void;
  animTrigger: number;
}

export default function CategoryPillItem({
  cat,
  isSelected,
  onPress,
  animTrigger,
}: CategoryPillItemProps) {
  // 1. Smooth Color & Surface Transition Animation (250ms cubic ease)
  const selectAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const backgroundColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#E23744'],
  });

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#E23744'],
  });

  const textColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#334155', '#FFFFFF'],
  });

  const shadowOpacity = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.35],
  });

  // 2. Strict Under-2-Second Wiggle Animation (Strictly <= 1.8s total, stops cleanly)
  const animScale = useRef(new Animated.Value(1)).current;
  const animRotate = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(0)).current;
  const currentAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // If not selected, cancel immediately and reset
    if (!isSelected || animTrigger <= 0) {
      if (currentAnim.current) {
        currentAnim.current.stop();
      }
      animScale.setValue(1);
      animTranslateY.setValue(0);
      animRotate.setValue(0);
      return;
    }

    // Stop any previous running animation
    if (currentAnim.current) {
      currentAnim.current.stop();
    }
    animScale.setValue(1);
    animRotate.setValue(0);
    animTranslateY.setValue(0);

    // Single 400ms wiggle cycle (runs 4 times = 1600ms)
    const singleCycle = Animated.sequence([
      Animated.parallel([
        Animated.timing(animScale, { toValue: 1.25, duration: 100, useNativeDriver: true }),
        Animated.timing(animTranslateY, { toValue: -2.5, duration: 100, useNativeDriver: true }),
        Animated.timing(animRotate, { toValue: 1, duration: 100, useNativeDriver: true }), // +18deg
      ]),
      Animated.parallel([
        Animated.timing(animScale, { toValue: 1.12, duration: 100, useNativeDriver: true }),
        Animated.timing(animTranslateY, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(animRotate, { toValue: -1, duration: 100, useNativeDriver: true }), // -18deg
      ]),
      Animated.parallel([
        Animated.timing(animScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(animTranslateY, { toValue: -1.5, duration: 100, useNativeDriver: true }),
        Animated.timing(animRotate, { toValue: 0.7, duration: 100, useNativeDriver: true }), // +12deg
      ]),
      Animated.parallel([
        Animated.timing(animScale, { toValue: 1.06, duration: 100, useNativeDriver: true }),
        Animated.timing(animTranslateY, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(animRotate, { toValue: -0.7, duration: 100, useNativeDriver: true }), // -12deg
      ]),
    ]);

    // Total sequence = (400ms * 4) + 180ms smooth settle = 1780ms (1.78s, strictly under 2 sec!)
    const finiteAnimation = Animated.sequence([
      Animated.loop(singleCycle, { iterations: 4 }),
      Animated.parallel([
        Animated.timing(animScale, { toValue: 1.0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(animTranslateY, { toValue: 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(animRotate, { toValue: 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]);

    currentAnim.current = finiteAnimation;
    finiteAnimation.start(({ finished }) => {
      if (finished) {
        animScale.setValue(1);
        animTranslateY.setValue(0);
        animRotate.setValue(0);
      }
    });

    // Hard cutoff safety timer at exactly 1850ms to guarantee zero lingering
    const hardCutoff = setTimeout(() => {
      if (currentAnim.current) {
        currentAnim.current.stop();
      }
      animScale.setValue(1);
      animTranslateY.setValue(0);
      animRotate.setValue(0);
    }, 1850);

    return () => {
      clearTimeout(hardCutoff);
      if (currentAnim.current) {
        currentAnim.current.stop();
      }
      animScale.setValue(1);
      animTranslateY.setValue(0);
      animRotate.setValue(0);
    };
  }, [isSelected, animTrigger]);

  const spin = animRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="mr-2.5">
      <Animated.View
        style={{
          backgroundColor,
          borderColor,
          borderWidth: 1.2,
          shadowColor: isSelected ? '#E23744' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity,
          shadowRadius: isSelected ? 6 : 2,
          elevation: isSelected ? 3 : 1,
        }}
        className="flex-row items-center rounded-full px-4 py-2">
        {/* Animated Icon container with smooth crossfade */}
        <Animated.View
          style={{
            transform: [
              { scale: animScale },
              { translateY: animTranslateY },
              { rotate: spin },
            ],
          }}>
          <View className="relative h-4 w-4 items-center justify-center">
            {/* Inactive Icon (fades out smoothly) */}
            <Animated.View
              style={{
                position: 'absolute',
                opacity: selectAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }}>
              <Ionicons name={cat.iconInactive} size={16} color="#6B7280" />
            </Animated.View>

            {/* Active Icon (fades in smoothly) */}
            <Animated.View
              style={{
                position: 'absolute',
                opacity: selectAnim,
              }}>
              <Ionicons name={cat.iconActive} size={16} color="#FFFFFF" />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Animated Text Label (color smoothly transitions) */}
        <Animated.Text
          style={{ color: textColor }}
          className="ml-1.5 text-sm font-semibold">
          {cat.name}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
