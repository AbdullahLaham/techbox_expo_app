// src/app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Database,
  Flame,
  Palette,
  Play,
  Rocket,
  Server,
  type LucideIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { useMyEnrollments } from '@/hooks/usePrograms';

/* -------------------------------------------------------------------------- */
/*  Tokens & mock data (replace with API / store data)                        */
/* -------------------------------------------------------------------------- */

const COLORS = {
  navy: '#1B254B',
  gold: '#BF9B30',
  green: '#10B981',
  orange: '#F97316',
  onNavyMuted: 'rgba(255,255,255,0.6)',
  onNavyTrack: 'rgba(255,255,255,0.12)',
} as const;

type Stat = { id: string; value: string; label: string; Icon: LucideIcon; color: string };
type Course = {
  id: string;
  title: string;
  lessons: number;
  hours: number;
  Icon: LucideIcon;
  color: string;
  tint: string;
};
type Day = { label: string; done: boolean };

const COURSES: Course[] = [
  {
    id: 'nest',
    title: 'بناء الـ APIs باستخدام NestJS',
    lessons: 18,
    hours: 6,
    Icon: Server,
    color: COLORS.navy,
    tint: 'rgba(27,37,75,0.08)',
  },
  {
    id: 'uiux',
    title: 'أساسيات تصميم تجربة المستخدم',
    lessons: 12,
    hours: 4,
    Icon: Palette,
    color: COLORS.gold,
    tint: 'rgba(191,155,48,0.12)',
  },
  {
    id: 'pg',
    title: 'قواعد البيانات مع PostgreSQL',
    lessons: 15,
    hours: 5,
    Icon: Database,
    color: COLORS.green,
    tint: 'rgba(16,185,129,0.10)',
  },
];

// Saturday → Friday
const WEEK: Day[] = [
  { label: 'س', done: true },
  { label: 'ح', done: true },
  { label: 'ن', done: false },
  { label: 'ث', done: true },
  { label: 'ر', done: true },
  { label: 'خ', done: false },
  { label: 'ج', done: false },
];


const TODAY_INDEX = 5;



/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = { progress: number; size?: number; stroke?: number };

/** The one animated moment on the screen: the ring fills on mount. */
function ProgressRing({ progress, size = 84, stroke = 8 }: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [value] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(value, {
      toValue: progress,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // strokeDashoffset isn't supported by the native driver
    }).start();
  }, [progress, value]);

  const strokeDashoffset = value.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.onNavyTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.gold}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-white text-lg font-bold">{progress}%</Text>
      </View>
    </View>
  );
}

type SectionHeaderProps = { title: string; actionLabel?: string; onActionPress?: () => void };

