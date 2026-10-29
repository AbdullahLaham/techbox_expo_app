// src/components/programs/ProgramCard.tsx
// Catalog card for a program the student has not joined: details and a "join" action.
import React, { useEffect, useState } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { Info, Layers, Lock, UserPlus, Users } from 'lucide-react-native';
import type { Program } from '@/types/lms';
import type { EnrollmentBlockReason, EnrollmentStatus } from '@/types/api.contract';
import { resolveFileUrl } from '@/services/fileUrl';
import { getProgramTypeUi } from './programTypeUi';

const BLOCK_REASON_LABEL: Record<EnrollmentBlockReason, string> = {
  NOT_AVAILABLE: 'غير متاح حالياً',
  CLOSED: 'التسجيل مغلق',
  ENDED: 'انتهت الدفعة',
  FULL: 'اكتمل العدد',
};

/** Seats left at or below this are highlighted. */
const LOW_SEATS = 10;

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
  const tracksCount = program._count?.tracks;
  const seatsLeft = program.seats?.remaining ?? null;
  const blockLabel = program.enrollmentBlockReason
    ? BLOCK_REASON_LABEL[program.enrollmentBlockReason]
    : 'التسجيل مغلق';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${program.title}، ${label}`}
      className="flex-1 bg-white rounded-[28px] border border-tb-muted/10 shadow-sm overflow-hidden active:opacity-90"
    >
      {/* Cover: image, or a branded placeholder so every card keeps the same rhythm */}
      <View className="h-36 bg-tb-navy overflow-hidden">
        {program.coverImage ? (
          <Image
            source={{ uri: resolveFileUrl(program.coverImage) }}
            className="w-full h-full"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-white/5" />
            <View className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-tb-gold/15" />
            <Icon size={48} color="rgba(191,155,48,0.55)" />
          </View>
        )}

        {/* Type badge floats on the cover */}
        <View
          style={{ position: 'absolute', top: 12, start: 12 }}
          className="flex-row items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full"
        >
          <Icon size={12} color={color} />
          <Text className="text-[11px] font-bold" style={{ color }}>
            {label}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="flex-1 p-5">
        {previousStatus ? (
          <View className="flex-row items-center gap-1.5 self-start bg-tb-gold/10 px-2.5 py-1 rounded-full mb-2.5">
            <Info size={11} color="#BF9B30" />
            <Text className="text-tb-gold text-[11px] font-bold">
              {previousStatus === 'REJECTED' ? 'يمكنك التقديم مجدداً' : 'يمكنك الانضمام مجدداً'}
            </Text>
          </View>
        ) : null}

        <Text className="text-tb-navy text-base font-bold leading-6 mb-1.5" numberOfLines={2}>
          {program.title}
        </Text>

        {program.description ? (
          <Text className="text-tb-muted text-xs leading-5" numberOfLines={2}>
            {program.description}
          </Text>
        ) : null}

        {/* Meta */}
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5 mt-auto pt-4">
          {tracksCount !== undefined ? (
            <View className="flex-row items-center gap-1.5">
              <Layers size={13} color="#8A99B8" />
              <Text className="text-tb-muted text-xs font-semibold">{tracksCount} مسارات</Text>
            </View>
          ) : null}
          {program.canEnroll && seatsLeft !== null && seatsLeft <= LOW_SEATS ? (
            <View className="flex-row items-center gap-1.5">
              <Users size={13} color="#BF9B30" />
              <Text className="text-tb-gold text-xs font-bold">تبقّى {seatsLeft} مقاعد</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View className="flex-row items-center gap-3 mt-4 pt-4 border-t border-tb-muted/10">
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`عرض تفاصيل ${program.title}`}
            className="flex-1 h-11 rounded-2xl border border-tb-navy/15 items-center justify-center active:opacity-80"
          >
            <Text className="text-tb-navy font-bold text-xs">عرض المنهج</Text>
          </Pressable>

          {program.canEnroll ? (
            <Pressable
              onPress={onEnroll}
              accessibilityRole="button"
              accessibilityLabel={`انضم إلى ${program.title}`}
              className="flex-1 h-11 rounded-2xl bg-tb-gold flex-row items-center justify-center gap-1.5 shadow-md shadow-tb-gold/30 active:opacity-85"
            >
              <Text className="text-white font-bold text-xs">انضم الآن</Text>
              <UserPlus size={15} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View
              accessibilityLabel={blockLabel}
              className="flex-1 h-11 rounded-2xl bg-tb-background flex-row items-center justify-center gap-1.5"
            >
              <Lock size={13} color="#8A99B8" />
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
      <View className="flex-1 bg-white rounded-[28px] border border-tb-muted/10 overflow-hidden">
        <View className="h-36 bg-tb-muted/15" />
        <View className="p-5 gap-3">
          <View className="h-5 w-2/3 rounded-lg bg-tb-muted/15" />
          <View className="h-3 w-full rounded-lg bg-tb-muted/10" />
          <View className="h-3 w-4/5 rounded-lg bg-tb-muted/10" />
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1 h-11 rounded-2xl bg-tb-muted/10" />
            <View className="flex-1 h-11 rounded-2xl bg-tb-muted/15" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
