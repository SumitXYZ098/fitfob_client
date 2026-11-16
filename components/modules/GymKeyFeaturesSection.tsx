import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface AmenityItem {
  name: string;
  icon: string;
  library?: string;
}

interface GymKeyFeaturesSectionProps {
  amenities: AmenityItem[];
  isDetailFetching?: boolean;
}

function SkeletonBox({ style }: { style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={[{ backgroundColor: '#E2E8F0', opacity }, style]}
    />
  );
}

export default function GymKeyFeaturesSection({
  amenities,
  isDetailFetching = false,
}: GymKeyFeaturesSectionProps) {
  const [showAllAmenities, setShowAllAmenities] = useState<boolean>(false);

  const handleToggle = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {}
    setShowAllAmenities((prev) => !prev);
  };

  if (!amenities || amenities.length === 0) {
    if (isDetailFetching) {
      return (
        <View className="mt-6">
          <SkeletonBox style={{ height: 18, width: 120, borderRadius: 4, marginBottom: 12 }} />
          <View className="flex-row flex-wrap gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((_, idx) => (
              <View
                key={idx}
                className="w-[48%] flex-row items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 px-3.5 py-3">
                <SkeletonBox style={{ height: 20, width: 20, borderRadius: 10 }} />
                <SkeletonBox style={{ height: 14, width: '60%', borderRadius: 4 }} />
              </View>
            ))}
          </View>
        </View>
      );
    }
    return null;
  }

  const displayedAmenities = showAllAmenities ? amenities : amenities.slice(0, 10);

  return (
    <View className="mt-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-bold text-base text-slate-900">Key Features</Text>
      </View>

      {/* Grid of Amenities (2 columns) */}
      <View className="flex-row flex-wrap gap-2.5">
        {displayedAmenities.map((item, idx) => (
          <View
            key={idx}
            className="w-[48%] flex-row items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 px-3.5 py-3">
            <Ionicons name={(item.icon as any) || 'checkmark-circle-outline'} size={18} color="#E23744" />
            <Text className="font-semibold text-xs text-slate-800 flex-1" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Show More / Show Less Toggle Button */}
      {amenities.length > 10 && (
        <TouchableOpacity
          onPress={handleToggle}
          activeOpacity={0.75}
          className="mt-3.5 flex-row items-center justify-center gap-1.5 rounded-2xl border border-rose-100 bg-rose-50/70 py-3 shadow-sm">
          <Text className="text-xs font-bold text-[#E23744]">
            {showAllAmenities
              ? 'Show Less'
              : `View All ${amenities.length} Features (+${amenities.length - 10} more)`}
          </Text>
          <Ionicons
            name={showAllAmenities ? 'chevron-up' : 'chevron-down'}
            size={15}
            color="#E23744"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
