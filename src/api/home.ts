// src/api/home.ts
import { isAxiosError } from 'axios';
import { apiClient } from '@/services/api';
import { HOME_ENDPOINT, type HomeResponse } from '@/types/home.contract';

/** The device's IANA timezone ("Asia/Gaza"), or undefined when the runtime can't tell. */
function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

async function getHome(tz: string | undefined): Promise<HomeResponse> {
  try {
    const { data } = await apiClient.get<HomeResponse>(HOME_ENDPOINT, { params: tz ? { tz } : undefined });
    return data;
  } catch (error) {
    // The server rejects timezone names it doesn't know (400). Use its default rather than failing the tab.
    if (tz && isAxiosError(error) && error.response?.status === 400) return getHome(undefined);
    throw error;
  }
}

export const homeApi = {
  /** GET /v1/home?tz=: the whole Home tab in one read-only request. "Today" and the week follow the device timezone. */
  get: (): Promise<HomeResponse> => getHome(deviceTimeZone()),
};
