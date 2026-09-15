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

  // 2. 3-Second Playful Icon Workout Animation (Jump, Bounce & Wiggle Tilt)
  const animScale = useRef(new Animated.Value(1)).current;
  const animRotate = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isSelected && animTrigger > 0) {
      if (loopRef.current) {
        loopRef.current.stop();
      }

      animScale.setValue(1);
      animRotate.setValue(0);
      animTranslateY.setValue(0);

      const animationLoop = Animated.loop(
        Animated.sequence([
          // Jump & scale up
          Animated.parallel([
            Animated.timing(animScale, {
              toValue: 1.34,
              duration: 250,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animTranslateY, {
              toValue: -3,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(animRotate, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
          // Bounce down with counter tilt
          Animated.parallel([
            Animated.timing(animScale, {
              toValue: 0.92,
              duration: 250,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animTranslateY, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(animRotate, {
              toValue: -1,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
          // Settle bounce
          Animated.parallel([
            Animated.timing(animScale, {
              toValue: 1.15,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(animTranslateY, {
              toValue: -1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(animRotate, {
              toValue: 0.5,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
          // Return to base
          Animated.parallel([
            Animated.timing(animScale, {
              toValue: 1.0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(animTranslateY, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(animRotate, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      loopRef.current = animationLoop;
      animationLoop.start();

      // Stop after exactly 3 seconds
      const timer = setTimeout(() => {
        animationLoop.stop();
        Animated.parallel([
          Animated.spring(animScale, {
            toValue: 1.0,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(animTranslateY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(animRotate, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      }, 3000);

      return () => {
        clearTimeout(timer);
        animationLoop.stop();
      };
    } else {
      if (loopRef.current) {
        loopRef.current.stop();
      }
      animScale.setValue(1);
      animTranslateY.setValue(0);
      animRotate.setValue(0);
    }
  }, [isSelected, animTrigger]);

  const spin = animRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
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
          borderWidth: 1,
          shadowColor: isSelected ? '#E23744' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity,
          shadowRadius: isSelected ? 6 : 2,
          elevation: isSelected ? 4 : 1,
        }}
        className="flex-row items-center rounded-2xl px-3.5 py-2">
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
              <Ionicons name={cat.iconInactive} size={16} color="#64748B" />
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
          className="ml-1.5 text-xs font-semibold">
          {cat.name}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
