// src/components/assignments/AssignmentCard.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { ChevronLeft, ClipboardList, Clock, MessageSquare, Sparkles } from 'lucide-react-native';

import {
  DUE_TONE_CLASS,
  DUE_TONE_COLOR,
  SUBMISSION_TYPE_UI,
  formatDate,
  formatScore,
  getDueInfo,
  getStatusUi,
} from './assignmentFormat';
import { AssignmentItem, getAssignmentState } from '@/types/assignments';

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

interface AssignmentCardProps {
  item: AssignmentItem;
  onPress: () => void;
}

export function AssignmentCard({ item, onPress }: AssignmentCardProps) {
  const state = getAssignmentState(item);
  const ui = getStatusUi(item);
  const { submission } = item;

  const needsAction = state === 'NOT_SUBMITTED' || state === 'NEEDS_REVISION';
  const due = getDueInfo(item.dueDate, item.isOverdue);
  const TypeIcon = SUBMISSION_TYPE_UI[item.allowedType].Icon;

  const showFeedback =
    !!submission?.feedback &&
    (state === 'NEEDS_REVISION' || state === 'REJECTED' || state === 'GRADED');

  const scorePct =
    state === 'GRADED' && submission?.score != null && item.maxScore > 0
      ? Math.min(100, Math.round((submission.score / item.maxScore) * 100))
      : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}، ${ui.label}`}
      className="bg-white rounded-[28px] border border-tb-muted/10 shadow-sm p-5 mb-4 active:opacity-90"
    >
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-2xl bg-tb-navy/5 items-center justify-center">
          <ClipboardList size={20} color="#1B254B" />
        </View>

        <View className="flex-1 items-start">
          <Text className="text-tb-muted text-[11px] font-semibold mb-0.5" numberOfLines={1}>
            {item.program.title}
          </Text>
          <Text className="text-tb-navy font-bold text-base leading-6" numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        {item.isNew && (
          <View className="flex-row items-center gap-1 bg-tb-gold px-2.5 py-1 rounded-full">
            <Sparkles size={11} color="#FFFFFF" />
            <Text className="text-white text-[10px] font-bold">جديد</Text>
          </View>
        )}
      </View>

      {/* Meta: submission type + deadline or submitted date */}
      <View className="flex-row items-center flex-wrap gap-x-4 gap-y-1 mt-4">
        <View className="flex-row items-center gap-1.5">
          <TypeIcon size={13} color="#8A99B8" />
          <Text className="text-tb-muted text-xs font-semibold">
            {SUBMISSION_TYPE_UI[item.allowedType].label}
          </Text>
        </View>

        {needsAction ? (
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} color={DUE_TONE_COLOR[due.tone]} />
            <Text className={`text-xs font-bold ${DUE_TONE_CLASS[due.tone]}`}>{due.label}</Text>
          </View>
        ) : submission ? (
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} color="#8A99B8" />
            <Text className="text-tb-muted text-xs font-semibold">
              سُلِّمت في {formatDate(submission.submittedAt)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Score (graded only) */}
      {scorePct !== null && submission?.score != null && (
        <View className="mt-4">
          <View className="flex-row items-end justify-between mb-2">
            <Text className="text-tb-muted text-xs font-semibold">الدرجة</Text>
            <Text className="text-tb-navy font-bold text-base">
              {formatScore(submission.score)}
              <Text className="text-tb-muted text-xs font-semibold"> / {formatScore(item.maxScore)}</Text>
            </Text>
          </View>
          <View className="h-2 rounded-full bg-tb-background overflow-hidden">
            <View className="h-full rounded-full bg-emerald-500" style={{ width: `${scorePct}%` }} />
          </View>
        </View>
      )}

      {/* Grader feedback */}
      {showFeedback && (
        <View className={`flex-row gap-2 mt-4 p-3 rounded-2xl ${ui.feedbackClass}`}>
          <MessageSquare size={14} color={ui.color} style={{ marginTop: 2 }} />
          <Text className="text-tb-navy text-xs leading-5 flex-1" numberOfLines={2}>
            {submission?.feedback}
          </Text>
        </View>
      )}

      {/* Footer: status + call to action */}
      <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-tb-muted/10">
        <View
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: ui.tint }}
        >
          <ui.Icon size={12} color={ui.color} />
          <Text className="text-[11px] font-bold" style={{ color: ui.color }}>
            {ui.label}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-tb-gold text-xs font-bold">{ui.cta}</Text>
          <View className="w-8 h-8 rounded-full bg-tb-gold/10 items-center justify-center">
            <ChevronLeft size={16} color="#BF9B30" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

export function AssignmentCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <View className="bg-white rounded-[28px] border border-tb-muted/10 p-5 mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-2xl bg-tb-muted/15" />
          <View className="flex-1 gap-2">
            <View className="h-3 w-1/3 rounded-lg bg-tb-muted/10" />
            <View className="h-4 w-3/4 rounded-lg bg-tb-muted/15" />
          </View>
        </View>
        <View className="h-3 w-1/2 rounded-lg bg-tb-muted/10 mt-5" />
        <View className="h-8 w-full rounded-full bg-tb-muted/10 mt-5" />
      </View>
    </Animated.View>
  );
}