import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GYM_DETAILS } from './gym-detail';
import GradientDivider from '@/components/GradientDivider';

interface ReviewItem {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  time: string;
  comment: string;
  isVerified?: boolean;
  memberDuration?: string;
  helpfulCount: number;
  images?: string[];
  ownerReply?: {
    date: string;
    text: string;
  };
}

const INITIAL_ALL_REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    name: 'Courtney Henry',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    time: '2 mins ago',
    isVerified: true,
    memberDuration: 'Member for 8 mos',
    helpfulCount: 14,
    comment:
      'Superb gym with brand new equipment, very clean locker rooms, and extremely friendly certified trainers. The morning energy is absolutely unmatched!',
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=600&auto=format&fit=crop',
    ],
    ownerReply: {
      date: '1 min ago',
      text: 'Thank you Courtney! We love having your positive energy every morning. Keep crushing those goals! 💪',
    },
  },
  {
    id: 'r2',
    name: 'Alex Mercer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    time: '1 day ago',
    isVerified: true,
    memberDuration: 'Member for 1 yr',
    helpfulCount: 9,
    comment:
      'Spacious crossfit floor and top-notch ventilation. Easily the best fitness club in Sector 71! Steam room after leg day is pure bliss.',
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
    ],
  },
  {
    id: 'r3',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    time: '3 days ago',
    isVerified: true,
    memberDuration: 'Member for 5 mos',
    helpfulCount: 6,
    comment:
      'The trainers are super supportive and push you towards real transformation without pushing extreme diets. Great community energy!',
  },
  {
    id: 'r4',
    name: 'David Miller',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    rating: 4,
    time: '1 week ago',
    isVerified: true,
    memberDuration: 'Member for 3 mos',
    helpfulCount: 4,
    comment:
      'Cleanest shower facilities and the steam bath is amazing after heavy lifting. Can get slightly crowded between 7 PM - 8:30 PM, but overall 9/10 experience.',
  },
  {
    id: 'r5',
    name: 'Ananya Roy',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    time: '2 weeks ago',
    isVerified: true,
    memberDuration: 'Member for 6 mos',
    helpfulCount: 11,
    comment:
      'Joined for Zumba and HIIT classes and ended up loving weight training too! Special shoutout to Coach Rahul for correcting my deadlift posture.',
    images: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop',
    ],
    ownerReply: {
      date: '1 week ago',
      text: 'So proud of your transformation Ananya! Coach Rahul will be thrilled to hear this.',
    },
  },
  {
    id: 'r6',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    time: '2 weeks ago',
    isVerified: true,
    memberDuration: 'Member for 1.5 yrs',
    helpfulCount: 8,
    comment:
      'Imported Panatta and Hammer Strength machines are buttery smooth. Weights are always re-racked properly and hygiene is 10/10.',
  },
  {
    id: 'r7',
    name: 'Neha Kapoor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    rating: 4,
    time: '3 weeks ago',
    isVerified: true,
    memberDuration: 'Member for 2 mos',
    helpfulCount: 3,
    comment:
      'Great vibe, good music playlists, and helpful staff at the front desk. AC works great even during peak summer afternoons.',
  },
  {
    id: 'r8',
    name: 'Michael Chang',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop',
    rating: 3,
    time: '1 month ago',
    isVerified: false,
    memberDuration: 'Trial Pass',
    helpfulCount: 2,
    comment:
      'Solid gym equipment and spacious layout, but parking was a bit tight on Saturday morning. Would recommend coming on bike or carpooling during weekends.',
    ownerReply: {
      date: '3 weeks ago',
      text: 'Thanks for the feedback Michael! We have now partnered with the adjacent complex to provide additional valet parking during weekend rush hours.',
    },
  },
  {
    id: 'r9',
    name: 'Siddharth Rao',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    time: '1 month ago',
    isVerified: true,
    memberDuration: 'Member for 9 mos',
    helpfulCount: 7,
    comment:
      'Best investment for physical and mental health. The personal diet counseling helped me drop 8 kgs in 3 months safely. Highly recommend!',
  },
  {
    id: 'r10',
    name: 'Zoya Khan',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    time: '1 month ago',
    isVerified: true,
    memberDuration: 'Member for 4 mos',
    helpfulCount: 5,
    comment:
      'Safe, welcoming, and empowering environment for women. Cleanest lockers in the city with keyless RFID access!',
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: '5', label: '5 ★' },
  { id: '4', label: '4 ★' },
  { id: '3', label: '3 ★' },
  { id: 'photos', label: 'With Photos' },
];

