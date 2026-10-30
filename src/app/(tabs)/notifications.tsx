// src/app/(tabs)/notifications.tsx
// The learner's notifications (GET /v1/notifications), newest first, 20 per page.
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Award,
  Bell,
  BellOff,
  CheckCheck,
  ClipboardList,
  Megaphone,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';

import { Header } from '@/components/Header';
import { StateCard } from '@/components/common/StateCard';
import { getApiErrorMessage } from '@/api/errors';
import { formatDate } from '@/components/assignments/assignmentFormat';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import type { AppNotification, NotificationType } from '@/types/api.contract';

const TYPE_UI: Record<NotificationType, { Icon: LucideIcon; color: string; tint: string }> = {
  GRADED: { Icon: Award, color: '#BF9B30', tint: 'rgba(191,155,48,0.12)' },
  ENROLLMENT: { Icon: UserCheck, color: '#10B981', tint: 'rgba(16,185,129,0.10)' },
  NEW_ASSIGNMENT: { Icon: ClipboardList, color: '#1B254B', tint: 'rgba(27,37,75,0.08)' },
  ASSIGNMENT_DUE: { Icon: ClipboardList, color: '#EA580C', tint: 'rgba(234,88,12,0.10)' },
  ANNOUNCEMENT: { Icon: Megaphone, color: '#1B254B', tint: 'rgba(27,37,75,0.08)' },
  SYSTEM: { Icon: Bell, color: '#8A99B8', tint: 'rgba(138,153,184,0.12)' },
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function timeAgo(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  if (diff < MINUTE) return 'الآن';
  if (diff < HOUR) return `منذ ${Math.floor(diff / MINUTE)} دقيقة`;
  if (diff < DAY) return `منذ ${Math.floor(diff / HOUR)} ساعة`;
  if (diff < 2 * DAY) return 'أمس';
  if (diff < 7 * DAY) return `منذ ${Math.floor(diff / DAY)} أيام`;
  return formatDate(iso);
}

/** actionUrl is a resource path; map it to this app's screen (null = nothing to open). */
function openAction(router: ReturnType<typeof useRouter>, actionUrl: string | null) {
  const match = actionUrl ? /^\/(assignments|programs)\/([^/?#]+)/.exec(actionUrl) : null;
  if (!match) return;
  const id = decodeURIComponent(match[2]);
  if (match[1] === 'assignments') {
    router.push({ pathname: '/assignment/[assignmentId]', params: { assignmentId: id } });
  } else {
    router.push({ pathname: '/course/[slug]', params: { slug: id } });
  }
}

function NotificationRow({ item, now, onPress }: { item: AppNotification; now: number; onPress: () => void }) {
  const { Icon, color, tint } = TYPE_UI[item.type] ?? TYPE_UI.SYSTEM;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? '' : 'غير مقروء، '}${item.title}: ${item.message}`}
      className={`p-4 rounded-3xl border mb-3 flex-row items-start gap-3 active:opacity-80 ${
        item.isRead ? 'bg-white border-tb-muted/10' : 'bg-tb-gold/5 border-tb-gold/30'
      }`}
    >
      <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: tint }}>
        <Icon size={22} color={color} />
      </View>
      <View className="flex-1 items-start">
        <View className="flex-row items-center w-full gap-2 mb-1">
          <Text className="text-tb-navy font-bold text-sm flex-1" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-tb-muted text-[10px]">{timeAgo(item.createdAt, now)}</Text>
          {!item.isRead && <View className="w-2 h-2 rounded-full bg-tb-gold" />}
        </View>
        <Text className="text-tb-muted text-xs leading-5">{item.message}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [refreshing, setRefreshing] = useState(false);

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0;
  // One clock per fetch keeps "منذ …" labels consistent across the list.
  const now = query.dataUpdatedAt;

  const onRefresh = async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  };

  const onItemPress = (item: AppNotification) => {
    if (!item.isRead) markRead.mutate(item.id);
    openAction(router, item.actionUrl);
  };

  const onMarkAll = () =>
    markAll.mutate(undefined, {
      onError: (e) => Alert.alert('تعذّر التحديث', getApiErrorMessage(e, 'حاول مرة أخرى لاحقاً.')),
    });

  let body: React.ReactNode;
  if (query.isPending) {
    body = (
      <View className="px-6 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className="bg-white h-20 rounded-3xl border border-tb-muted/10 mb-3 opacity-60" />
        ))}
      </View>
    );
  } else if (query.isError && items.length === 0) {
    body = (
      <View className="flex-1 justify-center px-6">
        <StateCard
          Icon={AlertCircle}
          title="تعذّر تحميل الإشعارات"
          message={getApiErrorMessage(query.error, 'حدث خطأ أثناء تحميل الإشعارات، حاول مرة أخرى.')}
          actionLabel="إعادة المحاولة"
          onAction={() => void query.refetch()}
        />
      </View>
    );
  } else {
    body = (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow item={item} now={now} onPress={() => onItemPress(item)} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#BF9B30']} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListHeaderComponent={
          unreadCount > 0 ? (
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-tb-muted text-xs font-semibold">{unreadCount} غير مقروءة</Text>
              <Pressable
                onPress={onMarkAll}
                disabled={markAll.isPending}
                accessibilityRole="button"
                hitSlop={8}
                className="flex-row items-center gap-1.5 active:opacity-60"
              >
                {markAll.isPending ? (
                  <ActivityIndicator size="small" color="#BF9B30" />
                ) : (
                  <CheckCheck size={16} color="#BF9B30" />
                )}
                <Text className="text-tb-gold text-xs font-bold">تعليم الكل كمقروء</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center">
            <StateCard
              Icon={BellOff}
              title="لا توجد إشعارات"
              message="ستصلك هنا تنبيهات قبول طلباتك، والواجبات الجديدة، ونتائج تقييم واجباتك."
            />
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator color="#BF9B30" style={{ marginVertical: 16 }} /> : null
        }
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Header title="الإشعارات والتنبيهات" showUser={false} />
      {body}
    </SafeAreaView>
  );
}
