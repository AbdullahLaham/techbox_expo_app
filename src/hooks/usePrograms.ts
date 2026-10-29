// src/hooks/usePrograms.ts
import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { programsApi } from '@/api/programs';
import { enrollmentsApi } from '@/api/enrollments';
import { getApiErrorMessage } from '@/api/errors';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

// Everything sits under `all`, so the enrollment form's invalidation refreshes the lists too.
// The lists use 3-part keys so they never collide with a program slug.
export const programKeys = {
  all: ['program'] as const,
  catalog: () => ['program', 'list', 'catalog'] as const,
  myEnrollments: () => ['program', 'list', 'my-enrollments'] as const,
  detail: (slug: string) => ['program', slug] as const,
};

/** GET /v1/programs (PUBLISHED and ONGOING programs). */
export function useProgramCatalog() {
  const query = useQuery({
    queryKey: programKeys.catalog(),
    queryFn: programsApi.getAllPrograms,
    staleTime: 30 * 1000,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/** GET /v1/enrollments/my-enrollments. Admins change the status, so it is refetched on focus. */
export function useMyEnrollments() {
  const query = useQuery({
    queryKey: programKeys.myEnrollments(),
    queryFn: enrollmentsApi.getMyEnrollments,
    staleTime: 30 * 1000,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/**
 * GET /v1/programs/:slug, including the caller's `myEnrollment`.
 * The enrollment status is changed by admins on the dashboard, so the detail is refetched
 * whenever the screen regains focus (and on app foreground, see the root layout).
 */
export function useProgramDetail(slug: string) {
  const query = useQuery({
    queryKey: programKeys.detail(slug),
    queryFn: () => programsApi.getProgramBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });

  // Skip the first focus: the query has just fetched on mount.
  const isFirstFocus = useRef(true);
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  return {
    ...query,
    error: query.error ? getApiErrorMessage(query.error, 'حدث خطأ أثناء جلب تفاصيل البرنامج') : null,
  };
}
