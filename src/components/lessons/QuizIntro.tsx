// src/components/lessons/QuizIntro.tsx
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronLeft, ClipboardList, Hourglass, XCircle } from 'lucide-react-native';

import { useQuizAttempts } from '@/hooks/useLessons';
import { formatDate, formatScore } from '@/components/assignments/assignmentFormat';
import { InfoTile, SectionTitle } from '@/components/lessons/LessonUi';
import type { StudentQuizSummary } from '@/types/nodes.contract';

export function QuizIntro({ quiz }: { quiz: StudentQuizSummary | null }) {
  if (!quiz) {
    return (
      <View className="rounded-3xl bg-white border border-tb-muted/10 items-center justify-center p-8">
        <Hourglass size={32} color="#8A99B8" />
        <Text className="text-tb-muted text-sm mt-3">الاختبار غير متاح بعد.</Text>
      </View>
    );
  }
  return <QuizIntroContent quiz={quiz} />;
}

function QuizIntroContent({ quiz }: { quiz: StudentQuizSummary }) {
  const router = useRouter();
  const attempts = useQuizAttempts(quiz.attemptsUsed > 0 ? quiz.id : undefined);

  const noAttemptsLeft = quiz.attemptsRemaining === 0;
  const lastAttemptId = quiz.lastAttemptId;
  const attemptsLabel =
    quiz.maxAttempts == null ? 'غير محدودة' : `${quiz.attemptsRemaining ?? 0} من ${quiz.maxAttempts}`;

  const start = () => router.push({ pathname: '/quiz/[quizId]', params: { quizId: quiz.id } });
  const openAttempt = (attemptId: string) =>
    router.push({ pathname: '/quiz/attempt/[attemptId]', params: { attemptId } });

  return (
    <>
      <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-4">
        {quiz.description ? (
          <Text selectable className="text-tb-navy text-sm leading-6 mb-4">
            {quiz.description}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap gap-3">
          <InfoTile label="عدد الأسئلة" value={String(quiz.questionCount)} />
          <InfoTile label="الدرجة الكلية" value={formatScore(quiz.totalScore)} />
          <InfoTile label="درجة النجاح" value={formatScore(quiz.passingScore)} />
          <InfoTile label="المحاولات المتبقية" value={attemptsLabel} valueClass={noAttemptsLeft ? 'text-red-500' : 'text-tb-navy'} />
          {quiz.bestScore != null && (
            <InfoTile
              label="أفضل نتيجة"
              value={`${formatScore(quiz.bestScore)} / ${formatScore(quiz.totalScore)}`}
              valueClass={quiz.passed ? 'text-emerald-600' : 'text-tb-navy'}
            />
          )}
        </View>

        {quiz.passed && (
          <View className="flex-row items-center gap-2 mt-4 bg-emerald-50 rounded-2xl p-3">
            <CheckCircle2 size={16} color="#10B981" />
            <Text className="text-emerald-700 text-xs font-bold flex-1">اجتزت هذا الاختبار بنجاح.</Text>
          </View>
        )}
      </View>

      {noAttemptsLeft ? (
        <View className="gap-3 mb-6">
          <Text className="text-red-500 text-xs text-center">استنفدت عدد المحاولات المسموح بها لهذا الاختبار.</Text>
          {lastAttemptId && (
            <Pressable
              onPress={() => openAttempt(lastAttemptId)}
              accessibilityRole="button"
              className="bg-tb-navy py-4 rounded-2xl items-center active:opacity-80"
            >
              <Text className="text-white font-bold">عرض آخر نتيجة</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable
          onPress={start}
          disabled={quiz.questionCount === 0}
          accessibilityRole="button"
          className={`py-4 rounded-2xl items-center mb-6 ${quiz.questionCount === 0 ? 'bg-tb-muted/40' : 'bg-tb-gold active:opacity-80'}`}
        >
          <Text className="text-white font-bold">{quiz.attemptsUsed > 0 ? 'محاولة جديدة' : 'ابدأ الاختبار'}</Text>
        </Pressable>
      )}

      {quiz.attemptsUsed > 0 && (
        <>
          <SectionTitle>محاولاتك السابقة</SectionTitle>
          <View className="bg-white rounded-3xl border border-tb-muted/10 p-2">
            {attempts.isPending ? (
              <ActivityIndicator color="#BF9B30" style={{ padding: 16 }} />
            ) : attempts.isError ? (
              <Pressable onPress={() => void attempts.refetch()} accessibilityRole="button" className="p-4 items-center">
                <Text className="text-tb-muted text-xs">تعذّر تحميل المحاولات. اضغط لإعادة المحاولة.</Text>
              </Pressable>
            ) : (
              attempts.data.map((attempt, index) => (
                <Pressable
                  key={attempt.id}
                  onPress={() => openAttempt(attempt.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`المحاولة ${attempt.attemptNumber}`}
                  className={`flex-row items-center gap-3 p-3 rounded-2xl active:bg-tb-background ${
                    index > 0 ? 'border-t border-tb-muted/10' : ''
                  }`}
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center ${
                      attempt.passed ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    {attempt.passed ? <CheckCircle2 size={18} color="#10B981" /> : <XCircle size={18} color="#EF4444" />}
                  </View>
                  <View className="flex-1 items-start">
                    <Text className="text-tb-navy text-sm font-bold">المحاولة {attempt.attemptNumber}</Text>
                    <Text className="text-tb-muted text-[11px]">{formatDate(attempt.submittedAt)}</Text>
                  </View>
                  <Text className="text-tb-navy text-sm font-bold">
                    {formatScore(attempt.score)}
                    <Text className="text-tb-muted text-[11px]"> / {formatScore(attempt.totalScore)}</Text>
                  </Text>
                  <ChevronLeft size={16} color="#BF9B30" />
                </Pressable>
              ))
            )}
            {!attempts.isPending && !attempts.isError && attempts.data.length === 0 && (
              <View className="p-4 flex-row items-center justify-center gap-2">
                <ClipboardList size={16} color="#8A99B8" />
                <Text className="text-tb-muted text-xs">لا توجد محاولات بعد.</Text>
              </View>
            )}
          </View>
        </>
      )}
    </>
  );
}
