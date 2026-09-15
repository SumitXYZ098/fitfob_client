import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { Container } from '@/components/modules/Container';
import { useGetQr } from '@/hook/useClient';

export default function ScanScreen() {
  const router = useRouter();
  const getQrMutation = useGetQr();
  const { isPending, data } = getQrMutation;
  const [refreshing, setRefreshing] = useState(false);

  const USER_ID = data?.data?.clientId || 'N/A';
  const isLoading = isPending || refreshing;

  const handleReload = useCallback(async () => {
    try {
      await getQrMutation.mutateAsync();
    } catch (error) {
      console.error('Error reloading QR:', error);
    }
  }, [getQrMutation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getQrMutation.mutateAsync();
    } catch (error) {
      console.error('Error refreshing QR:', error);
    } finally {
      setRefreshing(false);
    }
  }, [getQrMutation]);

  useEffect(() => {
    handleReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyId = async () => {
    if (!USER_ID || USER_ID === 'N/A') return;
    await Clipboard.setStringAsync(USER_ID);
    Toast.show({
      type: 'success',
      text1: 'ID Copied',
      text2: 'User ID copied to clipboard!',
    });
  };

  return (
    <Container>
      {/* 1. Header */}
      <View className="flex-row items-center justify-between pb-2 pt-2">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="h-10 w-10 items-center justify-center rounded-full">
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-bold text-lg text-darkText">Check In</Text>

        <TouchableOpacity
          onPress={() => router.push('/account/notifications' as any)}
          className="h-10 w-10 items-center justify-center rounded-full">
          <Ionicons name="notifications" size={20} color="#E23744" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F6163C']} />
        }
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: Platform.OS === 'ios' ? 100 : 80,
        }}>
        {/* 2. Subtitle Instruction */}
        <Text className="font-regular max-w-[280px] text-center text-base leading-snug text-[#64748B]">
          Scan code at the gym’s entrance to check in.
        </Text>

        {/* 3. QR Code Display / Loading Animation */}
        <View className="my-8 h-[260px] w-[260px] items-center justify-center rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
          {isLoading ? (
            <View className="items-center justify-center">
              <ActivityIndicator size="large" color="#F6163C" />
              <Text className="mt-3 font-medium text-xs text-slate-400">Loading QR Code...</Text>
            </View>
          ) : data?.data?.qrCode ? (
            <Image
              source={{ uri: data.data.qrCode }}
              style={{ width: 240, height: 240 }}
              resizeMode="contain"
            />
          ) : (
            <View className="items-center justify-center px-4">
              <Ionicons name="qr-code-outline" size={64} color="#CBD5E1" />
              <Text className="mt-2 text-center text-xs text-slate-400">
                Tap reload below to generate QR Code
              </Text>
            </View>
          )}
        </View>

        {/* 4. Action Button - Reload QR Code */}
        <TouchableOpacity
          onPress={handleReload}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-4 shadow-sm">
          <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
          <Text className="ml-2 font-bold text-base text-white">
            {isLoading ? 'Reloading...' : 'Reload QR Code'}
          </Text>
        </TouchableOpacity>

        {/* 5. Trouble scanning / ID Section */}
        <Text className="font-regular mb-3 mt-6 text-center text-sm text-[#64748B]">
          Trouble scanning? Use your ID below
        </Text>

        <View className="w-full flex-row items-center justify-between rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] px-5 py-3.5">
          <Text className="font-medium text-base text-[#475569]">
            ID: <Text className="font-semibold text-darkText">{USER_ID}</Text>
          </Text>

          <TouchableOpacity
            onPress={handleCopyId}
            disabled={!USER_ID || USER_ID === 'N/A'}
            className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFEAEF]">
            <MaterialCommunityIcons name="content-copy" size={18} color="#F6163C" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}
