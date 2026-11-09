// src/hooks/useHome.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { homeApi } from '@/api/home';
import { notificationKeys } from '@/hooks/useNotifications';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

export const homeKeys = {
  all: ['home'] as const,
};

/**
 * GET /v1/home. Lessons, quizzes and submissions done on other screens change it, so it is
 * refetched whenever the tab regains focus (and on app foreground, see the root layout).
 */
export function useHome() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: homeKeys.all,
    queryFn: async () => {
      const home = await homeApi.get();
      // Same number as /v1/notifications/unread-count: keep the bell and the tab badge in step for free.
      queryClient.setQueryData(notificationKeys.unreadCount(), home.notifications.unreadCount);
      return home;
    },
    staleTime: 30 * 1000,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}
