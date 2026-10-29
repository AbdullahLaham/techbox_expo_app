// src/app/(tabs)/assignments.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertCircle, CalendarClock, ClipboardCheck, Clock } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { TypeFilterTab, type FilterOption } from '@/components/programs/TypeFilterTab';

import { getDueInfo } from '@/components/assignments/assignmentFormat';
import { useAssignments } from '@/hooks/useAssignments';
import { getApiErrorMessage } from '@/api/errors';
import { AssignmentCard, AssignmentCardSkeleton } from '@/components/assignments/Assignmentcard';
import { StateCard } from '@/components/common/StateCard';
import { AssignmentBucket, AssignmentItem, getAssignmentBucket, getAssignmentState } from '@/types/assignments';

/* -------------------------------------------------------------------------- */
/*  Filters                                                                   */
/* -------------------------------------------------------------------------- */

type AssignmentFilter = 'ALL' | 'NEW' | AssignmentBucket;

const FILTER_OPTIONS: FilterOption<AssignmentFilter>[] = [
  { label: 'الكل', value: 'ALL' },
  { label: 'جديدة', value: 'NEW' },
  { label: 'لم تُسلَّم', value: 'TODO' },
  { label: 'تم التسليم', value: 'SUBMITTED' },
  { label: 'مكتملة', value: 'DONE' },
];

const FILTER_LABEL: Record<AssignmentFilter, string> = {
  ALL: 'كل الواجبات',
  NEW: 'واجبات جديدة',
  TODO: 'واجبات لم تُسلَّم',
  SUBMITTED: 'واجبات تم تسليمها',
  DONE: 'واجبات مكتملة',
};

const EMPTY_COPY: Record<AssignmentFilter, { title: string; message: string }> = {
  ALL: { title: 'لا توجد واجبات بعد', message: 'ستظهر هنا واجبات البرامج التي تشترك بها.' },
  NEW: { title: 'لا توجد واجبات جديدة', message: 'ستظهر هنا الواجبات الجديدة فور إضافتها.' },
  TODO: { title: 'أنجزت كل شيء', message: 'لا توجد واجبات تنتظر التسليم حالياً.' },
  SUBMITTED: { title: 'لا توجد تسليمات قيد المراجعة', message: 'ستظهر هنا الواجبات التي سلّمتها وتنتظر التقييم.' },
  DONE: { title: 'لا توجد واجبات مكتملة بعد', message: 'ستظهر هنا الواجبات بعد تقييمها.' },
};

/* -------------------------------------------------------------------------- */
/*  Sorting                                                                   */
/* -------------------------------------------------------------------------- */

const BUCKET_RANK: Record<AssignmentBucket, number> = { TODO: 0, SUBMITTED: 1, DONE: 2 };

const bucketOf = (item: AssignmentItem): AssignmentBucket =>
  getAssignmentBucket(getAssignmentState(item));

/**
 * Things the student must do come first (earliest deadline first, no deadline last),
 * then submitted work, then closed work. Within the last two, most recent first.
 */
function compareAssignments(a: AssignmentItem, b: AssignmentItem): number {
  const bucketA = bucketOf(a);
  const bucketB = bucketOf(b);
  if (bucketA !== bucketB) return BUCKET_RANK[bucketA] - BUCKET_RANK[bucketB];

  if (bucketA === 'TODO') {
    const dueA = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
    const dueB = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
    if (dueA !== dueB) return dueA < dueB ? -1 : 1;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  }

  const recentA = Date.parse(a.submission?.submittedAt ?? a.createdAt);
  const recentB = Date.parse(b.submission?.submittedAt ?? b.createdAt);
  return recentB - recentA;
}

/* -------------------------------------------------------------------------- */
/*  Next-due hero                                                             */
/* -------------------------------------------------------------------------- */

