// src/hooks/useQuizSession.ts
// Glue between the quiz screen and the local session store, plus the absolute-deadline countdown.
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import {
  createQuizSession,
  isSessionExpired,
  isSessionSubmittedElsewhere,
  quizSessionKey,
  sanitizeQuizSession,
  useQuizSessionStore,
  type QuizSession,
} from '@/store/useQuizSessionStore';
import type { StudentQuiz, StudentQuizQuestion } from '@/types/nodes.contract';

type InitialSession = {
  session: QuizSession;
  /** A saved session with progress was found and restored. */
  restored: boolean;
  /** The deadline passed while the app was closed or the screen was not open. */
  expiredOnArrival: boolean;
};

function resolveInitialSession(quiz: StudentQuiz, questions: StudentQuizQuestion[], userId: string): InitialSession {
  const now = Date.now();
  const stored = useQuizSessionStore.getState().sessions[quizSessionKey(userId, quiz.id)];

  if (stored && !isSessionSubmittedElsewhere(stored, quiz)) {
    const session = sanitizeQuizSession(stored, questions);
    return {
      session,
      restored: session.currentIndex > 0 || Object.keys(session.answers).length > 0,
      expiredOnArrival: isSessionExpired(session, now),
    };
  }
  return { session: createQuizSession(quiz, userId, now), restored: false, expiredOnArrival: false };
}

/**
 * Resumes the saved attempt for this quiz, or starts one (fixing `expiresAt` from now).
 * Every answer and navigation is written to the device right away; nothing goes to the server.
 * The store must be hydrated before this mounts (the quiz screen waits for it).
 */
export function useQuizSession(quiz: StudentQuiz, questions: StudentQuizQuestion[], userId: string) {
  const key = quizSessionKey(userId, quiz.id);
  // Resolved once, when the attempt screen opens.
  const [initial] = useState(() => resolveInitialSession(quiz, questions, userId));

  const saveSession = useQuizSessionStore((s) => s.saveSession);
  const setAnswerInStore = useQuizSessionStore((s) => s.setAnswer);
  const setIndexInStore = useQuizSessionStore((s) => s.setCurrentIndex);
  const clearSession = useQuizSessionStore((s) => s.clearSession);

  // Persist the new (or sanitized) session immediately, so a crash right after opening keeps the deadline.
  useEffect(() => {
    saveSession(initial.session);
  }, [initial, saveSession]);

  // Sanitized on read too: before the effect above runs, the store still holds the raw saved draft.
  const stored = useQuizSessionStore((s) => s.sessions[key]);
  const session =
    stored?.startedAt === initial.session.startedAt ? sanitizeQuizSession(stored, questions) : initial.session;

  return {
    session,
    restored: initial.restored,
    expiredOnArrival: initial.expiredOnArrival,
    selectAnswer: (questionId: string, optionId: string) => setAnswerInStore(key, questionId, optionId),
    goTo: (index: number) => setIndexInStore(key, Math.min(Math.max(0, index), Math.max(0, questions.length - 1))),
    clear: () => clearSession(key),
  };
}

/**
 * Milliseconds left until `expiresAt`, recomputed from the device clock every second and whenever
 * the app returns to the foreground (a closed or backgrounded app never pauses the timer).
 * null when there is no deadline, 0 once it has passed.
 */
export function useCountdown(expiresAt: string | null): number | null {
  const deadline = expiresAt ? Date.parse(expiresAt) : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline == null) return;
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [deadline]);

  if (deadline == null || Number.isNaN(deadline)) return null;
  return Math.max(0, deadline - now);
}

/**
 * After a cold start, reopens a timed quiz the student left mid-attempt. If its deadline passed
 * while the app was closed, the quiz screen submits the saved answers as soon as it opens.
 * Untimed attempts are not reopened automatically; the lesson's quiz card offers to resume them.
 */
export function useResumeTimedQuizOnLaunch(enabled: boolean) {
  const router = useRouter();
  const segments = useSegments();
  const userId = useAuthStore((s) => s.user?.id);
  const hasHydrated = useQuizSessionStore((s) => s.hasHydrated);
  const handledFor = useRef<string | null>(null);
  const inApp = segments[0] === '(tabs)';

  useEffect(() => {
    if (!enabled || !userId || !hasHydrated || !inApp || handledFor.current === userId) return;
    handledFor.current = userId;

    const timed = Object.values(useQuizSessionStore.getState().sessions)
      .filter((s) => s.userId === userId && s.expiresAt != null)
      .sort((a, b) => Date.parse(a.expiresAt ?? '') - Date.parse(b.expiresAt ?? ''));
    if (timed[0]) router.push({ pathname: '/quiz/[quizId]', params: { quizId: timed[0].quizId } });
  }, [enabled, userId, hasHydrated, inApp, router]);
}
