// src/hooks/useAssignments.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '@/api/assignments';
import { submissionsApi, type SubmitAssignmentInput } from '@/api/submissions';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import type { AssignmentItem } from '@/types/assignments';

export const assignmentKeys = {
  all: ['assignments'] as const,
  list: () => ['assignments', 'list'] as const,
  detail: (id: string) => ['assignments', 'detail', id] as const,
  mySubmission: (id: string) => ['assignments', 'my-submission', id] as const,
};

/** GET /v1/assignments */
export function useAssignments() {
  const query = useQuery({
    queryKey: assignmentKeys.list(),
    queryFn: assignmentsApi.getMyAssignments,
    staleTime: 30 * 1000,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/**
 * GET /v1/assignments/:id. While it loads, the list item (if cached) is shown as a
 * placeholder so the header, status and grade appear instantly.
 */
export function useAssignmentDetail(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: () => assignmentsApi.getAssignment(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    placeholderData: () => {
      const item = queryClient
        .getQueryData<AssignmentItem[]>(assignmentKeys.list())
        ?.find((a) => a.id === id);
      return item ? { ...item, instructions: '', attachments: [] } : undefined;
    },
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/** GET /v1/assignments/:id/my-submission */
export function useMySubmission(id: string) {
  const query = useQuery({
    queryKey: assignmentKeys.mySubmission(id),
    queryFn: () => submissionsApi.getMySubmission(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/** POST /v1/assignments/:id/submit, then refresh the hand-in state, the detail and the list. */
export function useSubmitAssignment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitAssignmentInput) => submissionsApi.submit(id, input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}