export default function ReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const gymId = (params.id as string) || (params.gymId as string) || '1';
  const gym = GYM_DETAILS[gymId as keyof typeof GYM_DETAILS] || GYM_DETAILS['1'];

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(INITIAL_ALL_REVIEWS);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'helpful'>('newest');
  const [helpfulMarks, setHelpfulMarks] = useState<{ [key: string]: boolean }>({});

  // Write Review Modal State
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);

  const toggleHelpful = (id: string) => {
    setHelpfulMarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out reviews for ${gym.title} on FitFob! Rated ${gym.rating}/5 from ${gym.totalReviews} fitness members.`,
      });
    } catch {
      // Ignore
    }
  };

  const filteredReviews = useMemo(() => {
    return reviewsList
      .filter((rev) => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'photos') return !!rev.images && rev.images.length > 0;
        return rev.rating === parseInt(selectedFilter, 10);
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'helpful') {
          const aCount = a.helpfulCount + (helpfulMarks[a.id] ? 1 : 0);
          const bCount = b.helpfulCount + (helpfulMarks[b.id] ? 1 : 0);
          return bCount - aCount;
        }
        return 0; // Default order
      });
  }, [reviewsList, selectedFilter, sortBy, helpfulMarks]);

  const handleSubmitReview = () => {
    if (!newComment.trim()) return;

    const newRev: ReviewItem = {
      id: `r-user-${Date.now()}`,
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
      rating: newRating,
      time: 'Just now',
      isVerified: true,
      memberDuration: 'Verified Member',
      helpfulCount: 0,
      comment: newComment.trim(),
    };

    setReviewsList((prev) => [newRev, ...prev]);
    setNewComment('');
    setNewTags([]);
    setIsWriteModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F8]" edges={['top']}>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between bg-[#FAF7F8] px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        <View className="flex-1 px-3 items-center">
          <Text className="font-bold text-base text-slate-900" numberOfLines={1}>
            Reviews & Ratings
          </Text>
          <Text className="text-[11px] font-medium text-slate-500" numberOfLines={1}>
            {gym.title} • {gym.totalReviews} Reviews
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>
      <GradientDivider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}>
        {/* 2. Rating Hero Card */}
        <View className="m-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <View className="flex-row items-center justify-between">
            {/* Big Score */}
            <View className="items-center pr-4">
              <Text className="font-extrabold text-4xl text-slate-900">{gym.rating}</Text>
              <View className="my-1 flex-row items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={15} color="#F59E0B" />
                ))}
              </View>
              <Text className="font-medium text-xs text-slate-500">
                {gym.totalReviews} verified ratings
              </Text>
              <View className="mt-2 rounded-full bg-[#FFEAEF] px-2.5 py-1">
                <Text className="font-bold text-[11px] text-[#E23744]">
                  94% Recommended
                </Text>
              </View>
            </View>

            {/* Star Distribution Progress Bars */}
            <View className="flex-1 border-l border-slate-100 pl-4 space-y-1.5">
              {gym.ratingBreakdown.map((r) => (
                <View key={r.star} className="flex-row items-center">
                  <Text className="w-3 text-right font-bold text-[11px] text-slate-600">
                    {r.star}
                  </Text>
                  <Ionicons name="star" size={10} color="#F59E0B" className="mx-1" />
                  <View className="h-2 flex-1 rounded-full bg-slate-100 ml-1 overflow-hidden">
                    <View
                      style={{ width: r.pct as any }}
                      className="h-full rounded-full bg-[#E23744]"
                    />
                  </View>
                  <Text className="ml-2 w-8 text-right font-medium text-[10px] text-slate-400">
                    {r.pct}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 3. Filter Category Pills */}
        <View className="px-4 pb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}>
            {FILTER_TABS.map((tab) => {
              const isSelected = selectedFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setSelectedFilter(tab.id)}
                  activeOpacity={0.8}
                  className={`mr-2.5 rounded-2xl px-4 py-2 border ${isSelected
                      ? 'border-[#E23744] bg-[#E23744] shadow-sm'
                      : 'border-slate-200/80 bg-white'
                    }`}>
                  <Text
                    className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-slate-700'
                      }`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Sort Selector Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Text className="font-bold text-sm text-slate-900">
            {filteredReviews.length} Reviews
          </Text>

          {/* Sort Buttons */}
          <View className="flex-row items-center rounded-xl bg-slate-200/60 p-0.5">
            {[
              { id: 'newest', label: 'Newest' },
              { id: 'rating', label: 'Rating' },
              { id: 'helpful', label: 'Helpful' },
            ].map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSortBy(s.id as any)}
                className={`rounded-lg px-2.5 py-1 ${sortBy === s.id ? 'bg-white shadow-xs' : ''
                  }`}>
                <Text
                  className={`text-[11px] font-semibold ${sortBy === s.id ? 'text-slate-900' : 'text-slate-500'
                    }`}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Reviews List */}
        <View className="px-4 pt-1 space-y-3">
          {filteredReviews.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
              <Text className="mt-3 font-semibold text-sm text-slate-600">
                No reviews found for this filter
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedFilter('all')}
                className="mt-3 rounded-full bg-[#E23744] px-4 py-1.5">
                <Text className="font-bold text-xs text-white">Reset Filter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredReviews.map((rev) => {
              const isMarkedHelpful = !!helpfulMarks[rev.id];
              const displayHelpful = rev.helpfulCount + (isMarkedHelpful ? 1 : 0);

              return (
                <View
                  key={rev.id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs mb-3">
                  {/* Top Reviewer Row */}
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: rev.avatar }}
                      className="h-11 w-11 rounded-full border border-slate-200 bg-slate-200"
                    />

                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-bold text-sm text-slate-900" numberOfLines={1}>
                          {rev.name}
                        </Text>
                        <Text className="text-[11px] font-medium text-slate-400">
                          {rev.time}
                        </Text>
                      </View>

                      {/* Stars & Member Badge */}
                      <View className="mt-0.5 flex-row items-center">
                        <View className="flex-row items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name="star"
                              size={12}
                              color={star <= rev.rating ? '#F59E0B' : '#E2E8F0'}
                            />
                          ))}
                        </View>

                        {rev.isVerified && (
                          <View className="ml-2 flex-row items-center rounded-full bg-emerald-50 px-2 py-0.5">
                            <Ionicons name="checkmark-circle" size={10} color="#059669" />
                            <Text className="ml-0.5 text-[10px] font-bold text-emerald-700">
                              {rev.memberDuration || 'Verified'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Comment Text */}
                  <Text className="mt-3 text-xs leading-5 text-slate-700 font-sans">
                    {rev.comment}
                  </Text>

                  {/* Review Images (if any) */}
                  {rev.images && rev.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                      {rev.images.map((imgUrl, i) => (
                        <Image
                          key={i}
                          source={{ uri: imgUrl }}
                          className="mr-2 h-20 w-20 rounded-xl bg-slate-100"
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}

                  {/* Owner / Trainer Response Block */}
                  {rev.ownerReply && (
                    <View className="mt-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center">
                          <View className="h-5 w-5 rounded-full bg-[#E23744] items-center justify-center mr-1.5">
                            <Ionicons name="shield-checkmark" size={11} color="#FFF" />
                          </View>
                          <Text className="font-bold text-xs text-slate-800">
                            Response from {gym.title}
                          </Text>
                        </View>
                        <Text className="text-[10px] text-slate-400">
                          {rev.ownerReply.date}
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-600 leading-4">
                        {rev.ownerReply.text}
                      </Text>
                    </View>
                  )}

                  {/* Helpful Button Bar */}
                  <View className="mt-3.5">
                    <GradientDivider />
                    <View className="flex-row items-center justify-end pt-2.5">
                      <TouchableOpacity
                        onPress={() => toggleHelpful(rev.id)}
                        activeOpacity={0.7}
                        className={`flex-row items-center rounded-full px-3 py-1.5 border ${isMarkedHelpful
                            ? 'border-[#E23744]/30 bg-[#FFEAEF]'
                            : 'border-slate-200 bg-slate-50'
                          }`}>
                        <Ionicons
                          name={isMarkedHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
                          size={12}
                          color={isMarkedHelpful ? '#E23744' : '#64748B'}
                        />
                        <Text
                          className={`ml-1.5 text-[11px] font-semibold ${isMarkedHelpful ? 'text-[#E23744]' : 'text-slate-600'
                            }`}>
                          Helpful ({displayHelpful})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 6. Bottom Floating Action Bar: Write a Review */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/95 shadow-lg">
        <GradientDivider />
        <View className="px-5 py-3.5">
          <TouchableOpacity
            onPress={() => setIsWriteModalVisible(true)}
            activeOpacity={0.9}
            className="flex-row items-center justify-center rounded-full bg-[#E23744] py-3.5 shadow-md"
            style={{
              shadowColor: '#E23744',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text className="ml-2 font-bold text-base text-white">
              Write a Review
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Write Review Modal */}
      <Modal
        visible={isWriteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWriteModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsWriteModalVisible(false)}
            className="flex-1"
          />
          <View className="rounded-t-[32px] bg-white p-5 max-h-[85%] shadow-2xl">
            {/* Modal Drag Handle */}
            <View className="mb-3 items-center">
              <View className="h-1.5 w-12 rounded-full bg-slate-300" />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-3">
                <View>
                  <Text className="font-bold text-lg text-slate-900">Write a Review</Text>
                  <Text className="text-xs text-slate-500">{gym.title}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsWriteModalVisible(false)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
              <GradientDivider />

              {/* Star Selector */}
              <View className="items-center py-4">
                <Text className="mb-2 font-semibold text-xs text-slate-500">
                  TAP TO RATE YOUR EXPERIENCE
                </Text>
                <View className="flex-row items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setNewRating(star)}
                      className="p-1">
                      <Ionicons
                        name={star <= newRating ? 'star' : 'star-outline'}
                        size={32}
                        color="#F59E0B"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="mt-1 font-bold text-xs text-[#E23744]">
                  {newRating === 5
                    ? 'Excellent • 5.0'
                    : newRating === 4
                      ? 'Very Good • 4.0'
                      : newRating === 3
                        ? 'Average • 3.0'
                        : newRating === 2
                          ? 'Poor • 2.0'
                          : 'Terrible • 1.0'}
                </Text>
              </View>

              {/* Quick Tag Pills */}
              <View className="mb-3">
                <Text className="mb-2 font-semibold text-xs text-slate-500">
                  WHAT DID YOU LIKE?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    'Clean Facilities',
                    'Great Trainers',
                    'Modern Equipment',
                    'Good Music',
                    'Spacious Floor',
                  ].map((tag) => {
                    const isTagSelected = newTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => {
                          setNewTags((prev) =>
                            isTagSelected
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`rounded-full px-3 py-1.5 border ${isTagSelected
                            ? 'border-[#E23744] bg-[#FFEAEF]'
                            : 'border-slate-200 bg-slate-50'
                          }`}>
                        <Text
                          className={`text-xs font-semibold ${isTagSelected ? 'text-[#E23744]' : 'text-slate-600'
                            }`}>
                          {isTagSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Comment Input */}
              <Text className="mb-1 font-semibold text-xs text-slate-500">YOUR REVIEW</Text>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Tell others about equipment quality, cleanliness, crowd levels..."
                placeholderTextColor="#94A3B8"
                value={newComment}
                onChangeText={setNewComment}
                className="h-28 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800"
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitReview}
                activeOpacity={0.85}
                className={`mt-4 mb-3 items-center justify-center rounded-full py-3.5 ${newComment.trim().length > 0 ? 'bg-[#E23744]' : 'bg-slate-300'
                  }`}
                disabled={newComment.trim().length === 0}>
                <Text className="font-bold text-sm text-white">Post Review</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
