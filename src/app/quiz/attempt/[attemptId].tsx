// src/app/quiz/attempt/[attemptId].tsx
// Graded attempt: the submit response (seeded in the cache) or GET /v1/quizzes/attempts/:attemptId.
import React from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, EyeOff, Lightbulb, SearchX, XCircle } from 'lucide-react-native';

import { useQuizAttempt } from '@/hooks/useLessons';
import { getApiErrorMessage } from '@/api/errors';
import { StateCard } from '@/components/common/StateCard';
import { formatDate, formatScore } from '@/components/assignments/assignmentFormat';
import { InfoTile, ScreenSkeleton, SectionTitle, TopBar, isNotFound } from '@/components/lessons/LessonUi';
import type { QuizAttemptResult, QuizResultQuestion } from '@/types/nodes.contract';

export default function QuizResultScreen() {
  // `fresh` is set when arriving straight from the submit, the only case where "try again" makes sense.
  const { attemptId, fresh } = useLocalSearchParams<{ attemptId: string; fresh?: string }>();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/courses'));

  const { data, error, isPending, refetch } = useQuizAttempt(attemptId ?? '');

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <TopBar title="نتيجة الاختبار" onBack={goBack} />
        {isPending ? (
          <ScreenSkeleton />
        ) : (
          <View className="flex-1 justify-center px-6">
            {isNotFound(error) ? (
              <StateCard Icon={SearchX} title="النتيجة غير متاحة" message="لم تعد هذه النتيجة متاحة." actionLabel="العودة" onAction={goBack} />
            ) : (
              <StateCard
                Icon={AlertCircle}
                title="تعذّر تحميل النتيجة"
                message={getApiErrorMessage(error, 'حدث خطأ أثناء تحميل النتيجة، حاول مرة أخرى.')}
                actionLabel="إعادة المحاولة"
                onAction={() => void refetch()}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  const canRetry = fresh === '1' && data.attemptsRemaining !== 0;
  const retry = () => router.replace({ pathname: '/quiz/[quizId]', params: { quizId: data.quizId } });

  return <ResultContent result={data} onBack={goBack} onRetry={canRetry ? retry : undefined} />;
}

function ResultContent({ result, onBack, onRetry }: { result: QuizAttemptResult; onBack: () => void; onRetry?: () => void }) {
  const tone = result.passed
    ? { color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'ناجح', Icon: CheckCircle2 }
    : { color: '#EF4444', bg: 'bg-red-50', text: 'text-red-500', label: 'لم تجتز', Icon: XCircle };
  const pct = Math.max(0, Math.min(100, result.percentage));

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title="نتيجة الاختبار" onBack={onBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
      >
        {/* Summary */}
        <View className="bg-white p-6 rounded-3xl border border-tb-muted/10 shadow-sm mb-6 items-center">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${tone.bg}`}>
            <tone.Icon size={32} color={tone.color} />
          </View>
          <Text className={`text-base font-bold mb-1 ${tone.text}`}>{tone.label}</Text>
          <Text accessibilityRole="header" className="text-tb-navy text-4xl font-bold">
            {formatScore(pct)}%
          </Text>
          <Text className="text-tb-muted text-sm font-semibold mt-1">
            {formatScore(result.score)} / {formatScore(result.totalScore)}
          </Text>

          <View className="h-2 w-full rounded-full bg-tb-background overflow-hidden mt-4">
            <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tone.color }} />
          </View>

          <View className="flex-row flex-wrap gap-3 mt-5 w-full">
            <InfoTile label="الإجابات الصحيحة" value={`${result.correctCount} / ${result.questionCount}`} />
            <InfoTile label="درجة النجاح" value={formatScore(result.passingScore)} />
            <InfoTile label="رقم المحاولة" value={String(result.attemptNumber)} />
            <InfoTile label="تاريخ التسليم" value={formatDate(result.submittedAt)} />
          </View>
        </View>

        {!result.showCorrectAnswers && (
          <View className="flex-row items-start gap-2 bg-tb-gold/10 border border-tb-gold/30 rounded-2xl p-4 mb-6">
            <EyeOff size={16} color="#BF9B30" style={{ marginTop: 2 }} />
            <Text className="text-tb-navy text-xs leading-5 flex-1">
              لا يعرض هذا الاختبار الإجابات الصحيحة، يظهر فقط ما إذا كانت إجابتك صحيحة.
            </Text>
          </View>
        )}

        <SectionTitle>مراجعة الإجابات</SectionTitle>
        {result.questions.map((question, index) => (
          <QuestionReview key={question.questionId} question={question} index={index} />
        ))}

        <View className="gap-3 mt-2">
          {onRetry && (
            <Pressable onPress={onRetry} accessibilityRole="button" className="bg-tb-gold py-4 rounded-2xl items-center active:opacity-80">
              <Text className="text-white font-bold">
                محاولة جديدة{result.attemptsRemaining != null ? ` (متبقٍ ${result.attemptsRemaining})` : ''}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            className="bg-white border border-tb-muted/20 py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-tb-navy font-bold">العودة إلى الدرس</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuestionReview({ question, index }: { question: QuizResultQuestion; index: number }) {
  const selectedId = question.selectedOptionId;
  const correctId = question.correctOptionId;

  return (
    <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-1.5">
          {question.isCorrect ? <CheckCircle2 size={14} color="#10B981" /> : <XCircle size={14} color="#EF4444" />}
          <Text className="text-tb-muted text-xs font-bold">السؤال {index + 1}</Text>
        </View>
        <Text className={`text-xs font-bold ${question.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
          {formatScore(question.pointsAwarded)} / {formatScore(question.points)}
        </Text>
      </View>
      <Text selectable className="text-tb-navy text-sm font-bold leading-6 mb-3">
        {question.text}
      </Text>

      <View className="gap-2">
        {question.options.map((option) => {
          const isSelected = option.id === selectedId;
          // Without correctOptionId (hidden answers) the selected option is still marked by isCorrect.
          const isRight = option.id === correctId || (isSelected && question.isCorrect);
          const isWrong = isSelected && !question.isCorrect;
          const boxClass = isRight
            ? 'border-emerald-400 bg-emerald-50'
            : isWrong
              ? 'border-red-300 bg-red-50'
              : 'border-tb-muted/15 bg-tb-background/50';
          return (
            <View key={option.id} className={`flex-row items-center gap-3 p-3 rounded-2xl border ${boxClass}`}>
              <Text className="text-tb-navy text-sm flex-1 leading-5">{option.text}</Text>
              {isSelected && <Text className="text-tb-muted text-[10px] font-bold">إجابتك</Text>}
              {isRight && <CheckCircle2 size={16} color="#10B981" />}
              {isWrong && <XCircle size={16} color="#EF4444" />}
            </View>
          );
        })}
      </View>

      {selectedId == null && <Text className="text-red-500 text-[11px] font-semibold mt-3">لم تتم الإجابة على هذا السؤال.</Text>}

      {question.explanation ? (
        <View className="flex-row gap-2 mt-3 p-3 rounded-2xl bg-tb-gold/10">
          <Lightbulb size={14} color="#BF9B30" style={{ marginTop: 2 }} />
          <Text selectable className="text-tb-navy text-xs leading-5 flex-1">
            {question.explanation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
