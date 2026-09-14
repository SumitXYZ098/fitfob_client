import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sections = [
    {
      id: '1',
      icon: 'file-document-check-outline' as const,
      title: '1. Acceptance of Terms',
      content:
        'By downloading, accessing, or using FitFob services, you agree to comply with and be legally bound by these Terms and Conditions. If you disagree with any portion of these terms, you must not use our mobile application or affiliated gym services.',
    },
    {
      id: '2',
      icon: 'heart-pulse' as const,
      title: '2. Health & Exercise Disclaimer',
      content:
        'Physical exercise involves inherent risks of bodily injury. FitFob is a technology platform for fitness tracking and gym check-ins, NOT a medical provider. Consult your healthcare provider before engaging in high-intensity workouts or using specialized gym equipment.',
    },
    {
      id: '3',
      icon: 'shield-account-outline' as const,
      title: '3. Accounts & Facial Verification',
      content:
        'Your FitFob account is personal and non-transferable. We use facial recognition solely for contactless, fraud-free access at partner gym turnstiles. Lending passes, impersonation, or checking in on someone else’s behalf will result in immediate pass forfeiture and account ban.',
    },
    {
      id: '4',
      icon: 'credit-card-chip-outline' as const,
      title: '4. Memberships, Passes & Billing',
      content:
        'All purchases (Daily Passes, Monthly Packs, Annual Memberships) are billed in advance. Passes are activated upon your first check-in or within 30 days of purchase. Refunds are honored within 48 hours of purchase if no gym check-in has occurred.',
    },
    {
      id: '5',
      icon: 'account-group-outline' as const,
      title: '5. Gym Etiquette & Code of Conduct',
      content:
        'While present at any partner gym, members must adhere to gym rules, wear proper athletic attire, wipe down equipment after use, re-rack weights, and treat staff and fellow athletes with dignity. Zero tolerance is enforced for harassment or disorderly behavior.',
    },
    {
      id: '6',
      icon: 'scale-balance' as const,
      title: '6. Limitation of Liability',
      content:
        'FitFob connects fitness enthusiasts with independent partner clubs. FitFob is not liable for personal property lost or stolen on gym premises, or injuries resulting from equipment misuse.',
    },
    {
      id: '7',
      icon: 'refresh' as const,
      title: '7. Policy Modifications',
      content:
        'FitFob reserves the right to update these terms. Significant modifications will be communicated via in-app notifications and email. Continued use of the service constitutes acceptance of modified terms.',
    },
  ];

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      {/* Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top + 8, 44) }}
        className="border-b border-border bg-white px-5 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#1C1C1C" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="font-bold text-lg text-darkText">Terms & Conditions</Text>
            <Text className="font-sans text-xs text-secondaryText">FitFob Membership Agreement</Text>
          </View>

          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="document-text" size={20} color="#E23744" />
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom + 90, 110),
        }}>
        {/* Key Highlights Card */}
        <View className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Feather name="check-circle" size={18} color="#E23744" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm text-darkText">Important Summary</Text>
              <Text className="mt-1 font-sans text-xs leading-relaxed text-secondaryText">
                By proceeding with FitFob, you agree to workout safely, use your personal biometric pass responsibly, and respect gym partner guidelines.
              </Text>
            </View>
          </View>
        </View>

        {/* Section List */}
        <View className="gap-3">
          {sections.map((section) => (
            <View
              key={section.id}
              className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <View className="flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-gray-50">
                  <MaterialCommunityIcons name={section.icon} size={18} color="#E23744" />
                </View>
                <Text className="flex-1 font-bold text-base text-darkText">{section.title}</Text>
              </View>
              <Text className="mt-2.5 font-sans text-sm leading-relaxed text-secondaryText">
                {section.content}
              </Text>
            </View>
          ))}
        </View>

        {/* Support Card */}
        <View className="mt-6 rounded-2xl border border-border bg-white p-5">
          <View className="items-center text-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="mail-outline" size={24} color="#E23744" />
            </View>
            <Text className="mt-2.5 font-bold text-base text-darkText">Have Questions?</Text>
            <Text className="mt-1 text-center font-sans text-xs text-secondaryText">
              If you have any questions regarding these terms, reach out to our legal team.
            </Text>
            <View className="mt-3 rounded-xl border border-border bg-gray-50 px-4 py-2">
              <Text className="font-semibold text-xs text-primary">legal@fitfob.com</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom + 12, 20) }}
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-5 pt-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="items-center justify-center rounded-2xl bg-primary py-3.5 shadow-md">
          <Text className="font-bold text-base text-white">I Agree to Terms</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
