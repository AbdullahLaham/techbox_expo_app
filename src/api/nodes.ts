// src/api/nodes.ts
import { apiClient } from '@/services/api';
import {
  NODES_ENDPOINTS,
  type LessonProgressResult,
  type MyQuizAttempt,
  type NodeContent,
  type QuizAttemptResult,
  type StudentQuiz,
  type SubmitQuizBody,
  type UpdateLessonProgressBody,
} from '@/types/nodes.contract';

export const nodesApi = {
  /** GET /v1/nodes/:nodeId: lesson content (video, reading resource or quiz summary). */
  async getNode(nodeId: string): Promise<NodeContent> {
    const { data } = await apiClient.get<NodeContent>(NODES_ENDPOINTS.node(nodeId));
    return data;
  },

  /** POST /v1/nodes/:nodeId/progress: video position and/or completion (video and reading lessons only). */
  async updateProgress(nodeId: string, body: UpdateLessonProgressBody): Promise<LessonProgressResult> {
    const { data } = await apiClient.post<LessonProgressResult>(NODES_ENDPOINTS.nodeProgress(nodeId), body);
    return data;
  },

  /** GET /v1/quizzes/:quizId: questions without correctness information. */
  async getQuiz(quizId: string): Promise<StudentQuiz> {
    const { data } = await apiClient.get<StudentQuiz>(NODES_ENDPOINTS.quiz(quizId));
    return data;
  },

  /** POST /v1/quizzes/:quizId/attempts: graded by the server (201). */
  async submitQuiz(quizId: string, body: SubmitQuizBody): Promise<QuizAttemptResult> {
    const { data } = await apiClient.post<QuizAttemptResult>(NODES_ENDPOINTS.quizAttempts(quizId), body);
    return data;
  },

  /** GET /v1/quizzes/:quizId/attempts: the student's own attempts, newest first. */
  async getMyAttempts(quizId: string): Promise<MyQuizAttempt[]> {
    const { data } = await apiClient.get<MyQuizAttempt[]>(NODES_ENDPOINTS.quizAttempts(quizId));
    return data;
  },

  /** GET /v1/quizzes/attempts/:attemptId */
  async getAttempt(attemptId: string): Promise<QuizAttemptResult> {
    const { data } = await apiClient.get<QuizAttemptResult>(NODES_ENDPOINTS.quizAttempt(attemptId));
    return data;
  },
};
