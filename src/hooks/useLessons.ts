// src/hooks/useLessons.ts
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { nodesApi } from '@/api/nodes';
import { programKeys } from '@/hooks/usePrograms';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import type { MyEnrollment, ProgramDetail } from '@/types/api.contract';
import type { LessonProgressResult, NodeContent, SubmitQuizBody } from '@/types/nodes.contract';

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

/* ----------------------------- Lesson progress ---------------------------- */

/**
 * Copy a progress response into every cache that shows it: the lesson, the program's curriculum
 * ticks and progress, and the my-enrollments list (courses tab, home). No refetch needed.
 */
function applyProgressResult(queryClient: QueryClient, lesson: NodeContent, result: LessonProgressResult) {
  if (!result.recorded) return; // staff preview: nothing was saved

  const { nodeId, isCompleted, completionPct, lastPositionSec, watchedSeconds, programProgress } = result;
  queryClient.setQueryData<NodeContent>(lessonKeys.node(nodeId), (old) =>
    old ? { ...old, isCompleted, progress: { isCompleted, completionPct, lastPositionSec, watchedSeconds } } : old,
  );

  if (!programProgress) return;
  const enrollmentProgress = {
    progressPct: programProgress.percent,
    completedLessons: programProgress.completedLessons,
    totalLessons: programProgress.totalLessons,
  };

  queryClient.setQueryData<ProgramDetail>(programKeys.detail(lesson.program.slug), (old) => {
    if (!old?.myEnrollment) return old;
    return {
      ...old,
      myEnrollment: { ...old.myEnrollment, ...enrollmentProgress },
      tracks: old.tracks.map((track) => ({
        ...track,
        modules: track.modules.map((module) => ({
          ...module,
          nodes: module.nodes.map((node) => (node.id === nodeId ? { ...node, isCompleted } : node)),
        })),
      })),
    };
  });

  queryClient.setQueryData<MyEnrollment[]>(programKeys.myEnrollments(), (old) =>
    old?.map((e) => (e.program.id === lesson.program.id ? { ...e, ...enrollmentProgress } : e)),
  );
}

/**
 * POST /v1/nodes/:nodeId/progress for video and reading lessons.
 *  - `savePosition(sec)`: background save of the video position; failures are ignored (the next
 *    save catches up) and it keeps working after the screen unmounts.
 *  - `markCompleted`: the learner's "تم الانتهاء" button, with pending and error state.
 */
export function useLessonProgress(lesson: NodeContent) {
  const queryClient = useQueryClient();

  const savePosition = (positionSec: number) => {
    nodesApi
      .updateProgress(lesson.id, { positionSec: Math.max(0, Math.floor(positionSec)) })
      .then((result) => applyProgressResult(queryClient, lesson, result))
      .catch(() => undefined);
  };

  const markCompleted = useMutation({
    mutationFn: () => nodesApi.updateProgress(lesson.id, { completed: true }),
    onSuccess: (result) => applyProgressResult(queryClient, lesson, result),
  });

  return { savePosition, markCompleted };
}