function NextDueCard({ item, onPress }: { item: AssignmentItem; onPress: () => void }) {
  const due = getDueInfo(item.dueDate, item.isOverdue);

  return (
    <View className="px-6 mb-6">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`أقرب موعد تسليم: ${item.title}`}
        className="bg-tb-navy rounded-[32px] p-6 overflow-hidden shadow-xl shadow-tb-navy/30 active:opacity-95"
      >
        <View className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <View className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-tb-gold/10" />

        <View className="flex-row items-center gap-2 mb-3">
          <CalendarClock size={16} color="#BF9B30" />
          <Text className="text-tb-gold text-xs font-bold">أقرب موعد تسليم</Text>
        </View>

        <Text className="text-white text-xl font-bold leading-8 mb-1" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-white/60 text-xs" numberOfLines={1}>
          {item.program.title}
        </Text>

        <View className="flex-row items-center justify-between mt-5">
          <View className="flex-row items-center gap-2">
            <Clock size={14} color="rgba(255,255,255,0.6)" />
            <Text className="text-white/80 text-xs font-semibold">{due.label}</Text>
          </View>
          <View className="bg-tb-gold px-5 py-3 rounded-2xl">
            <Text className="text-white font-bold text-sm">عرض الواجب</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function AssignmentsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<AssignmentFilter>('ALL');
  // Only a pull shows the spinner; focus refetches stay silent (the list is already on screen).
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Cached and refetched on focus / app foreground (see useAssignments).
  const assignmentsQuery = useAssignments();
  const items = useMemo(() => assignmentsQuery.data ?? [], [assignmentsQuery.data]);
  const loading = assignmentsQuery.isPending;
  // Offline -> "تعذّر الاتصال بالخادم…"; server errors keep their own message.
  const error = assignmentsQuery.error
    ? getApiErrorMessage(assignmentsQuery.error, 'تعذّر تحميل الواجبات، حاول مرة أخرى.')
    : null;
  const { refetch } = assignmentsQuery;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const sorted = useMemo(() => [...items].sort(compareAssignments), [items]);

  const counts = useMemo<Record<AssignmentFilter, number>>(() => {
    const result: Record<AssignmentFilter, number> = { ALL: sorted.length, NEW: 0, TODO: 0, SUBMITTED: 0, DONE: 0 };
    for (const item of sorted) {
      if (item.isNew) result.NEW += 1;
      result[bucketOf(item)] += 1;
    }
    return result;
  }, [sorted]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'ALL':
        return sorted;
      case 'NEW':
        return sorted.filter((item) => item.isNew);
      default:
        return sorted.filter((item) => bucketOf(item) === filter);
    }
  }, [sorted, filter]);

  // Earliest upcoming deadline among work the student still has to do.
  const nextDue = useMemo(
    () =>
      sorted.find((item) => bucketOf(item) === 'TODO' && item.dueDate !== null && !item.isOverdue) ?? null,
    [sorted],
  );

  const openAssignment = useCallback(
    (id: string) => router.push({ pathname: '/assignment/[assignmentId]', params: { assignmentId: id } }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: AssignmentItem }) => (
      <View className="px-6">
        <AssignmentCard item={item} onPress={() => openAssignment(item.id)} />
      </View>
    ),
    [openAssignment],
  );

  const listHeader = (
    <View className="pt-4">
      {nextDue && !loading ? <NextDueCard item={nextDue} onPress={() => openAssignment(nextDue.id)} /> : null}

      <TypeFilterTab options={FILTER_OPTIONS} selectedValue={filter} onSelect={setFilter} counts={counts} />

      {error && items.length > 0 ? (
        <View className="mx-6 mb-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <Text className="text-red-600 text-xs font-semibold">{error}</Text>
        </View>
      ) : null}

      <View className="px-6 flex-row items-center gap-2 mb-4">
        <Text className="text-tb-navy text-lg font-bold">{FILTER_LABEL[filter]}</Text>
        {!loading && (
          <View className="bg-tb-gold/15 px-2.5 py-0.5 rounded-full">
            <Text className="text-tb-gold text-xs font-bold">{filtered.length}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const listEmpty = loading ? (
    <View className="px-6">
      <AssignmentCardSkeleton />
      <AssignmentCardSkeleton />
      <AssignmentCardSkeleton />
    </View>
  ) : error ? (
    <View className="px-6">
      <StateCard
        Icon={AlertCircle}
        title="حدث خطأ"
        message={error}
        actionLabel="إعادة المحاولة"
        onAction={onRetry}
      />
    </View>
  ) : (
    <View className="px-6">
      <StateCard
        Icon={ClipboardCheck}
        title={EMPTY_COPY[filter].title}
        message={EMPTY_COPY[filter].message}
        actionLabel={filter !== 'ALL' && items.length > 0 ? 'عرض كل الواجبات' : undefined}
        onAction={filter !== 'ALL' && items.length > 0 ? () => setFilter('ALL') : undefined}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Header title="الواجبات" showUser={false} />

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#BF9B30']} />}
      />
    </SafeAreaView>
  );
}