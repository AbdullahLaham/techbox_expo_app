// src/app/quiz/[quizId].tsx
// Taking a quiz: GET /v1/quizzes/:quizId, answers kept in local state, POST .../attempts on submit.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Ban, SearchX } from 'lucide-react-native';

import { lessonKeys, useQuiz, useSubmitQuiz } from '@/hooks/useLessons';
import { getApiErrorMessage } from '@/api/errors';
import { StateCard } from '@/components/common/StateCard';
import { formatScore } from '@/components/assignments/assignmentFormat';
import { ScreenSkeleton, TopBar, errorCode, isNotFound } from '@/components/lessons/LessonUi';
import type { StudentQuiz } from '@/types/nodes.contract';

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

export default function QuizScreen() {
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/courses'));

  const { data, error, isPending, refetch } = useQuiz(quizId ?? '');

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <TopBar title="الاختبار" onBack={goBack} />
        {isPending ? (
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

  if (data.attemptsRemaining === 0) {
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

  return <QuizForm quiz={data} onBack={goBack} />;
}

function QuizForm({ quiz, onBack }: { quiz: StudentQuiz; onBack: () => void }) {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const submit = useSubmitQuiz(quiz.id);

  /** questionId -> optionId. Never sent anywhere before submit (the server keeps no drafts). */
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = [...quiz.questions].sort((a, b) => a.orderIndex - b.orderIndex);
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const unanswered = questions.length - answeredCount;

  // Ask before throwing away chosen answers (header back, Android back button, swipe).
  const allowLeave = useRef(false);
  const hasAnswers = answeredCount > 0;
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (allowLeave.current || !hasAnswers) return;
      e.preventDefault();
      Alert.alert('مغادرة الاختبار؟', 'لن يتم حفظ إجاباتك ولن تُحتسب محاولة.', [
        { text: 'متابعة الاختبار', style: 'cancel' },
        { text: 'مغادرة', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, hasAnswers]);

  const leave = () => {
    allowLeave.current = true;
    onBack();
  };

  const send = () => {
    submit.mutate(
      { answers: questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] ?? null })) },
      {
        onSuccess: (result) => {
          allowLeave.current = true;
          if (!result.id) {
            // Staff preview: graded but not saved, so there is no result page to open.
            Alert.alert('نتيجة المعاينة', `${formatScore(result.score)} / ${formatScore(result.totalScore)}`, [
              { text: 'حسناً', onPress: onBack },
            ]);
            return;
          }
          router.replace({ pathname: '/quiz/attempt/[attemptId]', params: { attemptId: result.id, fresh: '1' } });
        },
        onError: (e) => {
          const code = errorCode(e);
          if (code === 'MAX_ATTEMPTS_REACHED' || isNotFound(e)) {
            void queryClient.invalidateQueries({ queryKey: lessonKeys.node(quiz.nodeId) });
            Alert.alert(
              code === 'MAX_ATTEMPTS_REACHED' ? 'لا توجد محاولات متبقية' : 'الاختبار غير متاح',
              getApiErrorMessage(e, 'لم يعد هذا الاختبار متاحاً.'),
              [{ text: 'حسناً', onPress: leave }],
            );
            return;
          }
          // Network or validation problem: the answers stay on screen so the student can retry.
          Alert.alert('تعذّر تسليم الاختبار', getApiErrorMessage(e, 'حدث خطأ أثناء التسليم، حاول مرة أخرى.'));
        },
      },
    );
  };

  const confirmSubmit = () => {
    if (submit.isPending) return;
    Alert.alert(
      'تسليم الاختبار',
      unanswered > 0
        ? `لم تُجب على ${unanswered} من ${questions.length} أسئلة، وستُحتسب بدون درجة. هل تريد التسليم؟`
        : 'هل أنت متأكد من تسليم إجاباتك؟',
      [
        { text: 'مراجعة', style: 'cancel' },
        { text: 'تسليم', onPress: send },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={quiz.title} onBack={onBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-tb-muted text-xs font-semibold">
            درجة النجاح {formatScore(quiz.passingScore)} من {formatScore(quiz.totalScore)}
          </Text>
          {quiz.attemptsRemaining != null && (
            <Text className="text-tb-muted text-xs font-semibold">المحاولات المتبقية: {quiz.attemptsRemaining}</Text>
          )}
        </View>

        {questions.map((question, index) => (
          <View key={question.id} className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-tb-gold text-xs font-bold">
                السؤال {index + 1} من {questions.length}
              </Text>
              <Text className="text-tb-muted text-[11px] font-semibold">{formatScore(question.points)} درجة</Text>
            </View>
            <Text selectable className="text-tb-navy text-sm font-bold leading-6 mb-4">
              {question.text}
            </Text>

            <View className="gap-2" accessibilityRole="radiogroup">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                    disabled={submit.isPending}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    className={`flex-row items-center gap-3 p-3 rounded-2xl border ${
                      selected ? 'border-tb-gold bg-tb-gold/10' : 'border-tb-muted/15 bg-tb-background/50 active:bg-tb-background'
                    }`}
                  >
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center ${selected ? 'bg-tb-gold' : 'bg-white border border-tb-muted/20'}`}
                    >
                      <Text className={`text-xs font-bold ${selected ? 'text-white' : 'text-tb-muted'}`}>
                        {OPTION_LETTERS[optionIndex] ?? optionIndex + 1}
                      </Text>
                    </View>
                    <Text className="text-tb-navy text-sm flex-1 leading-5">{option.text}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Submit bar */}
      <View className="bg-white border-t border-tb-muted/10 px-6 pt-4 pb-3 flex-row items-center gap-4">
        <View className="flex-1">
          <Text className="text-tb-navy text-sm font-bold">
            {answeredCount} / {questions.length}
          </Text>
          <Text className="text-tb-muted text-[11px]">تمت الإجابة</Text>
        </View>
        <Pressable
          onPress={confirmSubmit}
          disabled={submit.isPending}
          accessibilityRole="button"
          className={`px-8 py-3.5 rounded-2xl items-center min-w-[140px] ${submit.isPending ? 'bg-tb-gold/60' : 'bg-tb-gold active:opacity-80'}`}
        >
          {submit.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white font-bold">تسليم الإجابات</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
