// src/types/lms.ts
// Program and curriculum types. The shapes come from the API contract
// (src/types/api.contract.ts, copied from the backend); this file keeps the names the app uses.
import type {
  ProgramDetail as ContractProgramDetail,
  ProgramModule,
  ProgramNode,
  ProgramSummary,
  ProgramTrack,
} from './api.contract';

export type {
  NodeType as ActivityNodeType,
  ProgramStatus,
  ProgramType,
  SubmissionType as AllowedAssignmentType,
} from './api.contract';

/** A program in the catalog (GET /v1/programs). */
export type Program = ProgramSummary;

/**
 * GET /v1/programs/:slug: the curriculum plus the caller's own enrollment (`myEnrollment`).
 * Lessons are locked (`isLocked`, no playback URL or instructions) until the enrollment is
 * ACTIVE or COMPLETED (`canAccessContent`).
 */
export type ProgramDetail = ContractProgramDetail;

export type Track = ProgramTrack;
export type Module = ProgramModule;
export type ActivityNode = ProgramNode;
