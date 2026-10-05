import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GradientDivider from '@/components/GradientDivider';

interface PassOption {
  id: 'premium' | 'luxury';
  title: string;
  tierBadge: string;
  passCode: string;
  headerBg: string;
  price: number;
  formattedPrice: string;
  gymTypeTitle: string;
  partnerGyms: string[];
  facilities: string[];
  features: string[];
}

const PASS_OPTIONS: PassOption[] = [
  {
    id: 'premium',
    title: 'PREMIUM PASS',
    tierBadge: 'COMMERCIAL TIER',
    passCode: 'FITFOB-PASS-PRM-802',
    headerBg: 'bg-[#E23744]',
    price: 1599,
    formattedPrice: '₹1,599',
    gymTypeTitle: 'Commercial & Multi-Branch AC Gyms',
    partnerGyms: ['Anytime Fitness', 'Multi-Branch AC', 'Gold-Tier Studios'],
    facilities: ['❄️ AC Floors', '🚿 Steam & Shower', '🔒 Lockers', '💪 Floor Trainers'],
    features: [
      'Access to partner AC commercial gyms',
      'Locker rooms, showers & floor trainers included',
      'Weekend outdoor pass included',
    ],
  },
  {
    id: 'luxury',
    title: 'LUXURY PASS',
    tierBadge: '5-STAR VIP ELITE',
    passCode: 'FITFOB-PASS-LUX-905',
    headerBg: 'bg-slate-900',
    price: 2999,
    formattedPrice: '₹2,999',
    gymTypeTitle: '5-Star Clubs & Luxury Arenas',
    partnerGyms: ['Club Resorts', 'CrossFit Arenas', 'Wellness Spas'],
    facilities: ['👑 5-Star Resorts', '⚡ CrossFit & Turf', '🧖 Sauna & Spa', '🧖‍♂️ Free Towel & Valet'],
    features: [
      'Access to elite club gyms & luxury fitness resorts',
      'CrossFit zones, turf tracks & functional arenas',
      'VIP desk check-in with complimentary towel service',
    ],
  },
];