function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-tb-navy text-lg font-bold">{title}</Text>
      {actionLabel ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text className="text-tb-gold text-xs font-bold">{actionLabel}</Text>
          <ChevronLeft size={14} color={COLORS.gold} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function HomeScreen() {
  const router = useRouter();
  const activeDays = WEEK.filter((d) => d.done).length;

  // GET /v1/enrollments/my-enrollments (newest first): progress per program.
  const enrollmentsQuery = useMyEnrollments();
  const enrollments = enrollmentsQuery.data ?? [];
  const current = enrollments.find((e) => e.status === 'ACTIVE') ?? null;
  const currentPct = current ? Math.min(100, Math.round(current.progressPct)) : 0;

  const withAccess = enrollments.filter((e) => e.status === 'ACTIVE' || e.status === 'COMPLETED');
  const loaded = !enrollmentsQuery.isPending;
  const stats: Stat[] = [
    {
      id: 'programs',
      value: loaded ? String(enrollments.filter((e) => e.status === 'ACTIVE').length) : '–',
      label: 'برامج حالية',
      Icon: BookOpen,
      color: COLORS.navy,
    },
    {
      id: 'lessons',
      value: loaded ? String(withAccess.reduce((sum, e) => sum + e.completedLessons, 0)) : '–',
      label: 'دروس منجزة',
      Icon: CheckCircle2,
      color: COLORS.gold,
    },
    {
      id: 'completed',
      value: loaded ? String(enrollments.filter((e) => e.status === 'COMPLETED').length) : '–',
      label: 'برامج مكتملة',
      Icon: Award,
      color: COLORS.green,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
      >
        {/* GREETING */}
        <View className="px-6 mb-5 items-start">
          <Text className="text-tb-navy text-2xl font-bold mb-1">مرحباً بك 👋</Text>
          <Text className="text-tb-muted text-sm">
            {current
              ? currentPct < 100
                ? 'واصل من حيث توقفت، أنت تتقدّم بثبات.'
                : 'أنجزت كل دروس برنامجك، أحسنت!'
              : 'انضم إلى برنامج وابدأ رحلتك التعليمية.'}
          </Text>
        </View>

        {/* HERO: continue learning (newest accepted program) */}
        <View className="px-6 mb-6">
          <View className="bg-tb-navy rounded-[32px] p-6 overflow-hidden shadow-xl shadow-tb-navy/30">
            <View className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <View className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-tb-gold/10" />

            {current ? (
              <>
                <View className="flex-row items-center gap-4">
                  <View className="flex-1 items-start">
                    <Text className="text-white text-xl font-bold leading-8 mb-1" numberOfLines={2}>
                      {current.program.title}
                    </Text>
                    <Text className="text-white/60 text-xs">
                      {current.totalLessons > 0
                        ? `أنجزت ${current.completedLessons} من ${current.totalLessons} دروس`
                        : 'لم تُضف دروس إلى البرنامج بعد'}
                    </Text>
                  </View>
                  <ProgressRing progress={currentPct} />
                </View>

                <View className="flex-row items-center justify-end mt-6">
                  <Pressable
                    onPress={() => router.push({ pathname: '/course/[slug]', params: { slug: current.program.slug } })}
                    accessibilityRole="button"
                    accessibilityLabel="متابعة التعلم"
                    className="bg-tb-gold flex-row items-center gap-2 px-5 py-3 rounded-2xl active:opacity-80"
                  >
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                    <Text className="text-white font-bold text-sm">{currentPct > 0 ? 'متابعة التعلم' : 'ابدأ التعلم'}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text className="text-white text-xl font-bold leading-8 mb-1">
                  {enrollmentsQuery.isPending ? 'جاري تحميل برامجك…' : 'لا يوجد برنامج نشط بعد'}
                </Text>
                <Text className="text-white/60 text-xs leading-5">
                  تصفّح البرامج المتاحة وقدّم طلب انضمام، وسيظهر تقدّمك هنا بعد قبولك.
                </Text>
                <View className="flex-row items-center justify-end mt-6">
                  <Pressable
                    onPress={() => router.push('/(tabs)/courses')}
                    accessibilityRole="button"
                    className="bg-tb-gold flex-row items-center gap-2 px-5 py-3 rounded-2xl active:opacity-80"
                  >
                    <BookOpen size={14} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm">تصفّح البرامج</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>

        {/* STATS: one container, three columns */}
        <View className="px-6 mb-8">
          <View className="bg-white rounded-3xl border border-tb-muted/10 shadow-sm flex-row items-stretch py-5">
            {stats.map(({ id, value, label, Icon, color }, index) => (
              <React.Fragment key={id}>
                {index > 0 && <View className="w-px bg-tb-muted/15 my-1" />}
                <View className="flex-1 items-center">
                  <Icon size={20} color={color} />
                  <Text className="text-tb-navy text-xl font-bold mt-2">{value}</Text>
                  <Text className="text-tb-muted text-xs font-semibold mt-1">{label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* WEEKLY ACTIVITY */}
        <View className="px-6 mb-8">
          <View className="bg-white rounded-3xl border border-tb-muted/10 p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-tb-navy font-bold text-base">نشاطك هذا الأسبوع</Text>
              <View className="flex-row items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full">
                <Flame size={14} color={COLORS.orange} />
                <Text className="text-orange-600 text-xs font-bold">{activeDays} أيام نشطة</Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              {WEEK.map((day, index) => {
                const isToday = index === TODAY_INDEX;
                return (
                  <View key={day.label} className="items-center gap-2">
                    <View
                      className={
                        day.done
                          ? 'w-10 h-10 rounded-full items-center justify-center bg-tb-navy'
                          : isToday
                            ? 'w-10 h-10 rounded-full items-center justify-center border-2 border-tb-gold bg-tb-gold/10'
                            : 'w-10 h-10 rounded-full items-center justify-center bg-tb-background'
                      }
                    >
                      {day.done && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text
                      className={
                        isToday ? 'text-tb-gold text-xs font-bold' : 'text-tb-muted text-xs font-semibold'
                      }
                    >
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* RECOMMENDED COURSES: horizontal carousel */}
        <View className="px-6">
          <SectionHeader title="مقترحة لك" actionLabel="عرض الكل" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          className="mb-8"
        >
          {COURSES.map(({ id, title, lessons, hours, Icon, color, tint }) => (
            <Pressable
              key={id}
              className="w-56 bg-white rounded-3xl border border-tb-muted/10 p-4 active:opacity-80"
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mb-4"
                style={{ backgroundColor: tint }}
              >
                <Icon size={22} color={color} />
              </View>
              <Text
                numberOfLines={2}
                className="text-tb-navy font-bold text-base leading-6 mb-3 items-start"
              >
                {title}
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <BookOpen size={12} color="#A3AED0" />
                  <Text className="text-tb-muted text-xs">{lessons} درس</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color="#A3AED0" />
                  <Text className="text-tb-muted text-xs">{hours} ساعات</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* INCUBATOR: quiet, secondary call to action */}
        <View className="px-6">
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-4 bg-tb-gold/10 border border-tb-gold/30 rounded-3xl p-5 active:opacity-80"
          >
            <View className="w-12 h-12 rounded-2xl bg-tb-gold items-center justify-center">
              <Rocket size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1 items-start">
              <Text className="text-tb-navy font-bold text-base mb-1">حاضنة المشاريع</Text>
              <Text className="text-tb-muted text-xs leading-5">
                احصل على توجيه مباشر من الخبراء وطوّر مشروعك التقني.
              </Text>
            </View>
            <ChevronLeft size={18} color={COLORS.gold} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}