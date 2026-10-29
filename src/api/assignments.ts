// src/api/assignments.ts
import { apiClient } from '@/services/api';
import {
  ASSIGNMENTS_ENDPOINT,
  type AssignmentItem,
  type AssignmentsResponse,
} from '@/types/assignments';
import { assignmentDetailEndpoint, type AssignmentDetail } from '@/types/assignmentDetail';

export const assignmentsApi = {
  /** GET /v1/assignments: all published assignments of the student's programs, with their latest submission. */
  async getMyAssignments(): Promise<AssignmentItem[]> {
    const { data } = await apiClient.get<AssignmentsResponse>(ASSIGNMENTS_ENDPOINT);
    return data.items;
  },

  /** GET /v1/assignments/:id: instructions and attachments (signed download URLs) included. */
  async getAssignment(id: string): Promise<AssignmentDetail> {
    const { data } = await apiClient.get<AssignmentDetail>(assignmentDetailEndpoint(id));
    return data;
  },
};
