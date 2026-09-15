import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddCardScreen() {
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('John Doe');
  const [selectedNickname, setSelectedNickname] = useState<'Personal' | 'Business' | 'Other'>('Personal');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const parts = cleaned.match(/.{1,4}/g);
    return parts ? parts.join(' ') : cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleExpiryChange = (text: string) => {
    setExpiryDate(formatExpiry(text));
  };

  const handleAddCard = () => {
    if (cardNumber.replace(/\s/g, '').length < 16) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Card Number',
        text2: 'Please enter a valid 16-digit card number',
      });
      return;
    }

    if (expiryDate.length < 5) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Expiry Date',
        text2: 'Please enter expiry date in MM/YY format',
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Card Added Successfully! 💳',
      text2: `Card ending in ${cardNumber.slice(-4)} is ready to use`,
    });

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        {/* 1. Top Header Bar */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center -ml-2"
            activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#1E293B" />
          </TouchableOpacity>

          <Text className="font-semibold text-[17px] text-slate-800 tracking-tight">
            Add Card
          </Text>

          <View className="w-8" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 40,
          }}>
          {/* 2. Sleek Live Interactive Card Preview */}
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20 }}
            className="p-5 shadow-lg mb-5 relative overflow-hidden">
            <View className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-rose-500/20" />
            <View className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/20" />

            {/* Chip + Contactless Symbol */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View className="h-7 w-9 rounded-md bg-amber-200/90 border border-amber-300 justify-center px-1">
                  <View className="h-0.5 w-full bg-amber-400/80 mb-1" />
                  <View className="h-0.5 w-full bg-amber-400/80" />
                </View>
                <Ionicons name="wifi" size={16} color="#CBD5E1" className="ml-2 rotate-90" />
              </View>
              <FontAwesome5 name="cc-visa" size={28} color="#FFFFFF" />
            </View>

            {/* Live 16-Digit Number */}
            <Text className="font-mono font-bold text-[18px] text-white tracking-widest mb-5">
              {cardNumber || '•••• •••• •••• ••••'}
            </Text>

            {/* Holder & Expiry */}
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Card Holder
                </Text>
                <Text className="font-bold text-[13px] text-white tracking-wide">
                  {cardHolder.toUpperCase()}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Expires
                </Text>
                <Text className="font-bold text-[13px] text-white tracking-wide">
                  {expiryDate || 'MM/YY'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* 3. Scan card pink banner */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-row items-center justify-between rounded-xl bg-rose-50/80 border border-rose-100 p-3.5 mb-5">
            <View className="flex-row items-center">
              <Ionicons name="scan-outline" size={18} color="#E23744" className="mr-2.5" />
              <Text className="text-[13px] font-medium text-slate-800">
                Scan your card to auto-fill card details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#E23744" />
          </TouchableOpacity>

          {/* 4. Inputs Form */}
          <View className="mb-4">
            <Text className="font-medium text-[12px] text-slate-500 mb-1.5">
              Card Number
            </Text>
            <TextInput
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="number-pad"
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900"
            />
          </View>

          {/* Expiry Date & CVV */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="font-medium text-[12px] text-slate-500 mb-1.5">
                Expiry Date
              </Text>
              <TextInput
                value={expiryDate}
                onChangeText={handleExpiryChange}
                keyboardType="number-pad"
                maxLength={5}
                placeholder="MM/YY"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900"
              />
            </View>

            <View className="flex-1">
              <Text className="font-medium text-[12px] text-slate-500 mb-1.5">
                CVV
              </Text>
              <TextInput
                value={cvv}
                onChangeText={setCvv}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                placeholder="123"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900"
              />
            </View>
          </View>

          {/* Cardholder Name */}
          <View className="mb-4">
            <Text className="font-medium text-[12px] text-slate-500 mb-1.5">
              Cardholder Name
            </Text>
            <TextInput
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900"
            />
          </View>

          {/* Nickname for Card */}
          <View className="mb-6">
            <Text className="font-medium text-[12px] text-slate-500 mb-2">
              Nickname for Card
            </Text>
            <View className="flex-row gap-2.5">
              {(['Personal', 'Business', 'Other'] as const).map((tag) => {
                const isSelected = selectedNickname === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setSelectedNickname(tag)}
                    activeOpacity={0.8}
                    className={`flex-1 items-center justify-center py-2.5 rounded-xl border ${
                      isSelected
                        ? 'border-[#E23744] bg-[#E23744]'
                        : 'border-slate-200 bg-slate-50'
                    }`}>
                    <Text
                      className={`text-[13px] font-semibold ${
                        isSelected ? 'text-white' : 'text-slate-600'
                      }`}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 5. Add Card Button */}
          <TouchableOpacity
            onPress={handleAddCard}
            activeOpacity={0.88}
            style={{ borderRadius: 16 }}
            className="w-full items-center justify-center bg-[#E23744] py-3.5 mt-2">
            <Text className="font-bold text-[16px] text-white">Add Card</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
