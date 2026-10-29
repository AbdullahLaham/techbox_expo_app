// src/components/programs/ProgramCard.tsx
// Compact catalog card for a program the student has not joined: details and a "join" action.
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { CalendarDays, ChevronLeft, Info, Layers, Lock, UserPlus, Users } from 'lucide-react-native';
import type { Program } from '@/types/lms';
import type { EnrollmentBlockReason, EnrollmentStatus } from '@/types/api.contract';
import { ProgramCover } from './ProgramCover';
import { getProgramTypeUi, seatsLabel, tracksLabel } from './programTypeUi';

const BLOCK_REASON_LABEL: Record<EnrollmentBlockReason, string> = {
  NOT_AVAILABLE: 'غير متاح حالياً',
  CLOSED: 'التسجيل مغلق',
  ENDED: 'انتهت الدفعة',
  FULL: 'اكتمل العدد',
};

/** Seats left at or below this are highlighted. */
const LOW_SEATS = 10;

/** "12 نوفمبر" for a future start date, otherwise null. Latin digits, like the rest of the app. */
function upcomingStart(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  try {
    return date.toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'long' });
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
  onEnroll: () => void;
  /** The student's previous, ended application (they may apply again). */
  previousStatus?: Extract<EnrollmentStatus, 'REJECTED' | 'DROPPED'>;
}

export function ProgramCard({ program, onPress, onEnroll, previousStatus }: ProgramCardProps) {
  const { label, Icon, color } = getProgramTypeUi(program.type);
  const tracksCount = program._count?.tracks ?? 0;
  const seatsLeft = program.seats?.remaining ?? null;
  const lowSeats = program.canEnroll && seatsLeft !== null && seatsLeft <= LOW_SEATS;
  const startsOn = upcomingStart(program.startDate);
  const blockLabel = program.enrollmentBlockReason
    ? BLOCK_REASON_LABEL[program.enrollmentBlockReason]
    : 'التسجيل مغلق';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${program.title}، ${label}`}
      className="flex-1 bg-white rounded-3xl border border-tb-muted/10 shadow-sm shadow-tb-navy/5 p-4 active:opacity-90"
    >
      <View className="flex-row gap-3.5">
        <ProgramCover
          coverImage={program.coverImage}
          type={program.type}
          className="w-[88px] h-[88px] rounded-2xl"
          iconSize={30}
        />

        <View className="flex-1 items-start">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Icon size={12} color={color} />
            <Text className="text-[11px] font-bold" style={{ color }} numberOfLines={1}>
              {label}
            </Text>
          </View>

          <Text className="text-tb-navy text-base font-bold leading-6" numberOfLines={2}>
            {program.title}
          </Text>

          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {tracksCount > 0 ? (
              <View className="flex-row items-center gap-1">
                <Layers size={12} color="#8A99B8" />
                <Text className="text-tb-muted text-[11px] font-semibold">{tracksLabel(tracksCount)}</Text>
              </View>
            ) : null}
            {startsOn ? (
              <View className="flex-row items-center gap-1">
                <CalendarDays size={12} color="#8A99B8" />
                <Text className="text-tb-muted text-[11px] font-semibold">يبدأ {startsOn}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {program.description ? (
        <Text className="text-tb-muted text-xs leading-5 mt-3" numberOfLines={2}>
          {program.description}
        </Text>
      ) : null}

      {previousStatus || lowSeats ? (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {previousStatus ? (
            <View className="flex-row items-center gap-1.5 bg-tb-navy/5 px-2.5 py-1 rounded-full">
              <Info size={11} color="#1B254B" />
              <Text className="text-tb-navy text-[11px] font-bold">
                {previousStatus === 'REJECTED' ? 'يمكنك التقديم مجدداً' : 'يمكنك الانضمام مجدداً'}
              </Text>
            </View>
          ) : null}
          {lowSeats ? (
            <View className="flex-row items-center gap-1.5 bg-tb-gold/10 px-2.5 py-1 rounded-full">
              <Users size={11} color="#BF9B30" />
              <Text className="text-tb-gold text-[11px] font-bold">
                تبقّى {seatsLabel(seatsLeft ?? 0)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Actions */}
      <View className="mt-auto pt-4">
        <View className="flex-row items-center justify-between pt-3.5 border-t border-tb-muted/10">
          <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`عرض منهج ${program.title}`}
            className="flex-row items-center gap-1 active:opacity-60"
          >
            <Text className="text-tb-navy text-xs font-bold">عرض المنهج</Text>
            <ChevronLeft size={14} color="#1B254B" />
          </Pressable>

          {program.canEnroll ? (
            <Pressable
              onPress={onEnroll}
              accessibilityRole="button"
              accessibilityLabel={`انضم إلى ${program.title}`}
              className="h-10 px-5 rounded-xl bg-tb-gold flex-row items-center gap-1.5 shadow-sm shadow-tb-gold/40 active:opacity-85"
            >
              <Text className="text-white font-bold text-xs">انضم الآن</Text>
              <UserPlus size={14} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View
              accessibilityLabel={blockLabel}
              className="h-10 px-4 rounded-xl bg-tb-background flex-row items-center gap-1.5"
            >
              <Lock size={12} color="#8A99B8" />
              <Text className="text-tb-muted font-bold text-xs">{blockLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton (replaces the spinner)                                   */
/* -------------------------------------------------------------------------- */

export function ProgramCardSkeleton() {
  const [opacity] = useState(() => new Animated.Value(0.5));

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
    <Animated.View style={{ opacity, flex: 1 }}>
      <View className="flex-1 bg-white rounded-3xl border border-tb-muted/10 p-4">
        <View className="flex-row gap-3.5">
          <View className="w-[88px] h-[88px] rounded-2xl bg-tb-muted/15" />
          <View className="flex-1 gap-2.5 pt-1">
            <View className="h-3 w-20 rounded-full bg-tb-muted/15" />
            <View className="h-4 w-4/5 rounded-lg bg-tb-muted/15" />
            <View className="h-3 w-1/2 rounded-lg bg-tb-muted/10" />
          </View>
        </View>
        <View className="flex-row items-center justify-between mt-4 pt-3.5 border-t border-tb-muted/10">
          <View className="h-3 w-16 rounded-full bg-tb-muted/10" />
          <View className="h-10 w-24 rounded-xl bg-tb-muted/15" />
        </View>
      </View>
    </Animated.View>
  );
}
