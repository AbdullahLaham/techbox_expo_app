// src/types/enrollment.ts
import type { EnrollmentApplicationFields, MyEnrollment } from './api.contract';

/** EnrollDto's text fields (from the contract) plus the optional local receipt file. */
export interface EnrollmentPayload extends EnrollmentApplicationFields {
  receiptUri?: string;
  receiptName?: string;
  receiptMimeType?: string;
}

/**
 * POST /v1/enrollments/:programId returns the caller's application. Statuses: PENDING (under
 * review), ACTIVE (accepted), COMPLETED, SUSPENDED, DROPPED, REJECTED (may apply again).
 */
export type EnrollmentResponse = MyEnrollment;

export const PALESTINE_GOVERNORATES = [
  'غزة',
  'شمال غزة',
  'دير البلح',
  'خان يونس',
  'رفح',
  'القدس',
  'رام الله والبيرة',
  'خليل الرحمن',
  'نابلس',
  'جنين',
  'بيت لحم',
  'طولكرم',
  'قلقيلية',
  'أريحا',
  'سلفيت',
  'طوباس',
];