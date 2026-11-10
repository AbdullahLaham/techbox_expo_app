// src/store/useQuizSessionStore.ts
// Local-first quiz sessions. The answers, the current question and the deadline of an attempt in
// progress live on the device only (AsyncStorage). The server keeps no drafts: it receives a
// single POST when the student submits or the timer runs out.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StudentQuizQuestion, StudentQuizSummary } from '@/types/nodes.contract';

/** questionId -> optionId */
export type QuizAnswers = Record<string, string>;

export type QuizSession = {
  quizId: string;
  userId: string;
  /** UTC ISO. Also identifies the session (a new attempt gets a new value). */
  startedAt: string;
  /** Absolute UTC ISO deadline, fixed when the attempt starts. null = untimed quiz. */
  expiresAt: string | null;
  /** Position in the questions sorted by `orderIndex`. */
  currentIndex: number;
  answers: QuizAnswers;
  /**
   * `quiz.attemptsUsed` when the session started. If the server later reports more attempts,
   * this attempt was already submitted (the response was lost, or another device submitted).
   */
  attemptsUsedAtStart: number;
  updatedAt: string;
};

/** Sessions untouched for this long are dropped when the store loads. */
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** One student's sessions never leak to another account on the same device. */
export const quizSessionKey = (userId: string, quizId: string) => `${userId}:${quizId}`;

/**
 * The quiz time limit in seconds, or null when untimed.
 * The API contract has no time limit yet; once the backend adds `timeLimitSec` to
 * StudentQuizSummary, the timer turns on with no other change here.
 */
export function getQuizTimeLimitSec(quiz: StudentQuizSummary): number | null {
  const value = (quiz as StudentQuizSummary & { timeLimitSec?: number | null }).timeLimitSec;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export const isSessionExpired = (session: Pick<QuizSession, 'expiresAt'>, now: number) =>
  session.expiresAt != null && Date.parse(session.expiresAt) <= now;

/** True when the stored session belongs to an attempt the server has already counted. */
export const isSessionSubmittedElsewhere = (session: QuizSession, quiz: StudentQuizSummary) =>
  quiz.attemptsUsed > session.attemptsUsedAtStart;

export function createQuizSession(quiz: StudentQuizSummary, userId: string, now: number): QuizSession {
  const timeLimitSec = getQuizTimeLimitSec(quiz);
  const iso = new Date(now).toISOString();
  return {
    quizId: quiz.id,
    userId,
    startedAt: iso,
    expiresAt: timeLimitSec ? new Date(now + timeLimitSec * 1000).toISOString() : null,
    currentIndex: 0,
    answers: {},
    attemptsUsedAtStart: quiz.attemptsUsed,
    updatedAt: iso,
  };
}

/**
 * Fits a restored session to the quiz as served now: answers to removed questions or options are
 * dropped and the index is clamped (questions can change before the quiz's first attempt).
 */
export function sanitizeQuizSession(session: QuizSession, questions: StudentQuizQuestion[]): QuizSession {
  const answers: QuizAnswers = {};
  for (const question of questions) {
    const optionId = session.answers[question.id];
    if (optionId && question.options.some((o) => o.id === optionId)) answers[question.id] = optionId;
  }
  const lastIndex = Math.max(0, questions.length - 1);
  const currentIndex = Math.min(lastIndex, Math.max(0, Math.floor(session.currentIndex) || 0));
  return { ...session, answers, currentIndex };
}

interface QuizSessionState {
  sessions: Record<string, QuizSession>;
  /** false until AsyncStorage has been read; never start a session before that. */
  hasHydrated: boolean;

  saveSession: (session: QuizSession) => void;
  setAnswer: (key: string, questionId: string, optionId: string) => void;
  setCurrentIndex: (key: string, index: number) => void;
  clearSession: (key: string) => void;
}

export const useQuizSessionStore = create<QuizSessionState>()(
  persist(
    (set) => {
      const patch = (key: string, change: (s: QuizSession) => Partial<QuizSession>) =>
        set((state) => {
          const session = state.sessions[key];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [key]: { ...session, ...change(session), updatedAt: new Date().toISOString() },
            },
          };
        });

      return {
        sessions: {},
        hasHydrated: false,

        saveSession: (session) =>
          set((state) => ({
            sessions: { ...state.sessions, [quizSessionKey(session.userId, session.quizId)]: session },
          })),

        setAnswer: (key, questionId, optionId) =>
          patch(key, (s) => ({ answers: { ...s.answers, [questionId]: optionId } })),

        setCurrentIndex: (key, index) => patch(key, () => ({ currentIndex: index })),

        clearSession: (key) =>
          set((state) => {
            if (!state.sessions[key]) return state;
            const { [key]: _removed, ...rest } = state.sessions;
            return { sessions: rest };
          }),
      };
    },
    {
      name: 'techbox.quiz-sessions',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ sessions: state.sessions }),
      onRehydrateStorage: () => (state) => {
        const now = Date.now();
        const sessions = Object.fromEntries(
          Object.entries(state?.sessions ?? {}).filter(
            ([, s]) => now - Date.parse(s.updatedAt) < SESSION_MAX_AGE_MS,
          ),
        );
        // Also runs when reading the storage failed, so the quiz screen never waits forever.
        useQuizSessionStore.setState({ sessions, hasHydrated: true });
      },
    },
  ),
);

/** The current user's session for a quiz, if any. */
export function useStoredQuizSession(userId: string | undefined, quizId: string): QuizSession | undefined {
  return useQuizSessionStore((s) => (userId ? s.sessions[quizSessionKey(userId, quizId)] : undefined));
}
