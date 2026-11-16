import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GymDetailMapView from '@/components/modules/GymDetailMapView';

export interface GymCoordinate {
  latitude: number;
  longitude: number;
}

interface GymWhereYouWillBeSectionProps {
  title: string;
  address?: string;
  coordinate?: GymCoordinate;
  userLocation?: { latitude: number; longitude: number } | null;
  onGetDirections?: () => void;
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

export default function GymWhereYouWillBeSection({
  title,
  address,
  coordinate,
  userLocation,
  onGetDirections,
  isDetailFetching = false,
}: GymWhereYouWillBeSectionProps) {
  const router = useRouter();

  const hasValidCoordinates = Boolean(
    coordinate?.latitude &&
    coordinate?.longitude &&
    coordinate.latitude !== 0 &&
    coordinate.longitude !== 0
  );

  const handleDirections = () => {
    if (onGetDirections) {
      onGetDirections();
      return;
    }

    if (!coordinate || !hasValidCoordinates) return;
    const lat = coordinate.latitude;
    const lng = coordinate.longitude;
    const encodedName = encodeURIComponent(title);

    const googleMapsAppUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
    });

    const nativeMapScheme = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${encodedName}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
    });

    const webGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    (async () => {
      try {
        if (googleMapsAppUrl && (await Linking.canOpenURL(googleMapsAppUrl))) {
          await Linking.openURL(googleMapsAppUrl);
          return;
        }
      } catch {}

      try {
        if (nativeMapScheme && (await Linking.canOpenURL(nativeMapScheme))) {
          await Linking.openURL(nativeMapScheme);
          return;
        }
      } catch {}

      try {
        await Linking.openURL(webGoogleMapsUrl);
      } catch {}
    })();
  };

  if (!hasValidCoordinates) {
    if (isDetailFetching) {
      return (
        <View className="mt-6">
          <SkeletonBox style={{ height: 18, width: 130, borderRadius: 4, marginBottom: 12 }} />
          <SkeletonBox style={{ height: 260, width: '100%', borderRadius: 10 }} />
        </View>
      );
    }
    return null;
  }

  return (
    <View className="mt-6">
      {/* ─── Header: Where you'll be + Directions Button ─────────────────── */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-bold text-base text-slate-900">Where you&apos;ll be</Text>
          {Boolean(address) && (
            <Text className="mt-1 font-medium text-xs text-slate-500" numberOfLines={2}>
              {address}
            </Text>
          )}
        </View>

        {/* Right Side Directions Button */}
        <TouchableOpacity
          onPress={handleDirections}
          activeOpacity={0.85}
          className="flex-row items-center gap-1.5 rounded-xl border border-[#E23744]/25 bg-[#FFEAEF] px-3.5 py-2 shadow-xs">
          <Ionicons name="navigate" size={14} color="#E23744" />
          <Text className="font-bold text-xs text-[#E23744]">Directions</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Live Interactive Dedicated Gym Map ─────────────────────────── */}
      <View
        className="mt-3 overflow-hidden rounded-[10px] border border-slate-200 shadow-sm"
        style={{ height: 260 }}>
        <GymDetailMapView
          title={title}
          address={address || ''}
          coordinate={coordinate!}
          userLocation={userLocation}
          height={260}
          onGetDirections={handleDirections}
          onOpenAllGymsMap={() => router.push('/gym/Mapviewscreen' as any)}
        />
      </View>
    </View>
  );
}
