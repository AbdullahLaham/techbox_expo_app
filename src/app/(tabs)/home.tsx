// src/app/(tabs)/home.tsx
// Home tab: one request (GET /v1/home) feeds every section. The server decides the facts
// (progress, next lesson, active days); this screen only decides how they look.
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlarmClockOff,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flame,
  Hourglass,
  Play,
  Rocket,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Header } from '@/components/Header';
import { StateCard } from '@/components/common/StateCard';
import { ProgressRing } from '@/components/common/ProgressRing';
import { ProgramCover } from '@/components/programs/ProgramCover';
import {
  BLOCK_REASON_LABEL,
  LOW_SEATS,
  hoursLabel,
  lessonsLabel,
  seatsLabel,
} from '@/components/programs/programTypeUi';
import { DUE_TONE_CLASS, DUE_TONE_COLOR, STATE_UI, getDueInfo } from '@/components/assignments/assignmentFormat';
import { getNodeUi } from '@/types/nodeUi';
import { getApiErrorMessage } from '@/api/errors';
import { useHome } from '@/hooks/useHome';
import type {
  HomeActivityDay,
  HomeAssignmentsSummary,
  HomeContinueLearning,
  HomeIncubator,
  HomeNextLesson,
  HomeRecommendedProgram,
  HomeStats,
  HomeUpcomingAssignment,
  Weekday,
} from '@/types/home.contract';

const COLORS = {
  navy: '#1B254B',
  gold: '#BF9B30',
  green: '#10B981',
  orange: '#F97316',
  muted: '#A3AED0',
} as const;

const WEEKDAY_UI: Record<Weekday, { short: string; name: string }> = {
  SAT: { short: 'س', name: 'السبت' },
  SUN: { short: 'ح', name: 'الأحد' },
  MON: { short: 'ن', name: 'الاثنين' },
  TUE: { short: 'ث', name: 'الثلاثاء' },
  WED: { short: 'ر', name: 'الأربعاء' },
  THU: { short: 'خ', name: 'الخميس' },
  FRI: { short: 'ج', name: 'الجمعة' },
};

/** Shown while the first response loads: the strip keeps its shape. */
const PLACEHOLDER_WEEK: HomeActivityDay[] = (Object.keys(WEEKDAY_UI) as Weekday[]).map((weekday) => ({
  date: weekday,
  weekday,
  isActive: false,
  isToday: false,
  isFuture: false,
}));

const activeDaysLabel = (n: number) =>
  n === 1 ? 'يوم نشط' : n === 2 ? 'يومان نشطان' : n >= 3 && n <= 10 ? `${n} أيام نشطة` : `${n} يوماً نشطاً`;

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

type SectionHeaderProps = { title: string; actionLabel?: string; onActionPress?: () => void };

