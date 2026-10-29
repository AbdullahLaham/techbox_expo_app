// src/components/programs/ActiveProgramCard.tsx
// The prominent card for a program the student has joined (or applied to): cover, status pill,
// a progress ring floating on the cover edge, and a resume action.
// Built from GET /v1/enrollments/my-enrollments.
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import {
  Award,
  Eye,
  Hourglass,
  Info,
  Layers,
  PauseCircle,
  Play,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import type { EnrollmentResponse } from '@/types/enrollment';
import type { EnrollmentStatus } from '@/types/api.contract';
import { ProgressRing } from '@/components/common/ProgressRing';
import { ProgramCover } from './ProgramCover';
import { getProgramTypeUi, tracksLabel } from './programTypeUi';

/* -------------------------------------------------------------------------- */
/*  Status → presentation                                                     */
/* -------------------------------------------------------------------------- */

type ActionVariant = 'primary' | 'gold' | 'soft';

type StatusUi = {
  badge: string;
  dot: string;
  badgeText: string;
  Icon: LucideIcon;
  iconColor: string;
  /** Pending / suspended only: the note box under the title (no content access yet). */
  note?: { text: string; box: string; textClass: string };
  action: { label: string; Icon: LucideIcon; variant: ActionVariant };
};

// Only the statuses shown in "My programs" (seat-holding ones); REJECTED/DROPPED go back to the catalog.
export type ActiveEnrollmentStatus = Extract<
  EnrollmentStatus,
  'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'COMPLETED'
>;

const STATUS_UI: Record<ActiveEnrollmentStatus, StatusUi> = {
  ACTIVE: {
    badge: 'نشط',
    dot: 'bg-emerald-500',
    badgeText: 'text-emerald-700',
    Icon: Play,
    iconColor: '#BF9B30',
    action: { label: 'متابعة التعلم', Icon: Play, variant: 'primary' },
  },
  PENDING: {
    badge: 'قيد المراجعة',
    dot: 'bg-amber-500',
    badgeText: 'text-amber-700',
    Icon: Hourglass,
    iconColor: '#D97706',
    note: {
      text: 'طلبك قيد المراجعة من الإدارة، وسنُعلمك فور قبوله.',
      box: 'bg-amber-50 border-amber-100',
      textClass: 'text-amber-800',
    },
    action: { label: 'عرض حالة الطلب', Icon: Eye, variant: 'soft' },
  },
  SUSPENDED: {
    badge: 'موقوف',
    dot: 'bg-red-500',
    badgeText: 'text-red-600',
    Icon: PauseCircle,
    iconColor: '#DC2626',
    note: {
      text: 'تم إيقاف وصولك لهذا البرنامج مؤقتاً. تواصل مع الإدارة للمزيد.',
      box: 'bg-red-50 border-red-100',
      textClass: 'text-red-700',
    },
    action: { label: 'عرض التفاصيل', Icon: Info, variant: 'soft' },
  },
  COMPLETED: {
    badge: 'مكتمل',
    dot: 'bg-tb-gold',
    badgeText: 'text-tb-gold',
    Icon: Award,
    iconColor: '#BF9B30',
    action: { label: 'مراجعة المحتوى', Icon: RotateCcw, variant: 'gold' },
  },
};

const ACTION_CLASS: Record<ActionVariant, { button: string; text: string; icon: string }> = {
  primary: { button: 'bg-tb-navy', text: 'text-white', icon: '#FFFFFF' },
  gold: { button: 'bg-tb-gold/10 border border-tb-gold/25', text: 'text-tb-gold', icon: '#BF9B30' },
  soft: { button: 'bg-tb-background border border-tb-muted/15', text: 'text-tb-navy', icon: '#1B254B' },
};

export const isActiveEnrollmentStatus = (s: EnrollmentStatus): s is ActiveEnrollmentStatus =>
  s in STATUS_UI;

/** Sits half on the cover, half on the body, at the end side. */
const RING_BADGE = 68;

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

interface ActiveProgramCardProps {
  enrollment: EnrollmentResponse & { status: ActiveEnrollmentStatus };
  /** From the catalog, when the program is still listed there. */
  tracksCount?: number;
  onPress: () => void;
}

export function ActiveProgramCard({ enrollment, tracksCount, onPress }: ActiveProgramCardProps) {
  const { program, status, reviewNote } = enrollment;
  const { label: typeLabel, Icon: TypeIcon, color: typeColor } = getProgramTypeUi(program.type);
  const ui = STATUS_UI[status];
  const StatusIcon = ui.Icon;
  const ActionIcon = ui.action.Icon;
  const actionClass = ACTION_CLASS[ui.action.variant];

  const hasAccess = status === 'ACTIVE' || status === 'COMPLETED';
  const pct =
    status === 'COMPLETED' ? 100 : Math.min(100, Math.max(0, Math.round(enrollment.progressPct ?? 0)));
  const actionLabel = status === 'ACTIVE' && pct === 0 ? 'ابدأ التعلم' : ui.action.label;
  const progressHint =
    status === 'COMPLETED' ? 'أتممت البرنامج بنجاح' : pct === 0 ? 'جاهز للانطلاق' : 'واصل من حيث توقفت';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${program.title}، ${ui.badge}${hasAccess ? `، التقدم ${pct}%` : ''}`}
      className="flex-1 bg-white rounded-[28px] border border-tb-muted/10 shadow-sm shadow-tb-navy/10 active:opacity-95"
    >
      {/* Cover, status pill, floating progress */}
      <View>
        <ProgramCover
          coverImage={program.coverImage}
          type={program.type}
          className="h-32 rounded-t-[28px]"
          iconSize={44}
        />

        <View
          style={{ position: 'absolute', top: 12, start: 12 }}
          className="flex-row items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full"
        >
          {status === 'COMPLETED' ? (
            <Award size={12} color="#BF9B30" />
          ) : (
            <View className={`w-2 h-2 rounded-full ${ui.dot}`} />
          )}
          <Text className={`text-[11px] font-bold ${ui.badgeText}`}>{ui.badge}</Text>
        </View>

        <View
          style={{
            position: 'absolute',
            bottom: -RING_BADGE / 2 + 4,
            end: 16,
            width: RING_BADGE,
            height: RING_BADGE,
            zIndex: 1,
          }}
          className="rounded-full bg-white items-center justify-center shadow-md shadow-tb-navy/15"
        >
          {hasAccess ? (
            <ProgressRing progress={pct} size={RING_BADGE - 8} stroke={5}>
              {status === 'COMPLETED' ? <Award size={22} color="#BF9B30" /> : undefined}
            </ProgressRing>
          ) : (
            <View
              className="rounded-full items-center justify-center bg-tb-background"
              style={{ width: RING_BADGE - 8, height: RING_BADGE - 8 }}
            >
              <StatusIcon size={24} color={ui.iconColor} />
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View className="flex-1 px-5 pt-4 pb-5">
        <View className="flex-row items-center gap-1.5" style={{ paddingEnd: RING_BADGE + 8 }}>
          <TypeIcon size={13} color={typeColor} />
          <Text className="text-xs font-bold" style={{ color: typeColor }} numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>

        <Text className="text-tb-navy text-lg font-bold leading-7 mt-2" numberOfLines={2}>
          {program.title}
        </Text>

        {hasAccess ? (
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <Text className="text-tb-muted text-xs font-semibold">{progressHint}</Text>
            {tracksCount ? (
              <View className="flex-row items-center gap-1">
                <Layers size={12} color="#8A99B8" />
                <Text className="text-tb-muted text-xs">{tracksLabel(tracksCount)}</Text>
              </View>
            ) : null}
          </View>
        ) : ui.note ? (
          <View className={`flex-row items-start gap-2.5 mt-3 rounded-2xl border px-3.5 py-3 ${ui.note.box}`}>
            <StatusIcon size={15} color={ui.iconColor} />
            <Text className={`flex-1 text-xs leading-5 ${ui.note.textClass}`} numberOfLines={3}>
              {reviewNote || ui.note.text}
            </Text>
          </View>
        ) : null}

        <View className="mt-auto pt-5">
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel}: ${program.title}`}
            className={`h-12 rounded-2xl flex-row items-center justify-center gap-2.5 active:opacity-85 ${actionClass.button}`}
          >
            <Text className={`font-bold text-sm ${actionClass.text}`}>{actionLabel}</Text>
            {ui.action.variant === 'primary' ? (
              <View className="w-7 h-7 rounded-full bg-tb-gold items-center justify-center">
                <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            ) : (
              <ActionIcon size={16} color={actionClass.icon} />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

export function ActiveProgramCardSkeleton() {
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
      <View className="flex-1 bg-white rounded-[28px] border border-tb-muted/10">
        <View className="h-32 rounded-t-[28px] bg-tb-muted/15" />
        <View
          style={{ position: 'absolute', top: 128 - RING_BADGE / 2 + 4, end: 16, width: RING_BADGE, height: RING_BADGE }}
          className="rounded-full bg-white items-center justify-center"
        >
          <View className="w-[60px] h-[60px] rounded-full border-[5px] border-tb-muted/15" />
        </View>
        <View className="px-5 pt-4 pb-5 gap-3">
          <View className="h-3 w-24 rounded-full bg-tb-muted/15" />
          <View className="h-5 w-3/4 rounded-lg bg-tb-muted/15" />
          <View className="h-3 w-1/2 rounded-lg bg-tb-muted/10" />
          <View className="h-12 rounded-2xl bg-tb-muted/10 mt-2" />
        </View>
      </View>
    </Animated.View>
  );
}
