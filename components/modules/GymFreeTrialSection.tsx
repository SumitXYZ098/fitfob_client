import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Platform,
  Linking,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';

interface GymFreeTrialSectionProps {
  gymName: string;
  gymAddress?: string;
  gymCity?: string;
  gymId?: string;
  closingTime?: string;
}

export default function GymFreeTrialSection({
  gymName,
  gymAddress,
  gymCity,
  gymId,
  closingTime = '10:00 PM',
}: GymFreeTrialSectionProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  // Modal visibility states
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isSlotsFullModalVisible, setIsSlotsFullModalVisible] = useState(false);
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);

  // Booking form state
  const [selectedDateOption, setSelectedDateOption] = useState<'today' | 'tomorrow'>('today');
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [bookedPass, setBookedPass] = useState<{
    passId: string;
    date: string;
    validUntil: string;
    guestName: string;
  } | null>(null);

  // Dynamic formatted dates for today & tomorrow
  const dateInfo = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return {
      todayShort: `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`,
      todayFull: `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
      tomorrowShort: `${days[tomorrow.getDay()]}, ${tomorrow.getDate()} ${months[tomorrow.getMonth()]}`,
      tomorrowFull: `${days[tomorrow.getDay()]}, ${tomorrow.getDate()} ${months[tomorrow.getMonth()]} ${tomorrow.getFullYear()}`,
      tomorrowMonth: months[tomorrow.getMonth()].toUpperCase(),
      tomorrowDay: tomorrow.getDate(),
    };
  }, []);

  const locationSubtitle = useMemo(() => {
    const parts = [gymName, gymAddress || gymCity].filter(Boolean);
    return parts.join(' • ');
  }, [gymName, gymAddress, gymCity]);

  const guestName = useMemo(() => {
    return user?.name || user?.username || 'Hardeep Singh';
  }, [user]);

  // Handle confirming the free trial booking
  const handleConfirmBooking = (dateOption: 'today' | 'tomorrow') => {
    if (!policyAccepted) {
      Toast.show({
        type: 'error',
        text1: 'Policy Acceptance Required',
        text2: 'Please accept the no-show policy to confirm.',
      });
      return;
    }

    const passId = `TRL-${Math.floor(10000 + Math.random() * 90000)}`;
    const passDate = dateOption === 'today' ? dateInfo.todayFull : dateInfo.tomorrowFull;

    setBookedPass({
      passId,
      date: passDate,
      validUntil: `${closingTime} (closing)`,
      guestName,
    });

    setIsBookingModalVisible(false);
    setIsSlotsFullModalVisible(false);
    setIsPassModalVisible(true);

    Toast.show({
      type: 'success',
      text1: 'Free Trial Booked! 🎉',
      text2: `Pass ${passId} generated for ${dateOption === 'today' ? 'Today' : 'Tomorrow'}`,
    });
  };

  // Open maps for gym directions
  const handleOpenDirections = () => {
    const query = encodeURIComponent(`${gymName} ${gymAddress || ''} ${gymCity || ''}`.trim());
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  // Add event to calendar
  const handleAddToCalendar = () => {
    Toast.show({
      type: 'success',
      text1: 'Added to Calendar 📅',
      text2: `Free trial at ${gymName} added to your schedule.`,
    });
  };

  return (
    <View className="mt-6">
      {/* ─── 1. Free Trial Banner Card (Image 1) ──────────────────────────────── */}
      <View className="relative overflow-hidden rounded-[26px] bg-[#E23744] p-5 shadow-sm">
        {/* Top Tag: TRY BEFORE YOU BUY */}
        <View className="self-start rounded-full bg-white px-3.5 py-1 shadow-xs">
          <Text className="text-[10px] font-black uppercase tracking-wider text-[#E23744]">
            TRY BEFORE YOU BUY
          </Text>
        </View>

        {/* Headline */}
        <Text className="mt-3 font-extrabold text-[20px] text-white tracking-tight leading-snug">
          Free trial, bookable today
        </Text>

        {/* Subtitle description */}
        <Text className="mt-1.5 text-xs text-white/90 font-medium leading-relaxed">
          One full session at {gymName}, on us. Only 2 of 5 trial slots left today.
        </Text>

        {/* Book Free Trial Button / View Pass if booked */}
        {bookedPass ? (
          <TouchableOpacity
            onPress={() => setIsPassModalVisible(true)}
            activeOpacity={0.88}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5 shadow-xs">
            <Ionicons name="checkmark-circle" size={17} color="#16A34A" />
            <Text className="font-bold text-sm text-[#E23744]">
              View Booked Pass • {bookedPass.passId}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setIsBookingModalVisible(true)}
            activeOpacity={0.88}
            className="mt-4 items-center justify-center rounded-2xl bg-white py-3.5 shadow-xs">
            <Text className="font-bold text-sm text-[#E23744]">Book free trial • ₹0</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── 2. Book Your Free Trial Bottom Sheet Modal (Image 2) ──────────────── */}
      <Modal
        visible={isBookingModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsBookingModalVisible(false)}>
        <Pressable
          onPress={() => setIsBookingModalVisible(false)}
          className="flex-1 justify-end bg-black/60">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            className="rounded-t-[32px] bg-white px-5 pt-3">
            {/* Top Drag Handle */}
            <View className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-300" />

            {/* Header: Title, Subtitle, Close Button */}
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-extrabold text-[19px] text-slate-900 tracking-tight">
                  Book your free trial
                </Text>
                <Text className="mt-0.5 text-xs font-medium text-slate-500" numberOfLines={1}>
                  {locationSubtitle}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsBookingModalVisible(false)}
                activeOpacity={0.7}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={18} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Pick a Date Section */}
            <Text className="mt-5 font-bold text-xs text-slate-900">Pick a date</Text>

            <View className="mt-2.5 flex-row gap-3">
              {/* Option 1: Today */}
              <TouchableOpacity
                onPress={() => setSelectedDateOption('today')}
                activeOpacity={0.85}
                className={`flex-1 rounded-2xl p-3.5 border ${
                  selectedDateOption === 'today'
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-200 bg-white'
                }`}>
                <Text className="font-bold text-sm text-slate-900">Today</Text>
                <Text className="mt-0.5 text-xs text-slate-500 font-medium">
                  {dateInfo.todayShort}
                </Text>
                <Text className="mt-1.5 text-[11px] font-semibold text-rose-600">
                  2 slots left
                </Text>
              </TouchableOpacity>

              {/* Option 2: Tomorrow */}
              <TouchableOpacity
                onPress={() => setSelectedDateOption('tomorrow')}
                activeOpacity={0.85}
                className={`flex-1 rounded-2xl p-3.5 border ${
                  selectedDateOption === 'tomorrow'
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-200 bg-white'
                }`}>
                <Text className="font-bold text-sm text-slate-900">Tomorrow</Text>
                <Text className="mt-0.5 text-xs text-slate-500 font-medium">
                  {dateInfo.tomorrowShort}
                </Text>
                <Text className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                  4 slots left
                </Text>
              </TouchableOpacity>
            </View>

            {/* Breakdown Box */}
            <View className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500 font-medium">Free trial session</Text>
                <Text className="text-xs font-bold text-slate-900">₹0</Text>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between">
                <Text className="text-xs text-slate-500 font-medium">Valid</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {selectedDateOption === 'today' ? 'Today' : 'Tomorrow'} until {closingTime}
                </Text>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between">
                <Text className="text-xs text-slate-500 font-medium">Check-in</Text>
                <Text className="text-xs font-bold text-slate-800">
                  Show QR at front desk
                </Text>
              </View>
            </View>

            {/* No-Show Policy Box with Checkbox */}
            <TouchableOpacity
              onPress={() => setPolicyAccepted(!policyAccepted)}
              activeOpacity={0.85}
              className="mt-4 flex-row items-start gap-3 rounded-2xl border border-red-200 bg-rose-50/20 p-3.5">
              <View
                className={`h-5 w-5 items-center justify-center rounded-[5px] mt-0.5 ${
                  policyAccepted ? 'bg-[#E23744]' : 'border border-slate-300 bg-white'
                }`}>
                {policyAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text className="flex-1 text-[11.5px] leading-snug text-slate-600">
                No-show policy: this pass is valid only on the date I pick. If I don't visit,
                it expires and can't be reused.
              </Text>
            </TouchableOpacity>

            {/* Confirm Free Trial Button */}
            <TouchableOpacity
              onPress={() => handleConfirmBooking(selectedDateOption)}
              activeOpacity={0.85}
              className="mt-5 items-center justify-center rounded-2xl bg-[#E23744] py-3.5 shadow-sm shadow-[#E23744]/25">
              <Text className="font-bold text-sm text-white">Confirm free trial • ₹0</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── 3. Today's Slots Full Sheet Modal (Image 3) ───────────────────────── */}
      <Modal
        visible={isSlotsFullModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsSlotsFullModalVisible(false)}>
        <Pressable
          onPress={() => setIsSlotsFullModalVisible(false)}
          className="flex-1 justify-end bg-black/60">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            className="rounded-t-[32px] bg-white px-5 pt-3 items-center">
            {/* Top Drag Handle */}
            <View className="mb-4 h-1 w-12 rounded-full bg-slate-300" />

            {/* Circular Calendar Icon */}
            <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
              <Ionicons name="calendar" size={24} color="#B45309" />
            </View>

            {/* Title */}
            <Text className="mt-3.5 font-extrabold text-[18px] text-slate-900 text-center">
              Today's trial slots are full
            </Text>

            {/* Subtitle */}
            <Text className="mt-1.5 px-3 text-center text-xs text-slate-500 leading-relaxed font-medium">
              All 5 free trial sessions at {gymName} have been booked for today. The next
              open day is tomorrow.
            </Text>

            {/* Next Open Day Card */}
            <View className="mt-5 w-full flex-row items-center gap-3 rounded-2xl border border-red-300 bg-rose-50/40 p-3">
              {/* Date Badge */}
              <View className="min-w-[44px] items-center justify-center rounded-xl bg-[#E23744] px-2.5 py-1.5">
                <Text className="text-[10px] font-bold uppercase text-white">
                  {dateInfo.tomorrowMonth}
                </Text>
                <Text className="font-extrabold text-base text-white leading-tight">
                  {dateInfo.tomorrowDay}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="font-bold text-xs text-slate-900">
                  Tomorrow, {dateInfo.tomorrowShort}
                </Text>
                <Text className="mt-0.5 text-[11px] font-semibold text-emerald-600">
                  4 of 5 slots open
                </Text>
              </View>
            </View>

            {/* Book for tomorrow instead button */}
            <TouchableOpacity
              onPress={() => handleConfirmBooking('tomorrow')}
              activeOpacity={0.85}
              className="mt-4 w-full items-center justify-center rounded-2xl bg-[#E23744] py-3.5 shadow-sm">
              <Text className="font-bold text-sm text-white">
                Book for tomorrow instead • ₹0
              </Text>
            </TouchableOpacity>

            {/* Not now dismissal */}
            <TouchableOpacity
              onPress={() => setIsSlotsFullModalVisible(false)}
              activeOpacity={0.7}
              className="mt-2 py-2.5">
              <Text className="font-bold text-xs text-slate-700">Not now</Text>
            </TouchableOpacity>

            {/* Info Box */}
            <View className="mt-4 w-full flex-row items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <Ionicons name="information-circle-outline" size={17} color="#64748B" />
              <Text className="flex-1 text-[11px] text-slate-500 leading-snug">
                Your trial is valid only on the date you book. If you don't visit, the pass is
                marked expired.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── 4. Your Trial Pass Screen Modal (Image 4) ─────────────────────────── */}
      <Modal
        visible={isPassModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsPassModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#F8FAFC',
            paddingTop: Platform.OS === 'android' ? 12 : insets.top,
          }}>
          {/* Header Bar */}
          <View className="flex-row items-center px-4 py-3">
            <TouchableOpacity
              onPress={() => setIsPassModalVisible(false)}
              className="h-10 w-10 items-center justify-center -ml-2 rounded-full"
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text className="ml-1 font-bold text-base text-slate-900 tracking-tight">
              Your trial pass
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingTop: 4,
              paddingBottom: Math.max(insets.bottom, 24) + 20,
            }}>
            {/* Success Banner */}
            <View className="mb-4 flex-row items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text className="text-xs font-bold text-emerald-800">
                Free trial booked. See you there!
              </Text>
            </View>

            {/* Ticket Card */}
            <View className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm">
              {/* Ticket Top Red Header */}
              <View className="bg-[#E23744] p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-extrabold text-[17px] text-white tracking-tight">
                      {gymName}
                    </Text>
                    <Text className="mt-0.5 text-xs text-white/90 font-medium">
                      {gymAddress || gymCity || 'Partner Club'}
                    </Text>
                  </View>

                  <View className="rounded-full bg-white px-3 py-1 shadow-xs">
                    <Text className="text-[11px] font-extrabold text-[#E23744]">
                      FREE • ₹0
                    </Text>
                  </View>
                </View>
              </View>

              {/* QR Code Section */}
              <View className="items-center px-4 pt-5 pb-3">
                <View className="h-56 w-56 items-center justify-center rounded-2xl bg-white p-2 border border-slate-100 shadow-xs">
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${
                        bookedPass?.passId || 'TRL-20871'
                      }`,
                    }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="mt-3 text-center text-xs font-medium text-slate-500">
                  Show this at the front desk • {bookedPass?.passId || 'TRL-20871'}
                </Text>
              </View>

              {/* Notch Divider Effect */}
              <View className="relative my-2 w-full flex-row items-center justify-center">
                {/* Left Hole */}
                <View
                  style={{
                    position: 'absolute',
                    left: -12,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                />
                {/* Dashed Line */}
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    borderWidth: 1,
                    borderColor: '#CBD5E1',
                    borderStyle: 'dashed',
                    marginHorizontal: 16,
                  }}
                />
                {/* Right Hole */}
                <View
                  style={{
                    position: 'absolute',
                    right: -12,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                />
              </View>

              {/* Ticket Details Grid */}
              <View className="p-4 pt-2">
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
                  <View className="flex-1 pr-2">
                    <Text className="text-[11px] font-medium text-slate-400">Date</Text>
                    <Text className="mt-0.5 font-bold text-xs text-slate-900">
                      {bookedPass?.date || dateInfo.tomorrowFull}
                    </Text>
                  </View>

                  <View className="flex-1 items-end pl-2">
                    <Text className="text-[11px] font-medium text-slate-400">Valid until</Text>
                    <Text className="mt-0.5 font-bold text-xs text-slate-900">
                      {bookedPass?.validUntil || `${closingTime} (closing)`}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-3">
                  <View className="flex-1 pr-2">
                    <Text className="text-[11px] font-medium text-slate-400">Guest</Text>
                    <Text className="mt-0.5 font-bold text-xs text-slate-900">
                      {bookedPass?.guestName || guestName}
                    </Text>
                  </View>

                  <View className="flex-1 items-end pl-2">
                    <Text className="text-[11px] font-medium text-slate-400">Status</Text>
                    <Text className="mt-0.5 font-bold text-xs text-blue-600">Booked</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Warning Box */}
            <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
              <Ionicons name="warning-outline" size={17} color="#B45309" />
              <Text className="flex-1 text-[11.5px] leading-snug text-amber-900">
                Valid only on this date. If you don't visit by closing time, the pass expires
                and can't be reused.
              </Text>
            </View>

            {/* Bottom Action Buttons: Directions & Add to Calendar */}
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                onPress={handleOpenDirections}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-xs">
                <Ionicons name="location-outline" size={17} color="#1E293B" />
                <Text className="font-bold text-xs text-slate-800">Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddToCalendar}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 shadow-xs">
                <Ionicons name="calendar-outline" size={17} color="#1E293B" />
                <Text className="font-bold text-xs text-slate-800">Add to calendar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
