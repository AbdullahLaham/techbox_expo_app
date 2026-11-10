// src/app/profile/achievements.tsx
// Certificates (one per completed program, with a verification code) and achievement badges.
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Share, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Flame,
  GraduationCap,
  Lock,
  Share2,
  type LucideIcon,
} from 'lucide-react-native';
import { ScreenTopBar } from '@/components/common/ScreenTopBar';
import { StateCard } from '@/components/common/StateCard';
import { getApiErrorMessage } from '@/api/errors';
import { formatDate } from '@/components/assignments/assignmentFormat';
import { useAchievements, useMyCertificates } from '@/hooks/useMe';
import { ACHIEVEMENTS, type AchievementMetric, type MyAchievement, type MyCertificate } from '@/types/profile.contract';

const GOLD = '#BF9B30';
const NAVY = '#1B254B';

const METRIC_ICON: Record<AchievementMetric, LucideIcon> = {
  completedLessons: BookOpen,
  passedQuizzes: CheckCircle2,
  gradedAssignments: Award,
  completedPrograms: GraduationCap,
  longestStreakDays: Flame,
  activeDays: CalendarCheck,
};

const TEXT = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
  MyAchievement['id'],
  (typeof ACHIEVEMENTS)[number]
>;

export default function AchievementsScreen() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));
  const achievementsQuery = useAchievements();
  const certificatesQuery = useMyCertificates();

  const [refreshing, setRefreshing] = useState(false);
  const { refetch: refetchAchievements } = achievementsQuery;
  const { refetch: refetchCertificates } = certificatesQuery;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAchievements(), refetchCertificates()]);
    setRefreshing(false);
  }, [refetchAchievements, refetchCertificates]);

  const data = achievementsQuery.data;
  const certificates = certificatesQuery.data?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScreenTopBar title="الشهادات والإنجازات" onBack={goBack} />

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GOLD]} />}
      >
        {/* CERTIFICATES */}
        <Text className="text-tb-navy text-lg font-bold mb-3">شهاداتي</Text>
        {certificatesQuery.isPending ? (
          <ActivityIndicator color={GOLD} className="my-6" />
        ) : certificatesQuery.isError ? (
          <StateCard
            Icon={AlertCircle}
            title="تعذّر تحميل الشهادات"
            message={getApiErrorMessage(certificatesQuery.error, 'حاول مرة أخرى.')}
            actionLabel="إعادة المحاولة"
            onAction={() => void refetchCertificates()}
          />
        ) : certificates.length === 0 ? (
          <View className="bg-white rounded-3xl border border-dashed border-tb-muted/30 p-6 items-center mb-2">
            <GraduationCap size={28} color="#A3AED0" />
            <Text className="text-tb-navy font-bold text-sm mt-3">لا توجد شهادات بعد</Text>
            <Text className="text-tb-muted text-xs leading-5 text-center mt-1">
              تصدر شهادة الإتمام تلقائياً عندما تعتمد الإدارة إتمامك لبرنامج.
            </Text>
          </View>
        ) : (
          certificates.map((c) => <CertificateCard key={c.id} certificate={c} />)
        )}

        {/* ACHIEVEMENTS */}
        <Text className="text-tb-navy text-lg font-bold mt-8 mb-3">إنجازاتي</Text>
        {achievementsQuery.isPending ? (
          <ActivityIndicator color={GOLD} className="my-6" />
        ) : achievementsQuery.isError || !data ? (
          <StateCard
            Icon={AlertCircle}
            title="تعذّر تحميل الإنجازات"
            message={getApiErrorMessage(achievementsQuery.error, 'حاول مرة أخرى.')}
            actionLabel="إعادة المحاولة"
            onAction={() => void refetchAchievements()}
          />
        ) : (
          <>
            <View className="flex-row flex-wrap gap-3 mb-5">
              <StatTile label="دروس منجزة" value={data.stats.completedLessons} Icon={BookOpen} />
              <StatTile label="اختبارات ناجحة" value={data.stats.passedQuizzes} Icon={CheckCircle2} />
              <StatTile label="أيام نشاط" value={data.stats.activeDays} Icon={CalendarCheck} />
              <StatTile label="السلسلة الحالية" value={data.stats.currentStreakDays} Icon={Flame} accent />
            </View>

            <Text className="text-tb-muted text-xs mb-3">
              حصلت على {data.earnedCount} من {data.achievements.length} أوسمة
            </Text>
            <View className="gap-3">
              {data.achievements.map((a) => (
                <AchievementRow key={a.id} achievement={a} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CertificateCard({ certificate: c }: { certificate: MyCertificate }) {
  const valid = c.status === 'VALID';
  const shareText = `شهادة إتمام برنامج "${c.programTitle}" من تك بوكس${c.holderName ? ` باسم ${c.holderName}` : ''}.\nرمز التحقق: ${c.code}`;

  const copy = async () => {
    await Clipboard.setStringAsync(c.code);
    Alert.alert('تم النسخ', `رمز التحقق ${c.code}`);
  };

  return (
    <View
      className={`rounded-3xl p-5 mb-3 border ${valid ? 'bg-tb-navy border-tb-navy' : 'bg-white border-tb-muted/20'}`}
      accessible
      accessibilityLabel={`شهادة ${c.programTitle}، ${valid ? 'سارية' : 'ملغاة'}، رمز التحقق ${c.code}`}
    >
      <View className="flex-row items-center gap-3 mb-4">
        <View className={`w-11 h-11 rounded-2xl items-center justify-center ${valid ? 'bg-tb-gold' : 'bg-tb-muted/15'}`}>
          <Award size={20} color={valid ? '#FFFFFF' : '#8A99B8'} />
        </View>
        <View className="flex-1 items-start">
          <Text className={`font-bold text-base ${valid ? 'text-white' : 'text-tb-muted'}`} numberOfLines={2}>
            {c.programTitle}
          </Text>
          <Text className={`text-xs mt-0.5 ${valid ? 'text-white/60' : 'text-tb-muted'}`}>
            {valid ? `صدرت في ${formatDate(c.issuedAt)}` : 'ملغاة: أُعيد فتح التسجيل في البرنامج'}
          </Text>
        </View>
      </View>

      {c.holderName ? (
        <Text className={`text-sm mb-3 ${valid ? 'text-white' : 'text-tb-muted'}`}>{c.holderName}</Text>
      ) : null}

      <View className={`flex-row items-center justify-between rounded-2xl px-4 py-3 ${valid ? 'bg-white/10' : 'bg-tb-background'}`}>
        <View className="items-start">
          <Text className={`text-[11px] ${valid ? 'text-white/60' : 'text-tb-muted'}`}>رمز التحقق</Text>
          <Text className={`font-bold tracking-widest ${valid ? 'text-tb-gold' : 'text-tb-muted'}`} selectable>
            {c.code}
          </Text>
        </View>
        {valid ? (
          <View className="flex-row gap-2">
            <IconButton Icon={Copy} label="نسخ الرمز" onPress={() => void copy()} />
            <IconButton Icon={Share2} label="مشاركة الشهادة" onPress={() => void Share.share({ message: shareText })} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function IconButton({ Icon, label, onPress }: { Icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center active:opacity-70"
    >
      <Icon size={18} color="#FFFFFF" />
    </Pressable>
  );
}

function StatTile({ label, value, Icon, accent }: { label: string; value: number; Icon: LucideIcon; accent?: boolean }) {
  return (
    <View className="bg-white rounded-2xl border border-tb-muted/10 p-4" style={{ width: '47%' }}>
      <Icon size={18} color={accent ? '#F97316' : NAVY} />
      <Text className="text-tb-navy text-2xl font-bold mt-2">{value}</Text>
      <Text className="text-tb-muted text-xs font-semibold">{label}</Text>
    </View>
  );
}

function AchievementRow({ achievement: a }: { achievement: MyAchievement }) {
  const text = TEXT[a.id];
  const Icon = METRIC_ICON[a.metric];
  const pct = Math.round((a.current / a.target) * 100);

  return (
    <View
      className={`flex-row items-center gap-3 bg-white rounded-2xl border p-4 ${a.earned ? 'border-tb-gold/40' : 'border-tb-muted/10'}`}
      accessible
      accessibilityLabel={`${text.title}: ${text.description}، ${a.earned ? 'تم الحصول عليه' : `التقدم ${a.current} من ${a.target}`}`}
    >
      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${a.earned ? 'bg-tb-gold/15' : 'bg-tb-background'}`}>
        {a.earned ? <Icon size={22} color={GOLD} /> : <Lock size={18} color="#A3AED0" />}
      </View>
      <View className="flex-1 items-start">
        <Text className={`font-bold text-sm ${a.earned ? 'text-tb-navy' : 'text-tb-muted'}`}>{text.title}</Text>
        <Text className="text-tb-muted text-[11px] mt-0.5">{text.description}</Text>
        {!a.earned && (
          <View className="w-full flex-row items-center gap-2 mt-2">
            <View className="flex-1 h-1.5 rounded-full bg-tb-muted/15 overflow-hidden">
              <View className="h-full rounded-full bg-tb-gold" style={{ width: `${pct}%` }} />
            </View>
            <Text className="text-tb-muted text-[10px] font-bold">
              {a.current}/{a.target}
            </Text>
          </View>
        )}
      </View>
      {a.earned && <CheckCircle2 size={18} color="#10B981" />}
    </View>
  );
}
