import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Container } from '@/components/modules/Container';
import { useAuthStore } from '@/store/useAuthStore';

interface FAQItem {
  id: string;
  category: 'all' | 'gym' | 'billing' | 'account' | 'verification';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    category: 'gym',
    question: 'How does the Face Verification check-in work at gyms?',
    answer:
      'When you arrive at any FitFob partner gym, stand in front of the entry turnstile scanner or kiosk. Look directly into the camera. Your registered facial template will authenticate within 1 second and grant you entry seamlessly without any physical cards or keys.',
  },
  {
    id: '2',
    category: 'gym',
    question: 'What if the turnstile scanner fails to recognize me?',
    answer:
      'Ensure good lighting and remove sunglasses or face masks. If it still fails, show your FitFob active pass QR code from the app home screen to the gym front desk for manual check-in.',
  },
  {
    id: '3',
    category: 'gym',
    question: 'Can I visit multiple partner gyms in a single day?',
    answer:
      'Yes, depending on your membership tier. Multi-club passes allow access to multiple certified clubs. Check your active pass details on the Profile screen for your daily check-in limits.',
  },
  {
    id: '4',
    category: 'billing',
    question: 'How do I cancel or pause my subscription?',
    answer:
      'Go to Profile > Membership Plans > Manage Subscription. You can pause your plan for up to 30 days or cancel renewal at the end of your billing cycle without any penalty.',
  },
  {
    id: '5',
    category: 'billing',
    question: 'What is the FitFob refund policy?',
    answer:
      'We offer a 48-hour money-back guarantee for unused passes. If you have not performed any gym check-ins within 48 hours of purchase, you can request an instant full refund via the app.',
  },
  {
    id: '6',
    category: 'verification',
    question: 'Why is my ID / Face Verification pending?',
    answer:
      'Our AI and verification team review IDs within 15–30 minutes during business hours. Ensure your uploaded selfie is clear, unblurred, and matches your official photo ID.',
  },
  {
    id: '7',
    category: 'account',
    question: 'Can I transfer my gym pass to a friend or family member?',
    answer:
      'No. FitFob memberships are strictly personal and biometric-bound. Transferring or sharing your account violates our community terms and results in automated pass suspension.',
  },
  {
    id: '8',
    category: 'account',
    question: 'How do I update my registered phone number or email?',
    answer:
      'Navigate to Profile > Edit Profile (pencil icon on your avatar) to update personal information. For security reasons, changing your registered email requires OTP confirmation.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'gym', label: 'Gym Access' },
  { id: 'billing', label: 'Billing & Passes' },
  { id: 'verification', label: 'ID Verification' },
  { id: 'account', label: 'Account' },
] as const;

