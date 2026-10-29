// src/types/assignmentDetail.ts
// Student detail of an assignment. Mirrors the "Student detail" and "Errors" sections of
// techbox-incubator-backend/src/types/assignments.admin.contract.ts (that file is admin-only,
// so only these parts are copied). Keep in sync with the backend.
import type { AssignmentItem } from './assignments';

export const assignmentDetailEndpoint = (id: string) => `/v1/assignments/${encodeURIComponent(id)}`;

export type AssignmentAttachmentDto = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Short-lived download URL (about 1 hour), built on every response. Never store it. */
  url: string;
};

/**
 * GET /v1/assignments/:id. 404 NOT_FOUND when the assignment does not exist, is not
 * published, or the student is not ACTIVE/COMPLETED in its program.
 */
export type AssignmentDetail = AssignmentItem & {
  instructions: string;
  attachments: AssignmentAttachmentDto[];
};

/** Lifetime of `AssignmentAttachmentDto.url` on the server (DOWNLOAD_URL_TTL_SEC). */
export const ATTACHMENT_URL_TTL_MS = 3600 * 1000;
