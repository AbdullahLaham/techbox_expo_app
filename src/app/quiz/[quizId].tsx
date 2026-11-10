// src/app/quiz/[quizId].tsx
// Taking a quiz: GET /v1/quizzes/:quizId, then a local-first attempt. Answers, the current question
// and the deadline are saved on the device as the student goes (useQuizSessionStore) and survive an
// app restart. The server receives a single POST .../attempts on submit or when the timer runs out.
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  History,
  SearchX,
  Send,
  Timer,
  TimerOff,
  type LucideIcon,
} from 'lucide-react-native';

import { lessonKeys, useQuiz, useSubmitQuiz } from '@/hooks/useLessons';
import { useCountdown, useQuizSession } from '@/hooks/useQuizSession';
import { useAuthStore } from '@/store/useAuthStore';
import {
  isSessionSubmittedElsewhere,
  quizSessionKey,
  useQuizSessionStore,
  useStoredQuizSession,
} from '@/store/useQuizSessionStore';
import { getApiErrorMessage } from '@/api/errors';
import { StateCard } from '@/components/common/StateCard';
import { formatScore } from '@/components/assignments/assignmentFormat';
import { ScreenSkeleton, TopBar, errorCode, formatDuration, isNotFound } from '@/components/lessons/LessonUi';
import type { StudentQuiz, StudentQuizQuestion } from '@/types/nodes.contract';

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];
/** Width of one navigator bubble including its margins (used by getItemLayout). */
const NAV_ITEM = 44;