function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-tb-navy text-lg font-bold">{title}</Text>
      {actionLabel ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          accessibilityRole="button"
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
/*  Hero: continue learning                                                   */
/* -------------------------------------------------------------------------- */

type HeroProps = {
  data: HomeContinueLearning | null;
  loading: boolean;
  pendingApplications: number;
  onOpenLesson: (lesson: HomeNextLesson) => void;
  onOpenProgram: (slug: string) => void;
  onBrowse: () => void;
};

function ContinueLearningCard({ data, loading, pendingApplications, onOpenLesson, onOpenProgram, onBrowse }: HeroProps) {
  return (
    <View className="bg-tb-navy rounded-[32px] p-6 overflow-hidden shadow-xl shadow-tb-navy/30">
      <View className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/5" />
      <View className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-tb-gold/10" />
      {data ? (
        <ActiveProgramHero data={data} onOpenLesson={onOpenLesson} onOpenProgram={onOpenProgram} />
      ) : (
        <>
          <Text className="text-white text-xl font-bold leading-8 mb-1">
            {loading ? 'جاري تحميل برامجك…' : pendingApplications > 0 ? 'طلبك قيد المراجعة' : 'لا يوجد برنامج نشط بعد'}
          </Text>
          <Text className="text-white/60 text-xs leading-5">
            {pendingApplications > 0
              ? 'سيظهر تقدّمك هنا فور قبول طلب انضمامك. يمكنك تصفّح برامج أخرى في الأثناء.'
              : 'تصفّح البرامج المتاحة وقدّم طلب انضمام، وسيظهر تقدّمك هنا بعد قبولك.'}
          </Text>
          {!loading && (
            <View className="flex-row items-center justify-end mt-6">
              <Pressable
                onPress={onBrowse}
                accessibilityRole="button"
                className="bg-tb-gold flex-row items-center gap-2 px-5 py-3 rounded-2xl active:opacity-80"
              >
                <BookOpen size={14} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm">تصفّح البرامج</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function ActiveProgramHero({
  data,
  onOpenLesson,
  onOpenProgram,
}: Pick<HeroProps, 'onOpenLesson' | 'onOpenProgram'> & { data: HomeContinueLearning }) {
  const { program, nextLesson, totalLessons, completedLessons } = data;
  const pct = Math.min(100, Math.round(data.progressPct));
  const lessonUi = nextLesson ? getNodeUi(nextLesson.type) : null;
  const openProgram = () => onOpenProgram(program.slug);

  return (
    <>
      <Pressable
        onPress={openProgram}
        accessibilityRole="button"
        accessibilityLabel={`${program.title}، أنجزت ${pct}%`}
        className="flex-row items-center gap-4 active:opacity-80"
      >
        <View className="flex-1 items-start">
          <Text className="text-white text-xl font-bold leading-8 mb-1" numberOfLines={2}>
            {program.title}
          </Text>
          <Text className="text-white/60 text-xs">
            {totalLessons > 0 ? `أنجزت ${completedLessons} من ${totalLessons} دروس` : 'لم تُضف دروس إلى البرنامج بعد'}
          </Text>
        </View>
        <ProgressRing progress={pct} size={84} stroke={8} trackColor="rgba(255,255,255,0.12)">
          <Text className="text-white text-lg font-bold">{pct}%</Text>
        </ProgressRing>
      </Pressable>

      {nextLesson && lessonUi ? (
        <>
          <View className="flex-row items-center gap-3 bg-white/10 rounded-2xl p-3 mt-5">
            <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
              <lessonUi.Icon size={18} color={COLORS.gold} />
            </View>
            <View className="flex-1 items-start">
              <Text className="text-white/60 text-[11px] font-semibold">الدرس التالي · {lessonUi.label}</Text>
              <Text className="text-white text-sm font-bold leading-6" numberOfLines={1}>
                {nextLesson.title}
              </Text>
              <Text className="text-white/50 text-[11px]" numberOfLines={1}>
                {nextLesson.moduleTitle}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-5">
            <Pressable onPress={openProgram} hitSlop={8} accessibilityRole="button" className="active:opacity-60">
              <Text className="text-white/70 text-xs font-bold">تفاصيل البرنامج</Text>
            </Pressable>
            <Pressable
              onPress={() => onOpenLesson(nextLesson)}
              accessibilityRole="button"
              accessibilityLabel={`متابعة التعلم: ${nextLesson.title}`}
              className="bg-tb-gold flex-row items-center gap-2 px-5 py-3 rounded-2xl active:opacity-80"
            >
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text className="text-white font-bold text-sm">{data.lastActivityAt ? 'متابعة التعلم' : 'ابدأ التعلم'}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View className="flex-row items-center justify-between gap-3 mt-6">
          <Text className="text-white/70 text-xs leading-5 flex-1">
            {totalLessons > 0 ? 'لا توجد دروس متبقية الآن، أحسنت!' : 'ستظهر الدروس هنا فور إضافتها.'}
          </Text>
          <Pressable
            onPress={openProgram}
            accessibilityRole="button"
            className="bg-tb-gold flex-row items-center gap-2 px-5 py-3 rounded-2xl active:opacity-80"
          >
            <BookOpen size={14} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">عرض البرنامج</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats & weekly activity                                                   */
/* -------------------------------------------------------------------------- */

function StatsRow({ stats }: { stats: HomeStats | undefined }) {
  const items: { id: string; value: number | undefined; label: string; Icon: LucideIcon; color: string }[] = [
    { id: 'programs', value: stats?.activePrograms, label: 'برامج حالية', Icon: BookOpen, color: COLORS.navy },
    { id: 'lessons', value: stats?.completedLessons, label: 'دروس منجزة', Icon: CheckCircle2, color: COLORS.gold },
    { id: 'completed', value: stats?.completedPrograms, label: 'برامج مكتملة', Icon: Award, color: COLORS.green },
  ];

  return (
    <View className="bg-white rounded-3xl border border-tb-muted/10 shadow-sm flex-row items-stretch py-5">
      {items.map(({ id, value, label, Icon, color }, index) => (
        <React.Fragment key={id}>
          {index > 0 && <View className="w-px bg-tb-muted/15 my-1" />}
          <View className="flex-1 items-center">
            <Icon size={20} color={color} />
            <Text className="text-tb-navy text-xl font-bold mt-2">{value ?? '–'}</Text>
            <Text className="text-tb-muted text-xs font-semibold mt-1">{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

function WeeklyActivity({ days, activeCount }: { days: HomeActivityDay[]; activeCount: number | null }) {
  return (
    <View className="bg-white rounded-3xl border border-tb-muted/10 p-5">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-tb-navy font-bold text-base">نشاطك هذا الأسبوع</Text>
        {activeCount != null && activeCount > 0 && (
          <View className="flex-row items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full">
            <Flame size={14} color={COLORS.orange} />
            <Text className="text-orange-600 text-xs font-bold">{activeDaysLabel(activeCount)}</Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between">
        {days.map((day) => {
          const { short, name } = WEEKDAY_UI[day.weekday];
          return (
            <View
              key={day.date}
              accessible
              accessibilityLabel={`${name}${day.isToday ? '، اليوم' : ''}: ${day.isActive ? 'نشط' : 'لا نشاط'}`}
              className="items-center gap-2"
            >
              <View
                className={
                  day.isActive
                    ? 'w-10 h-10 rounded-full items-center justify-center bg-tb-navy'
                    : day.isToday
                      ? 'w-10 h-10 rounded-full items-center justify-center border-2 border-tb-gold bg-tb-gold/10'
                      : day.isFuture
                        ? 'w-10 h-10 rounded-full items-center justify-center border border-dashed border-tb-muted/30'
                        : 'w-10 h-10 rounded-full items-center justify-center bg-tb-background'
                }
              >
                {day.isActive && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text
                className={
                  day.isToday
                    ? 'text-tb-gold text-xs font-bold'
                    : day.isFuture
                      ? 'text-tb-muted/50 text-xs font-semibold'
                      : 'text-tb-muted text-xs font-semibold'
                }
              >
                {short}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Assignments: what the student must hand in next                           */
/* -------------------------------------------------------------------------- */

const moreAssignmentsLabel = (n: number) =>
  n === 1 ? 'وواجب آخر' : n === 2 ? 'وواجبان آخران' : n <= 10 ? `و${n} واجبات أخرى` : `و${n} واجباً آخر`;

/** Same badge as the Assignments tab: "متأخر" overrides the state when the deadline has passed. */
function assignmentBadge(item: HomeUpcomingAssignment) {
  return item.isOverdue
    ? { label: 'متأخر', Icon: AlarmClockOff, color: '#EF4444', tint: 'rgba(239,68,68,0.10)' }
    : STATE_UI[item.state];
}

function UpcomingAssignmentRow({ item, onPress }: { item: HomeUpcomingAssignment; onPress: () => void }) {
  const badge = assignmentBadge(item);
  const due = getDueInfo(item.dueDate, item.isOverdue);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}، ${badge.label}، ${due.label}`}
      className="flex-row items-center gap-3 py-3 active:opacity-70"
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: badge.tint }}>
        <badge.Icon size={18} color={badge.color} />
      </View>
      <View className="flex-1 items-start">
        <Text className="text-tb-navy text-sm font-bold leading-6" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-tb-muted text-[11px]" numberOfLines={1}>
          {item.program.title}
        </Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <Clock size={11} color={DUE_TONE_COLOR[due.tone]} />
          <Text className={`text-[11px] font-semibold ${DUE_TONE_CLASS[due.tone]}`}>{due.label}</Text>
        </View>
      </View>
      <Text className="text-[11px] font-bold" style={{ color: badge.color }}>
        {badge.label}
      </Text>
    </Pressable>
  );
}

function AssignmentsCard({
  summary,
  onOpen,
}: {
  summary: HomeAssignmentsSummary;
  onOpen: (assignmentId: string) => void;
}) {
  const { todoCount, overdueCount, awaitingReviewCount, upcoming } = summary;
  const more = todoCount - upcoming.length;

  return (
    <View className="bg-white rounded-3xl border border-tb-muted/10 px-5 pt-4 pb-2">
      <View className="flex-row flex-wrap items-center gap-2 mb-1">
        {overdueCount > 0 && (
          <View className="flex-row items-center gap-1 bg-red-500/10 px-3 py-1 rounded-full">
            <AlarmClockOff size={12} color="#EF4444" />
            <Text className="text-red-600 text-xs font-bold">متأخرة: {overdueCount}</Text>
          </View>
        )}
        {todoCount > 0 && (
          <View className="flex-row items-center gap-1 bg-tb-gold/10 px-3 py-1 rounded-full">
            <Clock size={12} color={COLORS.gold} />
            <Text className="text-tb-gold text-xs font-bold">للتسليم: {todoCount}</Text>
          </View>
        )}
        {awaitingReviewCount > 0 && (
          <View className="flex-row items-center gap-1 bg-tb-navy/5 px-3 py-1 rounded-full">
            <Hourglass size={12} color={COLORS.navy} />
            <Text className="text-tb-navy text-xs font-bold">بانتظار التقييم: {awaitingReviewCount}</Text>
          </View>
        )}
      </View>

      {upcoming.length > 0 ? (
        upcoming.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <View className="h-px bg-tb-muted/10" />}
            <UpcomingAssignmentRow item={item} onPress={() => onOpen(item.id)} />
          </React.Fragment>
        ))
      ) : (
        <View className="flex-row items-center gap-2 py-3">
          <CheckCircle2 size={16} color={COLORS.green} />
          <Text className="text-tb-muted text-xs flex-1">لا توجد واجبات مطلوبة منك الآن، سلّمت كل شيء.</Text>
        </View>
      )}

      {more > 0 && <Text className="text-tb-muted text-[11px] pb-2">{moreAssignmentsLabel(more)} في صفحة الواجبات</Text>}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recommended programs & incubator                                          */
/* -------------------------------------------------------------------------- */

function RecommendedCard({ program, onPress }: { program: HomeRecommendedProgram; onPress: () => void }) {
  const hours = program.videoDurationSec > 0 ? Math.max(1, Math.round(program.videoDurationSec / 3600)) : 0;
  const seatsLeft = program.seatsRemaining;
  const status = !program.canEnroll
    ? { text: BLOCK_REASON_LABEL[program.enrollmentBlockReason ?? 'NOT_AVAILABLE'], className: 'text-tb-muted' }
    : seatsLeft != null && seatsLeft <= LOW_SEATS
      ? { text: `تبقّى ${seatsLabel(seatsLeft)}`, className: 'text-orange-600' }
      : { text: 'التسجيل مفتوح', className: 'text-emerald-600' };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${program.title}، ${status.text}`}
      className="w-56 bg-white rounded-3xl border border-tb-muted/10 p-4 active:opacity-80"
    >
      <ProgramCover coverImage={program.coverImage} type={program.type} className="w-12 h-12 rounded-2xl mb-4" iconSize={22} />
      <Text numberOfLines={2} className="text-tb-navy font-bold text-base leading-6 mb-3" style={{ minHeight: 48 }}>
        {program.title}
      </Text>
      <View className="flex-row items-center gap-3 mb-3">
        {program.lessonsCount > 0 && (
          <View className="flex-row items-center gap-1">
            <BookOpen size={12} color={COLORS.muted} />
            <Text className="text-tb-muted text-xs">{lessonsLabel(program.lessonsCount)}</Text>
          </View>
        )}
        {hours > 0 && (
          <View className="flex-row items-center gap-1">
            <Clock size={12} color={COLORS.muted} />
            <Text className="text-tb-muted text-xs">{hoursLabel(hours)}</Text>
          </View>
        )}
      </View>
      <Text className={`text-[11px] font-bold ${status.className}`}>{status.text}</Text>
    </Pressable>
  );
}

function incubatorMessage(incubator: HomeIncubator): string {
  switch (incubator.myEnrollmentStatus) {
    case 'ACTIVE':
      return 'أنت مشارك في هذه الدفعة، تابع رحلتك مع الحاضنة.';
    case 'PENDING':
      return 'طلب انضمامك قيد المراجعة من الإدارة.';
    case 'COMPLETED':
      return 'أتممت هذه الدفعة بنجاح، أحسنت!';
    case 'SUSPENDED':
      return 'مشاركتك معلّقة حالياً، تواصل مع الإدارة.';
    default:
      // Never applied, or rejected / dropped (they may apply again).
      return incubator.canEnroll
        ? 'احصل على توجيه مباشر من الخبراء وطوّر مشروعك التقني. التسجيل مفتوح الآن.'
        : `${BLOCK_REASON_LABEL[incubator.enrollmentBlockReason ?? 'NOT_AVAILABLE']}، تابعنا لمعرفة موعد الدفعة القادمة.`;
  }
}

function IncubatorCard({ incubator, onPress }: { incubator: HomeIncubator; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`حاضنة المشاريع: ${incubator.program.title}`}
      className="flex-row items-center gap-4 bg-tb-gold/10 border border-tb-gold/30 rounded-3xl p-5 active:opacity-80"
    >
      <View className="w-12 h-12 rounded-2xl bg-tb-gold items-center justify-center">
        <Rocket size={22} color="#FFFFFF" />
      </View>
      <View className="flex-1 items-start">
        <Text className="text-tb-gold text-[11px] font-bold mb-0.5">حاضنة المشاريع</Text>
        <Text className="text-tb-navy font-bold text-base mb-1" numberOfLines={1}>
          {incubator.program.title}
        </Text>
        <Text className="text-tb-muted text-xs leading-5">{incubatorMessage(incubator)}</Text>
      </View>
      <ChevronLeft size={18} color={COLORS.gold} />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function HomeScreen() {
  const router = useRouter();
  const query = useHome();
  const home = query.data;
  const loading = query.isPending;

  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = query;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openProgram = (slug: string) => router.push({ pathname: '/course/[slug]', params: { slug } });
  const openLesson = (lesson: HomeNextLesson) =>
    lesson.assignmentId
      ? router.push({ pathname: '/assignment/[assignmentId]', params: { assignmentId: lesson.assignmentId } })
      : router.push({ pathname: '/lesson/[nodeId]', params: { nodeId: lesson.id } });
  const browse = () => router.navigate('/(tabs)/courses');
  const openAssignment = (assignmentId: string) =>
    router.push({ pathname: '/assignment/[assignmentId]', params: { assignmentId } });
  const allAssignments = () => router.navigate('/(tabs)/assignments');

  const continueLearning = home?.continueLearning ?? null;
  const incubator = home?.incubator ?? null;
  const pct = continueLearning ? Math.round(continueLearning.progressPct) : 0;

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />}
      >
        {/* GREETING */}
        <View className="px-6 mb-5 items-start">
          <Text className="text-tb-navy text-2xl font-bold mb-1">مرحباً بك 👋</Text>
          <Text className="text-tb-muted text-sm">
            {loading
              ? 'نجهّز لك ملخّص يومك…'
              : continueLearning
                ? continueLearning.nextLesson
                  ? pct > 0
                    ? 'واصل من حيث توقفت، أنت تتقدّم بثبات.'
                    : 'برنامجك جاهز، ابدأ أول درس الآن.'
                  : 'أنجزت كل الدروس المتاحة في برنامجك، أحسنت!'
                : 'انضم إلى برنامج وابدأ رحلتك التعليمية.'}
          </Text>
        </View>

        {query.isError && !home ? (
          <View className="px-6">
            <StateCard
              Icon={WifiOff}
              title="تعذّر تحميل الصفحة الرئيسية"
              message={getApiErrorMessage(query.error, 'حدث خطأ غير متوقع، حاول مرة أخرى.')}
              actionLabel="إعادة المحاولة"
              onAction={() => void refetch()}
            />
          </View>
        ) : (
          <>
            {/* HERO: continue learning */}
            <View className="px-6 mb-6">
              <ContinueLearningCard
                data={continueLearning}
                loading={loading}
                pendingApplications={home?.stats.pendingApplications ?? 0}
                onOpenLesson={openLesson}
                onOpenProgram={openProgram}
                onBrowse={browse}
              />
            </View>

            {/* STATS */}
            <View className="px-6 mb-8">
              <StatsRow stats={home?.stats} />
            </View>

            {/* ASSIGNMENTS: nearest deadlines first (hidden when the student has none at all) */}
            {home && home.assignments.todoCount + home.assignments.awaitingReviewCount > 0 && (
              <View className="px-6 mb-8">
                <SectionHeader title="واجباتك" actionLabel="عرض الكل" onActionPress={allAssignments} />
                <AssignmentsCard summary={home.assignments} onOpen={openAssignment} />
              </View>
            )}

            {/* WEEKLY ACTIVITY (Saturday → Friday, device timezone) */}
            <View className="px-6 mb-8">
              <WeeklyActivity
                days={home?.weeklyActivity.days ?? PLACEHOLDER_WEEK}
                activeCount={home?.weeklyActivity.activeDaysCount ?? null}
              />
            </View>

            {/* RECOMMENDED PROGRAMS */}
            {home && home.recommendedPrograms.length > 0 && (
              <>
                <View className="px-6">
                  <SectionHeader title="مقترحة لك" actionLabel="عرض الكل" onActionPress={browse} />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                  className="mb-8"
                >
                  {home.recommendedPrograms.map((program) => (
                    <RecommendedCard key={program.id} program={program} onPress={() => openProgram(program.slug)} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* INCUBATOR */}
            {incubator && (
              <View className="px-6">
                <IncubatorCard incubator={incubator} onPress={() => openProgram(incubator.program.slug)} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