export default function HelpSupportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  // Ticket Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Gym Access Issue');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Filter FAQs based on search and selected category
  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCategory =
        selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleContactPress = (type: 'email' | 'call' | 'whatsapp') => {
    if (type === 'email') {
      Linking.openURL('mailto:support@fitfob.com?subject=FitFob%20Support%20Request').catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Could not open email',
          text2: 'Please write directly to support@fitfob.com',
        });
      });
    } else if (type === 'call') {
      Linking.openURL('tel:+918001234567').catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Could not initiate call',
          text2: 'Call us directly at +91 800-123-4567',
        });
      });
    } else if (type === 'whatsapp') {
      const msg = encodeURIComponent('Hello FitFob Support, I need assistance with my account.');
      Linking.openURL(`https://wa.me/918001234567?text=${msg}`).catch(() => {
        Toast.show({
          type: 'error',
          text1: 'WhatsApp not found',
          text2: 'Reach us via email at support@fitfob.com',
        });
      });
    }
  };

  const handleTicketSubmit = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Form',
        text2: 'Please provide both a subject and details for your request.',
      });
      return;
    }

    setIsSubmittingTicket(true);

    // Simulate instant ticket dispatch
    setTimeout(() => {
      setIsSubmittingTicket(false);
      setIsTicketModalOpen(false);
      setTicketSubject('');
      setTicketMessage('');

      Toast.show({
        type: 'success',
        text1: 'Ticket Submitted! 🎟️',
        text2: 'Support ticket #FIT-' + Math.floor(100000 + Math.random() * 900000) + ' created.',
      });
    }, 1000);
  };

  return (
    <Container>
      {/* 1. Top Header */}
      <View className="flex-row items-center justify-between pb-3 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1C1C1C" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="font-bold text-lg text-slate-800">Help & Support</Text>
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="font-medium text-[11px] text-emerald-600">
              Online • 5m avg. response
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsTicketModalOpen(true)}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#FFEAEF]"
          activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color="#F6163C" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 2. Quick Contact Channels Banner */}
        <View className="mt-3">
          <Text className="mb-2.5 font-bold text-base text-slate-800">
            How can we help you today?
          </Text>

          <View className="flex-row justify-between gap-3">
            {/* Call Center */}
            <TouchableOpacity
              onPress={() => handleContactPress('call')}
              activeOpacity={0.8}
              className="flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <View className="h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-xs">
                <Ionicons name="call" size={20} color="#2563EB" />
              </View>
              <Text className="mt-2.5 font-bold text-sm text-slate-800">Call Us</Text>
              <Text className="mt-0.5 text-[11px] text-slate-500">6 AM – 11 PM</Text>
            </TouchableOpacity>

            {/* Email Support */}
            <TouchableOpacity
              onPress={() => handleContactPress('email')}
              activeOpacity={0.8}
              className="flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <View className="h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-xs">
                <Ionicons name="mail" size={20} color="#F6163C" />
              </View>
              <Text className="mt-2.5 font-bold text-sm text-slate-800">Email</Text>
              <Text className="mt-0.5 text-[11px] text-slate-500">24/7 Response</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Raise a Ticket CTA Banner */}
        <TouchableOpacity
          onPress={() => setIsTicketModalOpen(true)}
          activeOpacity={0.85}
          className="mt-4 flex-row items-center justify-between rounded-2xl border border-primary/20 bg-[#FFEAEF]/70 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text className="font-bold text-sm text-slate-900">Have a specific issue?</Text>
              <Text className="font-sans text-xs text-slate-600">
                Submit a support ticket & track resolution
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#F6163C" />
        </TouchableOpacity>

        {/* 4. Search Bar */}
        <View className="mt-6">
          <View className="h-13 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Search help, FAQs, turnstile issues..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="ml-2.5 flex-1 font-medium text-sm text-slate-800"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 5. Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3.5"
          contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
                className={`rounded-full px-4 py-2 border ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-white border-slate-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 6. FAQ Accordion List */}
        <View className="mt-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-bold text-base text-slate-800">Frequently Asked Questions</Text>
            <Text className="font-medium text-xs text-slate-400">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
            </Text>
          </View>

          {filteredFAQs.length === 0 ? (
            <View className="items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/70 p-8 text-center">
              <Ionicons name="help-circle-outline" size={40} color="#CBD5E1" />
              <Text className="mt-2 font-bold text-base text-slate-700">No matching questions</Text>
              <Text className="mt-1 text-center font-sans text-xs text-slate-400">
                Try searching with different keywords or submit a ticket directly to our support team.
              </Text>
            </View>
          ) : (
            <View className="space-y-2.5 gap-2">
              {filteredFAQs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <View
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ">
                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : faq.id)}
                      activeOpacity={0.7}
                      className="flex-row items-center justify-between p-4">
                      <Text className="flex-1 pr-3 font-semibold text-sm leading-snug text-slate-800">
                        {faq.question}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isExpanded ? '#F6163C' : '#94A3B8'}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View className="border-t border-slate-50 bg-slate-50/50 px-4 pb-4 pt-3">
                        <Text className="font-sans text-xs leading-relaxed text-slate-600">
                          {faq.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 7. Footer Operating Hours */}
        <View className="mt-7 rounded-2xl border border-slate-100 bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Feather name="clock" size={20} color="#475569" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-xs text-slate-800">Support Operating Hours</Text>
              <Text className="font-sans text-xs text-slate-500">
                Monday to Sunday • 6:00 AM to 11:00 PM IST
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- Ticket Submission Modal --- */}
      <Modal
        visible={isTicketModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTicketModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[85%] rounded-t-[32px] bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3">
              <View>
                <Text className="font-bold text-xl text-slate-900">Submit Support Ticket</Text>
                <Text className="font-sans text-xs text-slate-500">
                  We typically resolve requests within 2 hours
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTicketModalOpen(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
              {/* Category Selector */}
              <Text className="mb-2 font-medium text-xs text-slate-500">Issue Category</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {[
                  'Gym Access Issue',
                  'Face Verification',
                  'Payment & Refund',
                  'Pass Renewal',
                  'Other Inquiry',
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setTicketCategory(cat)}
                    className={`rounded-full px-3 py-1.5 border ${
                      ticketCategory === cat
                        ? 'bg-primary border-primary'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                    <Text
                      className={`text-xs ${
                        ticketCategory === cat ? 'font-bold text-white' : 'text-slate-700'
                      }`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject */}
              <Text className="mb-1 font-medium text-xs text-slate-500">Subject</Text>
              <TextInput
                placeholder="Brief summary of your issue..."
                placeholderTextColor="#94A3B8"
                value={ticketSubject}
                onChangeText={setTicketSubject}
                className="mb-4 h-12 rounded-xl border border-slate-200 px-4 text-sm text-slate-800"
              />

              {/* Message Details */}
              <Text className="mb-1 font-medium text-xs text-slate-500">Detailed Description</Text>
              <TextInput
                placeholder="Tell us what happened, gym club name, timestamps, etc..."
                placeholderTextColor="#94A3B8"
                value={ticketMessage}
                onChangeText={setTicketMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="mb-6 h-28 rounded-xl border border-slate-200 p-3 text-sm text-slate-800"
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleTicketSubmit}
                disabled={isSubmittingTicket}
                activeOpacity={0.85}
                className="items-center justify-center rounded-2xl bg-primary py-4 shadow-md">
                {isSubmittingTicket ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-base text-white">Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
