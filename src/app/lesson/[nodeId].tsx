// src/app/lesson/[nodeId].tsx
// One lesson of the curriculum: video, reading material or quiz intro (GET /v1/nodes/:nodeId).
import React, { useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, SearchX } from 'lucide-react-native';

import { useLesson, useLessonProgress } from '@/hooks/useLessons';
import { getApiErrorMessage } from '@/api/errors';
import { StateCard } from '@/components/common/StateCard';
import { ScreenSkeleton, SectionTitle, TopBar, isNotFound } from '@/components/lessons/LessonUi';
import { VideoLesson } from '@/components/lessons/VideoLesson';
import { ReadingLesson } from '@/components/lessons/ReadingLesson';
import { QuizIntro } from '@/components/lessons/QuizIntro';
import { LessonCompletion } from '@/components/lessons/LessonCompletion';
import { getNodeUi } from '@/types/nodeUi';
import type { NodeContent, StudentNodeResource } from '@/types/nodes.contract';

/** Signed FILE links last about an hour; get a fresh one when ours is older than this. */
const RESOURCE_URL_MAX_AGE_MS = 55 * 60 * 1000;

const SCREEN_TITLE: Record<NodeContent['type'], string> = {
  VIDEO_LECTURE: 'محاضرة فيديو',
  READING_MATERIAL: 'مادة قراءة',
  QUIZ: 'اختبار',
};

export default function LessonScreen() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/courses'));

  const query = useLesson(nodeId ?? '');
  const { data, error, isPending, refetch } = query;

  // Removed, quiz unpublished or enrollment no longer active while the lesson was open.
  const reportedGone = useRef(false);
  useEffect(() => {
    if (data && isNotFound(error) && !reportedGone.current) {
      reportedGone.current = true;
      Alert.alert('الدرس غير متاح', 'لم يعد هذا الدرس متاحاً لك.', [{ text: 'حسناً', onPress: goBack }]);
    }
    // goBack is stable enough for this one-shot alert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <TopBar title="الدرس" onBack={goBack} />
        {isPending ? (
          <ScreenSkeleton />
        ) : (
          <View className="flex-1 justify-center px-6">
            {isNotFound(error) ? (
              <StateCard
                Icon={SearchX}
                title="الدرس غير متاح"
                message="قد يكون الدرس حُذف، أو أن تسجيلك في البرنامج لم يُفعَّل بعد."
                actionLabel="العودة"
                onAction={goBack}
              />
            ) : (
              <StateCard
                Icon={AlertCircle}
                title="تعذّر تحميل الدرس"
                message={getApiErrorMessage(error, 'حدث خطأ أثناء تحميل الدرس، حاول مرة أخرى.')}
                actionLabel="إعادة المحاولة"
                onAction={() => void refetch()}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  return <LessonContent lesson={data} query={query} onBack={goBack} />;
}

/** Rendered only with a loaded lesson (see course/[slug].tsx for why the split matters). */
function LessonContent({
  lesson,
  query,
  onBack,
}: {
  lesson: NodeContent;
  query: ReturnType<typeof useLesson>;
  onBack: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const typeUi = getNodeUi(lesson.type);
  const { savePosition, markCompleted } = useLessonProgress(lesson);
  // Read once: the saved position changes while the video plays, the player must not seek again.
  const [resumeAt] = useState(lesson.progress.lastPositionSec);

  const onRefresh = async () => {
    setRefreshing(true);
    const result = await query.refetch();
    setRefreshing(false);
    if (result.isError && !isNotFound(result.error)) {
      Alert.alert('تعذّر تحديث الدرس', getApiErrorMessage(result.error, 'حاول مرة أخرى لاحقاً.'));
    }
  };

  const getFreshResource = async (): Promise<StudentNodeResource | null> => {
    if (lesson.resource?.kind !== 'FILE' || Date.now() - query.dataUpdatedAt < RESOURCE_URL_MAX_AGE_MS) {
      return lesson.resource;
    }
    const fresh = await query.refetch();
    if (fresh.isError) throw fresh.error;
    return fresh.data?.resource ?? null;
  };

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={SCREEN_TITLE[lesson.type]} onBack={onBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#BF9B30']} />}
      >
        {/* Title card */}
        <View className="bg-white p-6 rounded-3xl border border-tb-muted/10 shadow-sm mb-6">
          <Text className="text-tb-muted text-xs font-semibold mb-2" numberOfLines={1}>
            {lesson.program.title}
          </Text>
          <Text accessibilityRole="header" className="text-tb-navy text-xl font-bold leading-8 mb-4">
            {lesson.title}
          </Text>

          <View className="flex-row flex-wrap items-center gap-2">
            <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${typeUi.tintClass}`}>
              <typeUi.Icon size={12} color={typeUi.color} />
              <Text className="text-[11px] font-bold" style={{ color: typeUi.color }}>
                {typeUi.label}
              </Text>
            </View>
            {lesson.isMandatory && (
              <View className="bg-red-50 px-3 py-1.5 rounded-full">
                <Text className="text-red-500 text-[11px] font-bold">إجباري</Text>
              </View>
            )}
            {lesson.isCompleted && (
              <View className="flex-row items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
                <CheckCircle2 size={12} color="#10B981" />
                <Text className="text-emerald-600 text-[11px] font-bold">مكتمل</Text>
              </View>
            )}
          </View>

          {lesson.description ? (
            <Text selectable className="text-tb-navy text-sm leading-6 mt-4">
              {lesson.description}
            </Text>
          ) : null}
        </View>

        {lesson.type === 'VIDEO_LECTURE' && (
          <>
            <VideoLesson video={lesson.video} resumeAt={resumeAt} onPosition={savePosition} />
            {lesson.video?.playbackUrl ? (
              <LessonCompletion
                isCompleted={lesson.isCompleted}
                watchedPct={lesson.progress.completionPct}
                markCompleted={markCompleted}
              />
            ) : null}
          </>
        )}

        {lesson.type === 'READING_MATERIAL' && (
          <>
            <SectionTitle>محتوى الدرس</SectionTitle>
            <ReadingLesson resource={lesson.resource} getFreshResource={getFreshResource} />
            {lesson.resource ? <LessonCompletion isCompleted={lesson.isCompleted} markCompleted={markCompleted} /> : null}
          </>
        )}

        {lesson.type === 'QUIZ' && <QuizIntro quiz={lesson.quiz} />}
      </ScrollView>
    </SafeAreaView>
  );
}
