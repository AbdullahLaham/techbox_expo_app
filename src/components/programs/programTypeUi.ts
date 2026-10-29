// src/components/programs/programTypeUi.ts
// Program presentation helpers shared by the program cards: type -> label, icon and colours,
// and Arabic count phrases.
import { GraduationCap, Rocket, Wrench, Zap, type LucideIcon } from 'lucide-react-native';
import { PROGRAM_TYPE_LABELS_AR, type ProgramType } from '@/types/api.contract';

export type ProgramTypeUi = {
  label: string;
  Icon: LucideIcon;
  /** Accent for the icon and label. */
  color: string;
  /** Light background for the cover placeholder. */
  tint: string;
};

const TYPE_UI: Record<ProgramType, Omit<ProgramTypeUi, 'label'>> = {
  INCUBATOR_BATCH: { Icon: Rocket, color: '#BF9B30', tint: '#F7F1DF' },
  ACADEMIC_COURSE: { Icon: GraduationCap, color: '#1B254B', tint: '#E9EDF8' },
  BOOTCAMP: { Icon: Zap, color: '#2C3E75', tint: '#E6ECFA' },
  WORKSHOP_SERIES: { Icon: Wrench, color: '#1B254B', tint: '#EDEFF6' },
};

export function getProgramTypeUi(type: ProgramType): ProgramTypeUi {
  return {
    label: PROGRAM_TYPE_LABELS_AR[type] ?? 'برنامج',
    ...(TYPE_UI[type] ?? TYPE_UI.ACADEMIC_COURSE),
  };
}

type PluralForms = { one: string; two: string; few: string; many: string };

/** Arabic count phrase: مسار واحد، مساران، 3 مسارات، 11 مساراً. */
export function pluralAr(n: number, forms: PluralForms): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const mod = n % 100;
  return mod >= 3 && mod <= 10 ? `${n} ${forms.few}` : `${n} ${forms.many}`;
}

export const tracksLabel = (n: number) =>
  pluralAr(n, { one: 'مسار واحد', two: 'مساران', few: 'مسارات', many: 'مساراً' });

export const seatsLabel = (n: number) =>
  pluralAr(n, { one: 'مقعد واحد', two: 'مقعدان', few: 'مقاعد', many: 'مقعداً' });
