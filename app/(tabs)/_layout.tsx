import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useCallback } from 'react';
import { Platform, View, Image, BackHandler } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabLayout() {
  const { user, isInitializing } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      router.replace('/welcome');
    } else if (user.verification_status === 'in-review') {
      router.replace('/onBoardingScreen/UnderReview');
    } else if (user.verification_status !== 'approved') {
      router.replace('/onBoardingScreen/OnBoardingStep');
    }
  }, [user, isInitializing, router]);

  // When inside tabs, pressing hardware back exits the app
  useEffect(() => {
    const onBackPress = () => {
      BackHandler.exitApp();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);
  const homeFill = require('../../assets/icons/fill_home.png');
  const homeUnfill = require('../../assets/icons/home.png');

  const passFill = require('../../assets/icons/fill_pass.png');
  const passUnfill = require('../../assets/icons/pass.png');

  const scanFill = require('../../assets/icons/fill_scan.png');
  const scanUnfill = require('../../assets/icons/scan.png');

  const historyFill = require('../../assets/icons/fill_history.png');
  const historyUnfill = require('../../assets/icons/history.png');

  const membershipFill = require('../../assets/icons/fill_membership.png');
  const membershipUnfill = require('../../assets/icons/membership.png');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#E23744',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarItemStyle: {
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: Platform.OS === 'android' ? 10 : 10,
        },
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#F3F3F6',
          elevation: 0,
          paddingTop: 10,
          position: 'absolute',
          paddingBottom: 20,
          height: 80,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-start">
              <Image
                source={focused ? homeFill : homeUnfill}
                style={{ width: 26, height: 26, marginBottom: 18 }}
                resizeMode="contain"
              />
              {focused && <View className="h-[4px] w-11 rounded-t-full bg-primary" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="outdoor-pass"
        options={{
          title: 'Outdoor pass',
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-start">
              <Image
                source={focused ? passFill : passUnfill}
                style={{ width: 26, height: 26, marginBottom: 18 }}
                resizeMode="contain"
              />
              {focused && <View className="h-[4px] w-11 rounded-t-full bg-primary" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-start">
              <Image
                source={focused ? scanFill : scanUnfill}
                style={{ width: 26, height: 26, marginBottom: 18 }}
                resizeMode="contain"
              />
              {focused && <View className="h-[4px] w-11 rounded-t-full bg-primary" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-start">
              <Image
                source={focused ? historyFill : historyUnfill}
                style={{ width: 26, height: 26, marginBottom: 18 }}
                resizeMode="contain"
              />
              {focused && <View className="h-[4px] w-11 rounded-t-full bg-primary" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="membership"
        options={{
          title: 'Membership',
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-start">
              <Image
                source={focused ? membershipFill : membershipUnfill}
                style={{ width: 26, height: 26, marginBottom: 18 }}
                resizeMode="contain"
              />
              {focused && <View className="h-[4px] w-11 rounded-t-full bg-primary" />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
