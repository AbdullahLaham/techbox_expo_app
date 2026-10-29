// src/hooks/useLessons.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nodesApi } from '@/api/nodes';
import { programKeys } from '@/hooks/usePrograms';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import type { SubmitQuizBody } from '@/types/nodes.contract';

// The API marks these responses `Cache-Control: private, max-age=0`: they live in memory only
// (React Query is not persisted) and are always considered stale.
export const lessonKeys = {
  node: (nodeId: string) => ['lesson', 'node', nodeId] as const,
  quiz: (quizId: string) => ['lesson', 'quiz', quizId] as const,
  attempts: (quizId: string) => ['lesson', 'quiz', quizId, 'attempts'] as const,
  attempt: (attemptId: string) => ['lesson', 'attempt', attemptId] as const,
};

/** GET /v1/nodes/:nodeId */
export function useLesson(nodeId: string) {
  const query = useQuery({
    queryKey: lessonKeys.node(nodeId),
    queryFn: () => nodesApi.getNode(nodeId),
    enabled: !!nodeId,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/** GET /v1/quizzes/:quizId. Fetched once per quiz session; the answers live in the screen's local state. */
export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: lessonKeys.quiz(quizId),
    queryFn: () => nodesApi.getQuiz(quizId),
    enabled: !!quizId,
    refetchOnWindowFocus: false,
  });
}

/** GET /v1/quizzes/:quizId/attempts */
export function useQuizAttempts(quizId: string | undefined) {
  const query = useQuery({
    queryKey: lessonKeys.attempts(quizId ?? ''),
    queryFn: () => nodesApi.getMyAttempts(quizId ?? ''),
    enabled: !!quizId,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/** GET /v1/quizzes/attempts/:attemptId. The submit response is seeded here, so a fresh result shows instantly. */
export function useQuizAttempt(attemptId: string) {
  return useQuery({
    queryKey: lessonKeys.attempt(attemptId),
    queryFn: () => nodesApi.getAttempt(attemptId),
    enabled: !!attemptId,
    staleTime: Infinity, // the per-question breakdown is frozen at submission
  });
}

/** POST /v1/quizzes/:quizId/attempts, then refresh everything the attempt changes. */
export function useSubmitQuiz(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitQuizBody) => nodesApi.submitQuiz(quizId, body),
    onSuccess: (result) => {
      if (result.id) queryClient.setQueryData(lessonKeys.attempt(result.id), result);
      void queryClient.invalidateQueries({ queryKey: lessonKeys.node(result.nodeId) });
      void queryClient.invalidateQueries({ queryKey: lessonKeys.quiz(quizId) });
      // Passing completes the lesson, which can unlock the next ones in the curriculum.
      void queryClient.invalidateQueries({ queryKey: programKeys.all });
    },
  });
}