export default function QuizScreen() {
  const { quizId = '' } = useLocalSearchParams<{ quizId: string }>();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/courses'));

  const { data, error, isPending, refetch } = useQuiz(quizId);
  const userId = useAuthStore((s) => s.user?.id);
  const hasHydrated = useQuizSessionStore((s) => s.hasHydrated);
  const stored = useStoredQuizSession(userId, quizId);
  const clearSession = useQuizSessionStore((s) => s.clearSession);

  // No attempts left (e.g. used on another device): a saved draft can never be submitted.
  const noAttemptsLeft = data?.attemptsRemaining === 0;
  useEffect(() => {
    if (noAttemptsLeft && stored && userId) clearSession(quizSessionKey(userId, quizId));
  }, [noAttemptsLeft, stored, userId, quizId, clearSession]);

  if (!data || !hasHydrated || !userId) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <TopBar title="الاختبار" onBack={goBack} />
        {isPending || (data && !hasHydrated) ? (
          <ScreenSkeleton />
        ) : (
          <View className="flex-1 justify-center px-6">
            {isNotFound(error) ? (
              <StateCard
                Icon={SearchX}
                title="الاختبار غير متاح"
                message="قد يكون الاختبار أُلغي نشره أو حُذف، أو أن تسجيلك في البرنامج غير فعّال."
                actionLabel="العودة"
                onAction={goBack}
              />
            ) : (
              <StateCard
                Icon={AlertCircle}
                title="تعذّر تحميل الاختبار"
                message={getApiErrorMessage(error, 'حدث خطأ أثناء تحميل الاختبار، حاول مرة أخرى.')}
                actionLabel="إعادة المحاولة"
                onAction={() => void refetch()}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (noAttemptsLeft) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <TopBar title={data.title} onBack={goBack} />
        <View className="flex-1 justify-center px-6">
          <StateCard
            Icon={Ban}
            title="لا توجد محاولات متبقية"
            message="استنفدت عدد المحاولات المسموح بها لهذا الاختبار."
            actionLabel="العودة إلى الدرس"
            onAction={goBack}
          />
        </View>
      </SafeAreaView>
    );
  }

  // The saved attempt was already counted by the server (its response was lost, or another device
  // submitted). Never resubmit it: offer the result or a fresh attempt instead.
  if (stored && isSessionSubmittedElsewhere(stored, data)) {
    const lastAttemptId = data.lastAttemptId;
    const startOver = () => clearSession(quizSessionKey(userId, quizId));
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <TopBar title={data.title} onBack={goBack} />
        <View className="flex-1 justify-center px-6">
          <StateCard
            Icon={History}
            title="سُلّمت هذه المحاولة مسبقاً"
            message="سجّل الخادم محاولتك السابقة بالفعل، لذا لن تُرسل مرة أخرى."
            actionLabel={lastAttemptId ? 'عرض النتيجة' : 'بدء محاولة جديدة'}
            onAction={() => {
              startOver();
              if (lastAttemptId) router.replace({ pathname: '/quiz/attempt/[attemptId]', params: { attemptId: lastAttemptId } });
            }}
          />
          {lastAttemptId ? (
            <Pressable onPress={startOver} accessibilityRole="button" className="self-center mt-4 p-2 active:opacity-60">
              <Text className="text-tb-navy text-sm font-bold">بدء محاولة جديدة</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return <QuizForm quiz={data} userId={userId} onBack={goBack} />;
}

/* -------------------------------------------------------------------------- */
/*  Attempt                                                                   */
/* -------------------------------------------------------------------------- */

function QuizForm({ quiz, userId, onBack }: { quiz: StudentQuiz; userId: string; onBack: () => void }) {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const submit = useSubmitQuiz(quiz.id);

  const [questions] = useState(() => [...quiz.questions].sort((a, b) => a.orderIndex - b.orderIndex));
  const { session, restored, expiredOnArrival, selectAnswer, goTo, clear } = useQuizSession(quiz, questions, userId);
  const { answers, currentIndex } = session;

  const remainingMs = useCountdown(session.expiresAt);
  const timed = remainingMs !== null;
  const expired = remainingMs === 0;

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const unanswered = questions.length - answeredCount;
  const question = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;

  const [timeoutSubmitFailed, setTimeoutSubmitFailed] = useState(false);
  const [showRestored, setShowRestored] = useState(restored && !expiredOnArrival);
  useEffect(() => {
    if (!showRestored) return;
    const timeout = setTimeout(() => setShowRestored(false), 4500);
    return () => clearTimeout(timeout);
  }, [showRestored]);

  /* ------------------------------ Leaving --------------------------------- */

  const allowLeave = useRef(false);
  const submitting = useRef(false);
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (allowLeave.current) return;
      if (submitting.current) {
        e.preventDefault(); // let the single submit finish
        return;
      }
      // Progress is already saved on the device; only a running timer needs a warning.
      if (!timed || expired) return;
      e.preventDefault();
      Alert.alert(
        'مغادرة الاختبار؟',
        'إجاباتك محفوظة على جهازك ويمكنك المتابعة لاحقاً، لكن المؤقت يستمر في العد أثناء غيابك.',
        [
          { text: 'متابعة الاختبار', style: 'cancel' },
          { text: 'مغادرة', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
  }, [navigation, timed, expired]);

  const leave = () => {
    allowLeave.current = true;
    onBack();
  };

  /* ------------------------------ Submitting ------------------------------ */

  const send = (reason: 'manual' | 'timeout') => {
    if (submitting.current) return;
    submitting.current = true;
    setTimeoutSubmitFailed(false);

    submit.mutate(
      { answers: questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] ?? null })) },
      {
        onSuccess: (result) => {
          // The server has the attempt: the local draft is no longer needed.
          clear();
          allowLeave.current = true;
          if (!result.id) {
            // Staff preview: graded but not saved, so there is no result page to open.
            onBack();
            Alert.alert('نتيجة المعاينة', `${formatScore(result.score)} / ${formatScore(result.totalScore)}`);
            return;
          }
          router.replace({ pathname: '/quiz/attempt/[attemptId]', params: { attemptId: result.id, fresh: '1' } });
          if (reason === 'timeout') {
            Alert.alert(
              'انتهى وقت الاختبار',
              expiredOnArrival
                ? 'انتهى الوقت أثناء غيابك، فسُلّمت إجاباتك المحفوظة تلقائياً.'
                : 'انتهى الوقت المحدد، وسُلّمت إجاباتك تلقائياً.',
            );
          }
        },
        onError: (e) => {
          submitting.current = false;
          const code = errorCode(e);
          if (code === 'MAX_ATTEMPTS_REACHED' || isNotFound(e)) {
            clear(); // this draft can never be accepted
            void queryClient.invalidateQueries({ queryKey: lessonKeys.node(quiz.nodeId) });
            Alert.alert(
              code === 'MAX_ATTEMPTS_REACHED' ? 'لا توجد محاولات متبقية' : 'الاختبار غير متاح',
              getApiErrorMessage(e, 'لم يعد هذا الاختبار متاحاً.'),
              [{ text: 'حسناً', onPress: leave }],
            );
            return;
          }
          // Network or server problem: the answers stay saved on the device for a retry.
          if (reason === 'timeout') {
            setTimeoutSubmitFailed(true);
            Alert.alert(
              'انتهى وقت الاختبار',
              'تعذّر تسليم إجاباتك الآن، لكنها محفوظة على جهازك. تحقق من اتصالك ثم أعد المحاولة.',
              [
                { text: 'لاحقاً', style: 'cancel' },
                { text: 'إعادة المحاولة', onPress: () => send('timeout') },
              ],
            );
            return;
          }
          Alert.alert('تعذّر تسليم الاختبار', getApiErrorMessage(e, 'حدث خطأ أثناء التسليم، حاول مرة أخرى.'));
        },
      },
    );
  };

  // Deadline reached (now, or while the app was closed): submit whatever is saved, once.
  const onExpire = useEffectEvent(() => send('timeout'));
  useEffect(() => {
    if (expired) onExpire();
  }, [expired]);

  const confirmSubmit = () => {
    if (submitting.current) return;
    Alert.alert(
      'تسليم الاختبار',
      unanswered > 0
        ? `لم تُجب على ${unanswered} من ${questions.length} أسئلة، وستُحتسب بدون درجة. هل تريد التسليم؟`
        : 'هل أنت متأكد من تسليم إجاباتك؟',
      [
        { text: 'مراجعة', style: 'cancel' },
        { text: 'تسليم', onPress: () => send('manual') },
      ],
    );
  };

  /* ------------------------------ Navigator ------------------------------- */

  const navRef = useRef<FlatList<StudentQuizQuestion>>(null);
  useEffect(() => {
    if (questions.length === 0) return;
    navRef.current?.scrollToIndex({ index: currentIndex, animated: true, viewPosition: 0.5 });
  }, [currentIndex, questions.length]);

  if (!question) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <TopBar title={quiz.title} onBack={leave} />
        <View className="flex-1 justify-center px-6">
          <StateCard Icon={SearchX} title="لا توجد أسئلة" message="لا يحتوي هذا الاختبار على أسئلة بعد." actionLabel="العودة" onAction={leave} />
        </View>
      </SafeAreaView>
    );
  }

  const locked = expired || submit.isPending;

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={quiz.title} onBack={onBack} />

      {/* Status: position, timer, progress, question navigator */}
      <View className="bg-white border-b border-tb-muted/10 pt-4 pb-3">
        <View className="flex-row items-center justify-between px-6">
          <View className="items-start">
            <Text className="text-tb-navy text-base font-bold">
              السؤال {currentIndex + 1}
              <Text className="text-tb-muted text-sm font-semibold"> من {questions.length}</Text>
            </Text>
            <Text className="text-tb-muted text-[11px] mt-0.5">
              أجبت على {answeredCount} · درجة النجاح {formatScore(quiz.passingScore)} من {formatScore(quiz.totalScore)}
            </Text>
          </View>
          {timed ? <QuizTimer remainingMs={remainingMs} /> : null}
        </View>

        <View className="h-1.5 rounded-full bg-tb-background mx-6 mt-3 overflow-hidden">
          <View className="h-full rounded-full bg-tb-gold" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </View>

        <FlatList
          ref={navRef}
          data={questions}
          horizontal
          keyExtractor={(q) => q.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12 }}
          getItemLayout={(_, index) => ({ length: NAV_ITEM, offset: NAV_ITEM * index, index })}
          onScrollToIndexFailed={() => undefined}
          renderItem={({ item, index }) => {
            const isCurrent = index === currentIndex;
            const isAnswered = !!answers[item.id];
            return (
              <Pressable
                onPress={() => goTo(index)}
                accessibilityRole="button"
                accessibilityLabel={`السؤال ${index + 1}${isAnswered ? '، تمت الإجابة' : ''}`}
                accessibilityState={{ selected: isCurrent }}
                style={{ width: NAV_ITEM - 8, marginHorizontal: 4 }}
                className={`h-9 rounded-xl items-center justify-center border ${
                  isCurrent
                    ? 'bg-tb-navy border-tb-navy'
                    : isAnswered
                      ? 'bg-tb-gold/10 border-tb-gold/40'
                      : 'bg-white border-tb-muted/20'
                }`}
              >
                <Text className={`text-xs font-bold ${isCurrent ? 'text-white' : isAnswered ? 'text-tb-gold' : 'text-tb-muted'}`}>
                  {index + 1}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <ScrollView
        key={question.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}
      >
        {expired ? (
          <Banner tone="danger" Icon={timeoutSubmitFailed ? CloudOff : TimerOff}>
            {timeoutSubmitFailed
              ? 'انتهى الوقت ولم يكتمل التسليم. إجاباتك محفوظة على جهازك، اضغط «إعادة التسليم».'
              : 'انتهى الوقت، جارٍ تسليم إجاباتك المحفوظة…'}
          </Banner>
        ) : showRestored ? (
          <Banner tone="info" Icon={History}>
            استعدنا تقدّمك المحفوظ: {answeredCount} {answeredCount === 1 ? 'إجابة' : 'إجابات'}، وتكمل من السؤال {currentIndex + 1}.
          </Banner>
        ) : null}

        <View className="bg-white p-5 rounded-3xl border border-tb-muted/10">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-tb-gold text-xs font-bold">السؤال {currentIndex + 1}</Text>
            <Text className="text-tb-muted text-[11px] font-semibold">{formatScore(question.points)} درجة</Text>
          </View>
          <Text selectable className="text-tb-navy text-base font-bold leading-7 mb-5">
            {question.text}
          </Text>

          <View className="gap-2.5" accessibilityRole="radiogroup">
            {question.options.map((option, optionIndex) => {
              const selected = answers[question.id] === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => selectAnswer(question.id, option.id)}
                  disabled={locked}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: locked }}
                  className={`flex-row items-center gap-3 p-3.5 rounded-2xl border ${
                    selected ? 'border-tb-gold bg-tb-gold/10' : 'border-tb-muted/15 bg-tb-background/50 active:bg-tb-background'
                  } ${locked && !selected ? 'opacity-60' : ''}`}
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${selected ? 'bg-tb-gold' : 'bg-white border border-tb-muted/20'}`}
                  >
                    <Text className={`text-xs font-bold ${selected ? 'text-white' : 'text-tb-muted'}`}>
                      {OPTION_LETTERS[optionIndex] ?? optionIndex + 1}
                    </Text>
                  </View>
                  <Text className="text-tb-navy text-sm flex-1 leading-6">{option.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text className="text-tb-muted text-[11px] text-center mt-4">تُحفظ إجاباتك على جهازك تلقائياً، ولا تُرسل إلا عند التسليم.</Text>
      </ScrollView>

      {/* Navigation + submit */}
      <View className="bg-white border-t border-tb-muted/10 px-6 pt-4 pb-3 flex-row items-center gap-3">
        {expired ? (
          <Pressable
            onPress={() => send('timeout')}
            disabled={submit.isPending}
            accessibilityRole="button"
            className={`flex-1 h-12 rounded-2xl items-center justify-center flex-row gap-2 ${submit.isPending ? 'bg-tb-gold/60' : 'bg-tb-gold active:opacity-80'}`}
          >
            {submit.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-white font-bold">إعادة التسليم</Text>
                <Send size={16} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0 || locked}
              accessibilityRole="button"
              accessibilityLabel="السؤال السابق"
              className={`h-12 px-4 rounded-2xl flex-row items-center gap-1 border border-tb-muted/15 bg-tb-background ${
                currentIndex === 0 ? 'opacity-40' : 'active:opacity-70'
              }`}
            >
              <ChevronRight size={18} color="#1B254B" />
              <Text className="text-tb-navy font-bold text-sm">السابق</Text>
            </Pressable>

            {isLast ? (
              <Pressable
                onPress={confirmSubmit}
                disabled={locked}
                accessibilityRole="button"
                className={`flex-1 h-12 rounded-2xl items-center justify-center flex-row gap-2 ${submit.isPending ? 'bg-tb-gold/60' : 'bg-tb-gold active:opacity-80'}`}
              >
                {submit.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text className="text-white font-bold">تسليم الإجابات</Text>
                    <Send size={16} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => goTo(currentIndex + 1)}
                disabled={locked}
                accessibilityRole="button"
                accessibilityLabel="السؤال التالي"
                className="flex-1 h-12 rounded-2xl items-center justify-center flex-row gap-1 bg-tb-navy active:opacity-85"
              >
                <Text className="text-white font-bold">التالي</Text>
                <ChevronLeft size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                    */
/* -------------------------------------------------------------------------- */

function QuizTimer({ remainingMs }: { remainingMs: number }) {
  const seconds = Math.ceil(remainingMs / 1000);
  const tone =
    seconds <= 60
      ? { box: 'bg-red-50 border-red-100', text: 'text-red-600', icon: '#DC2626' }
      : seconds <= 300
        ? { box: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: '#D97706' }
        : { box: 'bg-tb-navy/5 border-tb-navy/10', text: 'text-tb-navy', icon: '#1B254B' };
  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`الوقت المتبقي ${formatDuration(seconds)}`}
      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${tone.box}`}
    >
      <Timer size={15} color={tone.icon} />
      <Text className={`text-sm font-bold ${tone.text}`} style={{ fontVariant: ['tabular-nums'] }}>
        {formatDuration(seconds)}
      </Text>
    </View>
  );
}

function Banner({
  tone,
  Icon,
  children,
}: {
  tone: 'info' | 'danger';
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  const ui =
    tone === 'danger'
      ? { box: 'bg-red-50 border-red-100', text: 'text-red-700', icon: '#DC2626' }
      : { box: 'bg-tb-gold/10 border-tb-gold/20', text: 'text-tb-navy', icon: '#BF9B30' };
  return (
    <View className={`flex-row items-start gap-2.5 rounded-2xl border px-4 py-3 mb-4 ${ui.box}`}>
      <Icon size={16} color={ui.icon} />
      <Text className={`flex-1 text-xs leading-5 font-semibold ${ui.text}`}>{children}</Text>
    </View>
  );
}
