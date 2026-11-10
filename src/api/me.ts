// src/api/me.ts
// The signed-in user's own account (types/profile.contract.ts): /v1/me and certificate verification.
import { apiClient } from '@/services/api';
import {
  PROFILE_ENDPOINTS,
  type ChangePasswordBody,
  type ChangePasswordResult,
  type LogoutAllResult,
  type MyAchievements,
  type MyCertificates,
  type MyProfile,
  type UpdateMyProfileBody,
} from '@/types/profile.contract';

/** The device's IANA timezone, or undefined when the runtime can't tell (the server then uses its default). */
function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

export type AvatarFile = { uri: string; name: string; mimeType: string };

export const meApi = {
  async profile(): Promise<MyProfile> {
    const { data } = await apiClient.get<MyProfile>(PROFILE_ENDPOINTS.profile);
    return data;
  },

  async updateProfile(body: UpdateMyProfileBody): Promise<MyProfile> {
    const { data } = await apiClient.patch<MyProfile>(PROFILE_ENDPOINTS.profile, body);
    return data;
  },

  async uploadAvatar(file: AvatarFile): Promise<MyProfile> {
    const form = new FormData();
    form.append('avatar', { uri: file.uri, name: file.name, type: file.mimeType } as any);
    const { data } = await apiClient.post<MyProfile>(PROFILE_ENDPOINTS.avatar, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },

  async removeAvatar(): Promise<MyProfile> {
    const { data } = await apiClient.delete<MyProfile>(PROFILE_ENDPOINTS.avatar);
    return data;
  },

  /** Ends every session; the response is this device's new session. */
  async changePassword(body: ChangePasswordBody): Promise<ChangePasswordResult> {
    const { data } = await apiClient.post<ChangePasswordResult>(PROFILE_ENDPOINTS.password, body);
    return data;
  },

  async logoutAll(): Promise<LogoutAllResult> {
    const { data } = await apiClient.post<LogoutAllResult>(PROFILE_ENDPOINTS.logoutAll);
    return data;
  },

  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete(PROFILE_ENDPOINTS.account, { data: { password } });
  },

  async achievements(): Promise<MyAchievements> {
    const tz = deviceTimeZone();
    const { data } = await apiClient.get<MyAchievements>(PROFILE_ENDPOINTS.achievements, { params: tz ? { tz } : undefined });
    return data;
  },

  async certificates(): Promise<MyCertificates> {
    const { data } = await apiClient.get<MyCertificates>(PROFILE_ENDPOINTS.certificates);
    return data;
  },
};
