// src/api/submissions.ts
import { apiClient } from '@/services/api';
import {
  SUBMISSIONS_ENDPOINTS,
  type MySubmissionResponse,
  type SubmissionView,
} from '@/types/submissions.contract';

/** A file picked on the device, ready to upload. */
export type PickedFile = { uri: string; name: string; mimeType: string; sizeBytes: number | null };

export type SubmitAssignmentInput = {
  text?: string;
  links: string[];
  files: PickedFile[];
  /** Upload progress from 0 to 1 (multipart only). */
  onProgress?: (fraction: number) => void;
};

export const submissionsApi = {
  /** GET /v1/assignments/:id/my-submission: latest attempt, history and whether a new attempt is allowed. */
  async getMySubmission(assignmentId: string): Promise<MySubmissionResponse> {
    const { data } = await apiClient.get<MySubmissionResponse>(SUBMISSIONS_ENDPOINTS.mySubmission(assignmentId));
    return data;
  },

  /** POST /v1/assignments/:id/submit: JSON without files, multipart with them. */
  async submit(assignmentId: string, { text, links, files, onProgress }: SubmitAssignmentInput): Promise<SubmissionView> {
    const url = SUBMISSIONS_ENDPOINTS.submit(assignmentId);

    if (files.length === 0) {
      const { data } = await apiClient.post<SubmissionView>(url, {
        ...(text ? { text } : {}),
        ...(links.length ? { links } : {}),
      });
      return data;
    }

    const form = new FormData();
    if (text) form.append('text', text);
    links.forEach((link) => form.append('links', link));
    files.forEach((file) => form.append('files', { uri: file.uri, name: file.name, type: file.mimeType } as any));

    const { data } = await apiClient.post<SubmissionView>(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Up to 5 x 20 MB on a phone connection: no client-side timeout.
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.min(1, e.loaded / e.total));
      },
    });
    return data;
  },
};
