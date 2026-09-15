import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientDividerProps {
  style?: StyleProp<ViewStyle>;
  className?: string;
  height?: number;
}

export default function GradientDivider({
  style,
  className,
  height = 1,
}: GradientDividerProps) {
  return (
    <LinearGradient
      colors={[
        'rgba(203, 213, 225, 0)',
        'rgba(148, 163, 184, 0.25)',
        'rgba(100, 116, 139, 0.55)',
        'rgba(148, 163, 184, 0.25)',
        'rgba(203, 213, 225, 0)',
      ]}
      locations={[0, 0.2, 0.5, 0.8, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[{ width: '100%', height }, style]}
      className={className}
    />
  );
}
