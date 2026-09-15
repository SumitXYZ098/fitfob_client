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

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sections = [
    {
      id: '1',
      icon: 'database-outline' as const,
      title: '1. Information We Collect',
      content:
        'We collect details you provide directly during registration and workout logging: your full name, email address, phone number, profile photo, emergency contact, and check-in timestamps.',
    },
    {
      id: '2',
      icon: 'face-recognition' as const,
      title: '2. Facial Verification & Biometrics',
      content:
        'Camera permissions are used solely for real-time facial check-ins at gym turnstiles and verification desks. Your biometric templates are encrypted using SHA-256 cryptographic hashing and are NEVER sold, rented, or shared with third-party advertisers.',
    },
    {
      id: '3',
      icon: 'map-marker-radius-outline' as const,
      title: '3. Location Services',
      content:
        'With your permission, we use GPS location to show nearby partner gyms, calculate commute distances, and authenticate your physical presence when checking into a gym facility.',
    },
    {
      id: '4',
      icon: 'lock-check-outline' as const,
      title: '4. Data Protection & Security',
      content:
        'We protect your personal data with TLS 1.3 encryption in transit, strict database access controls, secure cloud storage, and regular security audits. Your passwords and payment credentials are never stored in plaintext.',
    },
    {
      id: '5',
      icon: 'share-variant-outline' as const,
      title: '5. Information Sharing with Gyms',
      content:
        'We only share verified check-in confirmation with the specific partner gym you visit to validate your entry rights. We do NOT monetize, broker, or sell personal fitness data to data aggregators.',
    },
    {
      id: '6',
      icon: 'account-cog-outline' as const,
      title: '6. Your Rights & Data Deletion',
      content:
        'You have full ownership of your data. You may download a copy of your records, modify profile details, or permanently request account and biometric data deletion at any time via Profile Settings or by emailing privacy@fitfob.com.',
    },
    {
      id: '7',
      icon: 'shield-check-outline' as const,
      title: '7. Compliance & Regulations',
      content:
        'FitFob complies with applicable data protection regulations and industry privacy standards to ensure your digital rights remain safeguarded at all times.',
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
            <Text className="font-bold text-lg text-darkText">Privacy Policy</Text>
            <Text className="font-sans text-xs text-secondaryText">Data & Biometric Protection</Text>
          </View>

          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="shield-checkmark" size={20} color="#E23744" />
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
        {/* Privacy Commitment Banner */}
        <View className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Feather name="shield" size={18} color="#E23744" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm text-darkText">Our Privacy Guarantee</Text>
              <Text className="mt-1 font-sans text-xs leading-relaxed text-secondaryText">
                We respect your personal privacy. Your biometric face scan and location data are strictly used for gym check-in verification and are never sold.
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

        {/* Grievance / Contact Card */}
        <View className="mt-6 rounded-2xl border border-border bg-white p-5">
          <View className="items-center text-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="mail-outline" size={24} color="#E23744" />
            </View>
            <Text className="mt-2.5 font-bold text-base text-darkText">Privacy Grievance Officer</Text>
            <Text className="mt-1 text-center font-sans text-xs text-secondaryText">
              For privacy inquiries, data removal, or verification questions, contact us directly.
            </Text>
            <View className="mt-3 rounded-xl border border-border bg-gray-50 px-4 py-2">
              <Text className="font-semibold text-xs text-primary">privacy@fitfob.com</Text>
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
          <Text className="font-bold text-base text-white">I Understand & Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
