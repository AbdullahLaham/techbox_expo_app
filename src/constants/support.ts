// src/constants/support.ts
// Support contact shown in "الحساب والأمان". Set in .env (EXPO_PUBLIC_ variables are bundled
// into the app); a row is hidden while its value is empty.
import Constants from 'expo-constants';

export const SUPPORT = {
  /** e.g. support@techbox.ps */
  email: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  /** International format without "+" or spaces, e.g. 970599000000 */
  whatsapp: process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.replace(/[^\d]/g, '') || null,
} as const;

/** Version from app.json, e.g. "1.0.0". */
export const APP_VERSION = Constants.expoConfig?.version ?? '—';
