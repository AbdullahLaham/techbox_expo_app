// src/app/(tabs)/profile.tsx
// Profile tab: identity card, achievements summary and the three account sections.
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Award, ChevronLeft, LogOut, ShieldCheck, Trophy, User, type LucideIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useAchievements, useMyProfile } from '@/hooks/useMe';
import { Avatar } from '@/components/profile/Avatar';
import { ROLE_LABELS_AR } from '@/types/auth';

type MenuItem = { label: string; hint: string; Icon: LucideIcon; href: Href };

const MENU: MenuItem[] = [
  { label: 'تعديل الملف الشخصي', hint: 'الاسم، الصورة، معلومات التواصل', Icon: User, href: '/profile/edit' },
  { label: 'الشهادات والإنجازات', hint: 'شهادات الإتمام وأوسمة التقدّم', Icon: Award, href: '/profile/achievements' },
  { label: 'الحساب والأمان', hint: 'كلمة المرور، الأجهزة، حذف الحساب', Icon: ShieldCheck, href: '/profile/account' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const profileQuery = useMyProfile();
  const achievementsQuery = useAchievements();
  const profile = profileQuery.data;

  // The session user is there at once; the profile adds the picture and the latest edits.
  const firstName = profile?.firstName ?? user?.firstName ?? '';
  const lastName = profile?.lastName ?? user?.lastName ?? '';
  const role = profile?.globalRole ?? user?.globalRole ?? null;
  const fullName = `${firstName} ${lastName}`.trim();

  const [refreshing, setRefreshing] = useState(false);
  const { refetch: refetchProfile } = profileQuery;
  const { refetch: refetchAchievements } = achievementsQuery;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchAchievements()]);
    setRefreshing(false);
  }, [refetchProfile, refetchAchievements]);

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const achievements = achievementsQuery.data;

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="px-6 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#BF9B30']} />}
      >
        {/* Identity card */}
        <View className="bg-white p-6 rounded-3xl border border-tb-muted/10 shadow-sm items-center mb-6">
          <Pressable
            onPress={() => router.push('/profile/edit')}
            accessibilityRole="button"
            accessibilityLabel="تعديل الملف الشخصي"
            className="mb-4 rounded-full border-4 border-tb-gold/20 active:opacity-80"
          >
            <Avatar url={profile?.avatarUrl} name={firstName} size={96} />
          </Pressable>

          <Text className="text-tb-navy text-2xl font-bold mb-1">{fullName || 'طالب تك بوكس'}</Text>
          <Text className="text-tb-muted text-sm mb-3">{profile?.email ?? user?.email ?? ''}</Text>
          {profile?.bio ? (
            <Text className="text-tb-muted text-xs leading-5 text-center mb-3" numberOfLines={3}>
              {profile.bio}
            </Text>
          ) : null}

          <View className="bg-tb-gold/10 px-4 py-1.5 rounded-full border border-tb-gold/30">
            <Text className="text-tb-gold text-xs font-bold">الدور: {role ? ROLE_LABELS_AR[role] : '—'}</Text>
          </View>
        </View>

        {/* Achievements summary */}
        {achievements ? (
          <Pressable
            onPress={() => router.push('/profile/achievements')}
            accessibilityRole="button"
            accessibilityLabel={`الإنجازات: ${achievements.earnedCount} من ${achievements.achievements.length}`}
            className="bg-tb-navy rounded-3xl p-5 mb-6 flex-row items-center gap-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-2xl bg-tb-gold items-center justify-center">
              <Trophy size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1 items-start">
              <Text className="text-white font-bold text-base">
                {achievements.earnedCount} من {achievements.achievements.length} أوسمة
              </Text>
              <Text className="text-white/60 text-xs mt-0.5">
                دروس منجزة: {achievements.stats.completedLessons} · أطول سلسلة أيام: {achievements.stats.longestStreakDays}
              </Text>
            </View>
            <ChevronLeft size={18} color="#BF9B30" />
          </Pressable>
        ) : null}

        {/* Sections */}
        <View className="bg-white rounded-3xl border border-tb-muted/10 shadow-sm p-2 mb-6">
          {MENU.map(({ label, hint, Icon, href }, index) => (
            <Pressable
              key={label}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              accessibilityLabel={label}
              className={`flex-row items-center justify-between p-4 active:opacity-70 ${
                index < MENU.length - 1 ? 'border-b border-tb-muted/5' : ''
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center ml-3">
                  <Icon size={20} color="#1B254B" />
                </View>
                <View className="flex-1 items-start">
                  <Text className="text-tb-navy font-bold text-sm">{label}</Text>
                  <Text className="text-tb-muted text-[11px] mt-0.5">{hint}</Text>
                </View>
              </View>
              <ChevronLeft size={16} color="#8A99B8" />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleLogout}
          accessibilityRole="button"
          className="bg-red-50 p-4 rounded-2xl border border-red-200 flex-row items-center justify-center gap-2 active:opacity-80"
        >
          <LogOut size={20} color="#DC2626" />
          <Text className="text-red-600 font-bold text-base">تسجيل الخروج</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
