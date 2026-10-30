// src/hooks/useNotifications.ts
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import type { NotificationList } from '@/types/api.contract';

const PAGE_SIZE = 20;

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};

type ListCache = InfiniteData<NotificationList, number>;

/**
 * GET /v1/notifications/unread-count for the tab badge. Refetched when the app comes back to the
 * foreground (focusManager in the root layout) and every minute while it is open.
 */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/** GET /v1/notifications, 20 per page, newest first. */
export function useNotifications() {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: async ({ pageParam }) => {
      const page = await notificationsApi.list({ page: pageParam, pageSize: PAGE_SIZE });
      // Every page carries the total unread count: keep the badge in step for free.
      queryClient.setQueryData(notificationKeys.unreadCount(), page.unreadCount);
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    staleTime: 30 * 1000,
  });
  useRefetchOnFocus(query.refetch);
  return query;
}

/** PATCH /v1/notifications/:id/read. Optimistic: the item and the badge update at once. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousList = queryClient.getQueryData<ListCache>(notificationKeys.list());
      const previousCount = queryClient.getQueryData<number>(notificationKeys.unreadCount());

      queryClient.setQueryData<ListCache>(notificationKeys.list(), (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                unreadCount: Math.max(0, page.unreadCount - 1),
                items: page.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
              })),
            }
          : old,
      );
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), (old) => Math.max(0, (old ?? 1) - 1));
      return { previousList, previousCount };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(notificationKeys.list(), context?.previousList);
      queryClient.setQueryData(notificationKeys.unreadCount(), context?.previousCount);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }),
  });
}

/** POST /v1/notifications/read-all */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: () => {
      queryClient.setQueryData<ListCache>(notificationKeys.list(), (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                unreadCount: 0,
                items: page.items.map((n) => (n.isRead ? n : { ...n, isRead: true })),
              })),
            }
          : old,
      );
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);
    },
  });
}
