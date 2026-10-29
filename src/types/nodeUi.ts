// src/components/program/nodeUi.ts
import { BookOpen, FileText, ListChecks, PlayCircle, type LucideIcon } from 'lucide-react-native';
import type { ActivityNode } from '@/types/lms';

export type NodeUi = {
  Icon: LucideIcon;
  label: string;
  color: string;
  tintClass: string;
};

const VIDEO: NodeUi = {
  Icon: PlayCircle,
  label: 'محاضرة فيديو',
  color: '#1B254B',
  tintClass: 'bg-tb-navy/10',
};

const ASSIGNMENT: NodeUi = {
  Icon: FileText,
  label: 'واجب تطبيقي',
  color: '#BF9B30',
  tintClass: 'bg-tb-gold/10',
};

const QUIZ: NodeUi = {
  Icon: ListChecks,
  label: 'اختبار قصير',
  color: '#7C3AED',
  tintClass: 'bg-violet-500/10',
};

const READING: NodeUi = {
  Icon: BookOpen,
  label: 'قراءة وتمرين',
  color: '#10B981',
  tintClass: 'bg-emerald-500/10',
};

/** Single source of truth so ProgramTrackNode and TrackAccordion never drift apart. */
export function getNodeUi(type: ActivityNode['type']): NodeUi {
  switch (type) {
    case 'VIDEO_LECTURE':
      return VIDEO;
    case 'ASSIGNMENT':
      return ASSIGNMENT;
    case 'QUIZ':
      return QUIZ;
    default:
      return READING;
  }
}
