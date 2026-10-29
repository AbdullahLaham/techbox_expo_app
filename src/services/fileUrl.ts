// src/services/fileUrl.ts
import { API_BASE_URL } from './api';

// Hosts the backend falls back to when PUBLIC_API_URL is not set; unreachable from a phone.
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

/**
 * Make a file URL returned by the API openable on the device:
 *  - relative paths ("/v1/files/download?…") are resolved against the API base URL;
 *  - absolute URLs on a loopback host get the API's origin (same path and signed query);
 *  - any other absolute URL (e.g. a cloud storage link) is returned unchanged.
 */
export function resolveFileUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) {
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  const match = url.match(/^(https?:\/\/)([^/:?#]+)(:\d+)?(.*)$/i);
  if (match && LOOPBACK_HOSTS.has(match[2].toLowerCase())) {
    return `${API_BASE_URL}${match[4]}`;
  }
  return url;
}
