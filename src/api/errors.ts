// src/api/errors.ts
import axios from 'axios';
import { API_ERROR_MESSAGES_AR, type ApiErrorBody, type ApiErrorCode } from '../types/api.contract';

type ErrorResponse = Partial<Omit<ApiErrorBody, 'message'>> & { message?: string | string[] };

/**
 * Arabic message for a failed request: the contract code's text (v1 routes), the field
 * messages for validation errors, or NestJS's `message` (string or string[]) on older routes.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ErrorResponse>(error)) return fallback;
  if (!error.response) return 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت.';

  const body = error.response.data;
  const code = body?.code && body.code in API_ERROR_MESSAGES_AR ? (body.code as ApiErrorCode) : undefined;
  const details = Object.values(body?.details ?? {});
  if (code === 'VALIDATION_FAILED' && details.length) return details.join('\n');
  if (code) return API_ERROR_MESSAGES_AR[code];

  if (Array.isArray(body?.message)) return body.message.join('\n') || fallback;
  return body?.message || fallback;
}