export default function BuyOutdoorPassScreen() {
  const router = useRouter();
  const { gymName, gymAddress, gymImage, gymRating } = useLocalSearchParams<{
    gymName?: string;
    gymAddress?: string;
    gymImage?: string;
    gymRating?: string;
  }>();
  const [selectedPassId, setSelectedPassId] = useState<'premium' | 'luxury'>('premium');
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  const selectedPass = PASS_OPTIONS.find((p) => p.id === selectedPassId) || PASS_OPTIONS[0];

  const handleNext = () => {
    router.push({
      pathname: '/outdoorPass/select-visits' as any,
      params: {
        gymName,
        gymAddress,
        gymImage,
        gymRating,
        passTier: selectedPass.id,
        passName: selectedPass.title,
        passPrice: selectedPass.price,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900">Outdoor Gym Pass</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsInfoModalVisible(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="information-circle-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/account/profile' as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="person-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>
      <GradientDivider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 130,
        }}>
        {/* 2. Screen Title & Subtitle */}
        <View className="mb-4">
          <Text className="font-extrabold text-[22px] text-slate-900 tracking-tight">
            Choose Outdoor Pass
          </Text>
          <Text className="mt-0.5 text-[13px] text-slate-500">
            Access partner fitness clubs with flexible visit passes
          </Text>
        </View>

        {/* Quick Segmented Tabs (Switches between Premium and Luxury) */}
        <View className="mb-5 flex-row rounded-2xl bg-slate-200/80 p-1">
          {PASS_OPTIONS.map((p) => {
            const isTabActive = selectedPassId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPassId(p.id)}
                activeOpacity={0.85}
                className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
                  isTabActive ? 'bg-white shadow-xs' : 'bg-transparent'
                }`}>
                <Text
                  className={`font-bold text-[13.5px] ${
                    isTabActive ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                  {p.id === 'premium' ? '⚡ Premium' : '👑 Luxury'}
                </Text>
                <Text
                  className={`ml-1.5 text-[12px] font-extrabold ${
                    isTabActive ? 'text-[#E23744]' : 'text-slate-400'
                  }`}>
                  {p.formattedPrice}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Digital Pass / Ticket Card for Selected Pass */}
        <View
          style={{
            borderRadius: 24,
            shadowColor: selectedPass.id === 'luxury' ? '#D97706' : '#E23744',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 14,
            elevation: 4,
          }}
          className="relative overflow-hidden bg-white border border-slate-200/90 mb-4">
          
          {/* Top Header of Ticket */}
          <View className={`${selectedPass.headerBg} p-5`}>
            {/* Top row: Brand + Tier Badge */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="flash" size={14} color="#FFF" />
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-white/90">
                  FITFOB DIGITAL PASS
                </Text>
              </View>

              <View
                className={`rounded-full px-2.5 py-0.5 ${
                  selectedPass.id === 'luxury'
                    ? 'bg-amber-400/20 border border-amber-400/50'
                    : 'bg-white/20 border border-white/30'
                }`}>
                <Text
                  className={`text-[10px] font-extrabold tracking-wide ${
                    selectedPass.id === 'luxury' ? 'text-amber-300' : 'text-white'
                  }`}>
                  {selectedPass.tierBadge}
                </Text>
              </View>
            </View>

            {/* Title & Price Row */}
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-[22px] font-black text-white tracking-tight">
                  {selectedPass.title}
                </Text>
                <Text className="text-[11.5px] text-white/80 font-medium mt-0.5">
                  Universal Partner Gym Access
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[24px] font-black text-white">
                  {selectedPass.formattedPrice}
                </Text>
                <Text className="text-[10.5px] text-white/70 font-medium">
                  flexible visits
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket Perforation with Semi-Circle Notches */}
          <View className="relative my-0 flex-row items-center justify-center bg-white py-1">
            {/* Left cutout circle */}
            <View className="absolute -left-3.5 h-7 w-7 rounded-full bg-[#F8F9FA] border-r border-slate-200" />
            {/* Dashed line */}
            <View className="w-full border-b-2 border-dashed border-slate-200 mx-5" />
            {/* Right cutout circle */}
            <View className="absolute -right-3.5 h-7 w-7 rounded-full bg-[#F8F9FA] border-l border-slate-200" />
          </View>

          {/* Ticket Body Content */}
          <View className="p-4 pt-2">
            {/* Type of Gym Section */}
            <View className="mb-3 rounded-2xl bg-slate-50 border border-slate-100 p-3">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons
                  name={selectedPass.id === 'luxury' ? 'diamond' : 'barbell'}
                  size={14}
                  color={selectedPass.id === 'luxury' ? '#D97706' : '#E23744'}
                />
                <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  TYPE OF GYM INCLUDED
                </Text>
              </View>
              <Text className="text-[14px] font-extrabold text-slate-900 mb-2">
                {selectedPass.gymTypeTitle}
              </Text>

              {/* Partner Gym Type Chips */}
              <View className="flex-row flex-wrap gap-1.5">
                {selectedPass.partnerGyms.map((gym, gIdx) => (
                  <View
                    key={gIdx}
                    className="rounded-lg bg-white border border-slate-200/90 px-2.5 py-1">
                    <Text className="text-[11.5px] font-semibold text-slate-700">
                      • {gym}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Facilities & Amenities Badges */}
            <View className="mb-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                AMENITIES & FLOOR ACCESS
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {selectedPass.facilities.map((fac, fIdx) => (
                  <View
                    key={fIdx}
                    className={`rounded-lg px-2.5 py-1 border ${
                      selectedPass.id === 'luxury'
                        ? 'bg-amber-50/70 border-amber-200/70'
                        : 'bg-rose-50/70 border-rose-200/70'
                    }`}>
                    <Text
                      className={`text-[11.5px] font-semibold ${
                        selectedPass.id === 'luxury' ? 'text-amber-800' : 'text-rose-800'
                      }`}>
                      {fac}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Inclusions Checklist */}
            <View className="mb-4 pt-1 border-t border-slate-100">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 my-2">
                WHAT'S INCLUDED
              </Text>
              {selectedPass.features.map((feat, featIdx) => (
                <View key={featIdx} className="flex-row items-center py-0.5 mb-1">
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={selectedPass.id === 'luxury' ? '#D97706' : '#E23744'}
                  />
                  <Text className="ml-2 text-[12.5px] text-slate-700 font-medium">
                    {feat}
                  </Text>
                </View>
              ))}
            </View>

            {/* Ticket Stub Barcode Section */}
            <View className="rounded-xl bg-slate-50 border border-slate-100 p-3 items-center">
              {/* Simulated Barcode Lines */}
              <View className="flex-row items-center justify-center gap-[3px] mb-1.5 h-8 w-full px-6">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 1, 2].map(
                  (thickness, bIdx) => (
                    <View
                      key={bIdx}
                      style={{ width: thickness }}
                      className="h-full bg-slate-800 rounded-xs"
                    />
                  )
                )}
              </View>
              <Text className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">
                {selectedPass.passCode}
              </Text>
              <Text className="text-[10.5px] text-slate-400 mt-0.5">
                Scan or present at gym front desk for instant entry
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 4. Bottom Sticky Action Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-xl">
        <View className="px-5 pt-3 pb-6">
          <View className="mb-2.5 flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                ACTIVE SELECTION
              </Text>
              <Text className="text-[14px] font-extrabold text-slate-900">
                {selectedPass.title} ({selectedPass.formattedPrice})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsInfoModalVisible(true)}
              className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <Ionicons name="information-circle-outline" size={15} color="#475569" />
              <Text className="text-[11.5px] font-bold text-slate-600">Info</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.88}
            style={{ borderRadius: 14 }}
            className="w-full items-center justify-center bg-[#E23744] py-3.5 shadow-md shadow-rose-500/20">
            <Text className="font-bold text-[16px] text-white">Continue to Select Visits</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Outdoor Pass Info Bottom Sheet Modal */}
      <Modal
        visible={isInfoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsInfoModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsInfoModalVisible(false)}
            className="flex-1"
          />
          <View className="rounded-t-[32px] bg-white px-5 pt-3 pb-8 max-h-[82%] shadow-2xl">
            {/* Modal Drag Handle */}
            <View className="mb-3 items-center">
              <View className="h-1.5 w-12 rounded-full bg-slate-200" />
            </View>

            {/* Header */}
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100">
                  <Ionicons name="sparkles" size={20} color="#E23744" />
                </View>
                <View>
                  <Text className="font-bold text-[18px] text-slate-900">
                    Outdoor Gym Pass
                  </Text>
                  <Text className="text-[12px] text-slate-500">
                    Flexibility to train at partner gyms
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsInfoModalVisible(false)}
                activeOpacity={0.7}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <GradientDivider />

            {/* Scrollable Information Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Highlight Tagline Banner */}
              <View className="mb-4 rounded-2xl bg-rose-50/80 border border-rose-100 p-3.5 flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#E23744]">
                  <Ionicons name="checkmark-sharp" size={17} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-[13px] text-[#E23744]">
                    Zero Commitment • Total Freedom
                  </Text>
                  <Text className="text-[11.5px] text-slate-600 mt-0.5 leading-4">
                    Work out anywhere without buying separate expensive gym memberships.
                  </Text>
                </View>
              </View>

              {/* What You Get Section */}
              <Text className="mb-2.5 font-bold text-[14px] text-slate-900">
                What's Included in Your Pass?
              </Text>

              {/* Feature Item 1 */}
              <View className="mb-3 flex-row items-start rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs">
                  <Ionicons name="fitness-outline" size={19} color="#E23744" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-[13.5px] text-slate-800">
                    Partner Gym Network
                  </Text>
                  <Text className="mt-1 text-[12px] leading-4 text-slate-500">
                    Access partner gyms within your pass tier. No extra registration fees needed at the desk.
                  </Text>
                </View>
              </View>

              {/* Feature Item 2 */}
              <View className="mb-3 flex-row items-start rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs">
                  <Ionicons name="repeat-outline" size={19} color="#E23744" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-[13.5px] text-slate-800">
                    Visit-Based Flexibility
                  </Text>
                  <Text className="mt-1 text-[12px] leading-4 text-slate-500">
                    Pick single or multiple visit packs. Visits are only deducted on days you check in.
                  </Text>
                </View>
              </View>

              {/* Feature Item 3 */}
              <View className="mb-3 flex-row items-start rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs">
                  <Ionicons name="qr-code-outline" size={19} color="#E23744" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-[13.5px] text-slate-800">
                    Instant Digital Entry
                  </Text>
                  <Text className="mt-1 text-[12px] leading-4 text-slate-500">
                    Show your in-app QR code or check-in pin at the front desk for instant, contactless access.
                  </Text>
                </View>
              </View>

              {/* Feature Item 4 */}
              <View className="mb-4 flex-row items-start rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs">
                  <Ionicons name="shield-checkmark-outline" size={19} color="#E23744" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-[13.5px] text-slate-800">
                    Full Floor & Amenity Access
                  </Text>
                  <Text className="mt-1 text-[12px] leading-4 text-slate-500">
                    Complete access to strength zones, cardio decks, locker rooms, and showers per club policy.
                  </Text>
                </View>
              </View>

              {/* How It Works Section */}
              <Text className="mb-2.5 font-bold text-[14px] text-slate-900">
                How It Works
              </Text>
              <View className="rounded-2xl border border-slate-100 bg-white p-3.5 mb-4">
                <View className="flex-row items-center gap-3 mb-2.5">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                    <Text className="font-bold text-[11px] text-slate-700">1</Text>
                  </View>
                  <Text className="text-[12.5px] text-slate-700 font-medium">
                    Choose your pass tier and select visit count
                  </Text>
                </View>
                <View className="flex-row items-center gap-3 mb-2.5">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                    <Text className="font-bold text-[11px] text-slate-700">2</Text>
                  </View>
                  <Text className="text-[12.5px] text-slate-700 font-medium">
                    Walk in to any compatible partner fitness club
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                    <Text className="font-bold text-[11px] text-slate-700">3</Text>
                  </View>
                  <Text className="text-[12.5px] text-slate-700 font-medium">
                    Tap Check-in, show reception & start your workout
                  </Text>
                </View>
              </View>

              {/* Important Guidelines */}
              <View className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 mb-2">
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="information-circle" size={16} color="#64748B" />
                  <Text className="font-semibold text-[12px] text-slate-700">
                    Important Guidelines
                  </Text>
                </View>
                <Text className="text-[11.5px] leading-4 text-slate-500">
                  • Passes are valid for 30–60 days from purchase date.{'\n'}
                  • Please bring clean workout shoes and a gym towel.{'\n'}
                  • Each visit permits one continuous gym session per day.
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Close Button */}
            <View className="pt-2">
              <TouchableOpacity
                onPress={() => setIsInfoModalVisible(false)}
                activeOpacity={0.88}
                style={{ borderRadius: 13 }}
                className="w-full items-center justify-center bg-[#E23744] py-3.5">
                <Text className="font-bold text-[15px] text-white">
                  Got It, View Passes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
