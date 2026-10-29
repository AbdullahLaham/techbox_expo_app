// src/components/assignments/assignmentFormat.ts
import {
  AssignmentItem,
  AssignmentState,
  SubmissionStatus,
  SubmissionType,
  getAssignmentState,
} from '@/types/assignments';
import {
  AlarmClockOff,
  AlignLeft,
  CheckCircle2,
  Clock,
  Film,
  Hourglass,
  Link2,
  RotateCcw,
  Upload,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';

/* ------------------------------ Status badge ------------------------------ */

export type StatusUi = {
  label: string;
  Icon: LucideIcon;
  color: string;
  tint: string;
  cta: string;
  /** Classes for the feedback box shown under the card body */
  feedbackClass: string;
};

export const STATE_UI: Record<AssignmentState, StatusUi> = {
  NOT_SUBMITTED: {
    label: 'لم تُسلَّم',
    Icon: Clock,
    color: '#BF9B30',
    tint: 'rgba(191,155,48,0.12)',
    cta: 'تسليم الواجب',
    feedbackClass: 'bg-tb-background',
  },
  AWAITING_REVIEW: {
    label: 'بانتظار التقييم',
    Icon: Hourglass,
    color: '#1B254B',
    tint: 'rgba(27,37,75,0.08)',
    cta: 'عرض التفاصيل',
    feedbackClass: 'bg-tb-background',
  },
  NEEDS_REVISION: {
    label: 'مطلوب تعديل',
    Icon: RotateCcw,
    color: '#EA580C',
    tint: 'rgba(234,88,12,0.10)',
    cta: 'عرض الملاحظات وإعادة التسليم',
    feedbackClass: 'bg-orange-50 border border-orange-100',
  },
  GRADED: {
    label: 'تم التقييم',
    Icon: CheckCircle2,
    color: '#10B981',
    tint: 'rgba(16,185,129,0.10)',
    cta: 'عرض التفاصيل',
    feedbackClass: 'bg-tb-background',
  },
  REJECTED: {
    label: 'مرفوض',
    Icon: XCircle,
    color: '#EF4444',
    tint: 'rgba(239,68,68,0.10)',
    cta: 'عرض التفاصيل',
    feedbackClass: 'bg-red-50 border border-red-100',
  },
};

/**
 * Badge for an assignment. The server's `isOverdue` (deadline passed and the student still
 * has to submit or revise) overrides the label so late work stands out.
 */
export function getStatusUi(item: Pick<AssignmentItem, 'submission' | 'isOverdue'>): StatusUi {
  const ui = STATE_UI[getAssignmentState(item)];
  return item.isOverdue
    ? { ...ui, label: 'متأخر', Icon: AlarmClockOff, color: '#EF4444', tint: 'rgba(239,68,68,0.10)' }
    : ui;
}

/** Badge for one hand-in attempt (the history keeps SUBMITTED and UNDER_REVIEW apart). */
export function getSubmissionStatusUi(status: SubmissionStatus): StatusUi {
  switch (status) {
    case 'SUBMITTED':
      return { ...STATE_UI.AWAITING_REVIEW, label: 'تم التسليم' };
    case 'UNDER_REVIEW':
      return { ...STATE_UI.AWAITING_REVIEW, label: 'قيد المراجعة' };
    default:
      return STATE_UI[status];
  }
}

/* ------------------------------ Submission type --------------------------- */

export const SUBMISSION_TYPE_UI: Record<SubmissionType, { label: string; Icon: LucideIcon }> = {
  URL_LINK: { label: 'تسليم رابط', Icon: Link2 },
  FILE_UPLOAD: { label: 'رفع ملف', Icon: Upload },
  TEXT_CONTENT: { label: 'إجابة نصية', Icon: AlignLeft },
  MULTIMEDIA: { label: 'وسائط متعددة', Icon: Film },
};

/* ---------------------------------- Dates --------------------------------- */

// Levantine month names, written out so the result never depends on device Intl support.
const MONTHS_AR = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
] as const;

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}

export type DueTone = 'overdue' | 'soon' | 'normal' | 'none';
export type DueInfo = { label: string; tone: DueTone };

/** Text colour per tone, as NativeWind classes. */
export const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: 'text-red-500',
  soon: 'text-orange-600',
  normal: 'text-tb-muted',
  none: 'text-tb-muted',
};

/** Icon colour per tone, for lucide icons. */
export const DUE_TONE_COLOR: Record<DueTone, string> = {
  overdue: '#EF4444',
  soon: '#EA580C',
  normal: '#8A99B8',
  none: '#8A99B8',
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function getDueInfo(dueDate: string | null, isOverdue: boolean, now: number = Date.now()): DueInfo {
  if (!dueDate) return { label: 'بدون موعد نهائي', tone: 'none' };

  const diff = new Date(dueDate).getTime() - now;

  if (isOverdue || diff <= 0) {
    return { label: `انتهى الموعد في ${formatDate(dueDate)}`, tone: 'overdue' };
  }

  if (diff < DAY) {
    const hours = Math.max(1, Math.floor(diff / HOUR));
    return { label: `يستحق خلال ${hours} ساعة`, tone: 'soon' };
  }

  const days = Math.floor(diff / DAY);
  if (days === 1) return { label: 'يستحق بعد يوم', tone: 'soon' };
  if (days === 2) return { label: 'يستحق بعد يومين', tone: 'normal' };
  if (days <= 10) return { label: `يستحق بعد ${days} أيام`, tone: 'normal' };

  return { label: `يستحق في ${formatDate(dueDate)}`, tone: 'normal' };
}

/* --------------------------------- Scores --------------------------------- */

/** 88.5 -> "88.5", 100 -> "100", 87.25 -> "87.25" */
export const formatScore = (value: number): string => String(Number(value.toFixed(2)));