// src/components/lessons/LessonCompletion.tsx
// "تم الانتهاء" for video and reading lessons (POST /v1/nodes/:nodeId/progress { completed: true }).
import React from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { CheckCircle2, CircleCheckBig } from 'lucide-react-native';

import { getApiErrorMessage } from '@/api/errors';
import type { useLessonProgress } from '@/hooks/useLessons';

interface LessonCompletionProps {
  isCompleted: boolean;
  /** 0 to 100: how much of the video was watched (videos only). */
  watchedPct?: number;
  markCompleted: ReturnType<typeof useLessonProgress>['markCompleted'];
}

export function LessonCompletion({ isCompleted, watchedPct, markCompleted }: LessonCompletionProps) {
  if (isCompleted) {
    return (
      <View className="flex-row items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-3xl p-4 mt-6">
        <CheckCircle2 size={22} color="#10B981" />
        <Text className="text-emerald-700 text-sm font-bold flex-1">أكملت هذا الدرس</Text>
      </View>
    );
  }

  const onPress = () =>
    markCompleted.mutate(undefined, {
      onError: (e) => Alert.alert('تعذّر حفظ التقدم', getApiErrorMessage(e, 'حاول مرة أخرى بعد قليل.')),
    });

  return (
    <View className="bg-white border border-tb-muted/10 rounded-3xl p-4 mt-6">
      {watchedPct != null && watchedPct > 0 ? (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-tb-muted text-xs font-semibold">شاهدت من الفيديو</Text>
            <Text className="text-tb-navy text-xs font-bold">{Math.round(watchedPct)}%</Text>
          </View>
          <View className="h-1.5 rounded-full bg-tb-background overflow-hidden">
            <View className="h-full rounded-full bg-tb-gold" style={{ width: `${Math.min(100, watchedPct)}%` }} />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={markCompleted.isPending}
        accessibilityRole="button"
        accessibilityLabel="تم الانتهاء من الدرس"
        className="flex-row items-center justify-center gap-2 bg-tb-navy rounded-2xl py-3.5 active:opacity-85"
      >
        {markCompleted.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <CircleCheckBig size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">تم الانتهاء</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
