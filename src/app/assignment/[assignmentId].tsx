// src/app/assignment/[assignmentId].tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertCircle,
  ChevronRight,
  Download,
  FileImage,
  FileText,
  SearchX,
  Sparkles,
} from 'lucide-react-native';

import { assignmentKeys, useAssignmentDetail } from '@/hooks/useAssignments';
import { getApiErrorMessage } from '@/api/errors';
import { resolveFileUrl } from '@/services/fileUrl';
import { StateCard } from '@/components/common/StateCard';
import { SubmissionSection } from '@/components/assignments/SubmissionSection';
import {
  DUE_TONE_CLASS,
  SUBMISSION_TYPE_UI,
  formatDate,
  formatScore,
  getDueInfo,
  getStatusUi,
} from '@/components/assignments/assignmentFormat';
import { ATTACHMENT_URL_TTL_MS, type AssignmentAttachmentDto } from '@/types/assignmentDetail';

/** Re-fetch signed links this long before they expire. */
const URL_REFRESH_MARGIN_MS = 5 * 60 * 1000;

const isNotFound = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-tb-muted/10">
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="رجوع"
        className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center active:opacity-70"
      >
        <ChevronRight size={20} color="#1B254B" />
      </Pressable>
      <Text accessibilityRole="header" className="text-tb-navy font-bold text-lg">
        تفاصيل الواجب
      </Text>
      <View className="w-10" />
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-tb-navy text-base font-bold mb-3 mt-2">{children}</Text>;
}

function InfoTile({ label, value, valueClass = 'text-tb-navy' }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-1 min-w-[45%] bg-tb-background rounded-2xl p-3">
      <Text className="text-tb-muted text-[11px] font-semibold mb-1">{label}</Text>
      <Text className={`text-sm font-bold ${valueClass}`}>{value}</Text>
    </View>
  );
}

function Bone({ className }: { className: string }) {
  return <View className={`rounded-lg bg-tb-muted/15 ${className}`} />;
}

function DetailSkeleton() {
  return (
    <View className="px-6 pt-6 gap-4">
      <View className="bg-white rounded-3xl p-6 gap-3">
        <Bone className="h-3 w-1/3" />
        <Bone className="h-5 w-3/4" />
        <Bone className="h-7 w-24 rounded-full" />
      </View>
      <View className="bg-white rounded-3xl p-6 gap-3">
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
        <Bone className="h-3 w-2/3" />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function AssignmentDetailsScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/assignments'));

  const { data, error, isPending, isPlaceholderData, refetch, dataUpdatedAt } = useAssignmentDetail(
    assignmentId ?? '',
  );
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Deleted, unpublished or no longer visible while the student was looking at it.
  const reportedGone = useRef(false);
  useEffect(() => {
    if (data && !isPlaceholderData && isNotFound(error) && !reportedGone.current) {
      reportedGone.current = true;
      Alert.alert('الواجب غير متاح', 'لم يعد هذا الواجب متاحاً، ربما تم حذفه أو إلغاء نشره.', [
        { text: 'حسناً', onPress: goBack },
      ]);
    }
    // goBack is stable enough for this one-shot alert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error, isPlaceholderData]);

  const onRefresh = async () => {
    setRefreshing(true);
    void queryClient.invalidateQueries({ queryKey: assignmentKeys.mySubmission(assignmentId ?? '') });
    const result = await refetch();
    setRefreshing(false);
    if (result.isError && !isNotFound(result.error)) {
      Alert.alert('تعذّر تحديث الواجب', getApiErrorMessage(result.error, 'حاول مرة أخرى لاحقاً.'));
    }
  };

  const openAttachment = async (attachment: AssignmentAttachmentDto) => {
    if (openingId) return;
    setOpeningId(attachment.id);
    try {
      let url = attachment.url;
      // Signed links expire after an hour: get fresh ones if this response is getting old.
      if (Date.now() - dataUpdatedAt > ATTACHMENT_URL_TTL_MS - URL_REFRESH_MARGIN_MS) {
        const fresh = await refetch();
        if (fresh.isError) throw fresh.error;
        const match = fresh.data?.attachments.find((a) => a.id === attachment.id);
        if (!match) {
          Alert.alert('الملف غير متاح', 'تمت إزالة هذا الملف من الواجب.');
          return;
        }
        url = match.url;
      }
      // Downloads are served with Content-Disposition: attachment; the system browser saves or previews them.
      await Linking.openURL(resolveFileUrl(url));
    } catch (e) {
      Alert.alert('تعذّر فتح الملف', getApiErrorMessage(e, 'تعذّر فتح الملف على هذا الجهاز، حاول مرة أخرى.'));
    } finally {
      setOpeningId(null);
    }
  };

  /* ------------------------------ No data yet ------------------------------ */

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <TopBar onBack={goBack} />
        {isPending ? (
          <DetailSkeleton />
        ) : (
          <View className="flex-1 justify-center px-6">
            {isNotFound(error) ? (
              <StateCard
                Icon={SearchX}
                title="الواجب غير متاح"
                message="قد يكون الواجب حُذف أو أُلغي نشره، أو لم يعد تسجيلك في البرنامج فعّالاً."
                actionLabel="العودة"
                onAction={goBack}
              />
            ) : (
              <StateCard
                Icon={AlertCircle}
                title="تعذّر تحميل الواجب"
                message={getApiErrorMessage(error, 'حدث خطأ أثناء تحميل الواجب، حاول مرة أخرى.')}
                actionLabel="إعادة المحاولة"
                onAction={() => void refetch()}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  /* -------------------------------- Content -------------------------------- */

  const status = getStatusUi(data);
  const due = getDueInfo(data.dueDate, data.isOverdue);
  const typeUi = SUBMISSION_TYPE_UI[data.allowedType];

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <TopBar onBack={goBack} />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#BF9B30']} />}
      >
        {/* Title card */}
        <View className="bg-white p-6 rounded-3xl border border-tb-muted/10 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-tb-muted text-xs font-semibold flex-1" numberOfLines={1}>
              {data.program.title}
            </Text>
            {data.isNew && (
              <View className="flex-row items-center gap-1 bg-tb-gold px-2.5 py-1 rounded-full">
                <Sparkles size={11} color="#FFFFFF" />
                <Text className="text-white text-[10px] font-bold">جديد</Text>
              </View>
            )}
          </View>
          <Text accessibilityRole="header" className="text-tb-navy text-xl font-bold leading-8 mb-4">
            {data.title}
          </Text>

          <View className="flex-row items-center gap-2 mb-5">
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: status.tint }}>
              <status.Icon size={12} color={status.color} />
              <Text className="text-[11px] font-bold" style={{ color: status.color }}>
                {status.label}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <InfoTile label="الموعد النهائي" value={due.label} valueClass={DUE_TONE_CLASS[due.tone]} />
            <InfoTile label="الدرجة القصوى" value={formatScore(data.maxScore)} />
            <InfoTile label="نوع التسليم" value={typeUi.label} />
            <InfoTile label="تاريخ النشر" value={formatDate(data.publishedAt)} />
          </View>
        </View>

        {/* Instructions */}
        <SectionTitle>التعليمات</SectionTitle>
        <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-6">
          {isPlaceholderData ? (
            <View className="gap-2">
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-5/6" />
              <Bone className="h-3 w-2/3" />
            </View>
          ) : data.instructions.trim() ? (
            <Text selectable className="text-tb-navy text-sm leading-7">
              {data.instructions}
            </Text>
          ) : (
            <Text className="text-tb-muted text-sm">لا توجد تعليمات إضافية لهذا الواجب.</Text>
          )}
        </View>

        {/* Attachments */}
        {!isPlaceholderData && data.attachments.length > 0 && (
          <>
            <SectionTitle>الملفات المرفقة</SectionTitle>
            <View className="bg-white rounded-3xl border border-tb-muted/10 p-2 mb-6">
              {data.attachments.map((attachment, index) => {
                const FileIcon = attachment.mimeType.startsWith('image/') ? FileImage : FileText;
                const opening = openingId === attachment.id;
                return (
                  <Pressable
                    key={attachment.id}
                    onPress={() => void openAttachment(attachment)}
                    disabled={!!openingId}
                    accessibilityRole="button"
                    accessibilityLabel={`فتح الملف ${attachment.fileName}`}
                    className={`flex-row items-center gap-3 p-3 rounded-2xl active:bg-tb-background ${
                      index > 0 ? 'border-t border-tb-muted/10' : ''
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-tb-navy/5 items-center justify-center">
                      <FileIcon size={20} color="#1B254B" />
                    </View>
                    <View className="flex-1 items-start">
                      <Text className="text-tb-navy text-sm font-bold" numberOfLines={1}>
                        {attachment.fileName}
                      </Text>
                      <Text className="text-tb-muted text-[11px]">{formatBytes(attachment.sizeBytes)}</Text>
                    </View>
                    {opening ? <ActivityIndicator color="#BF9B30" /> : <Download size={18} color="#BF9B30" />}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Hand-in: latest attempt, review, history and the form */}
        <SubmissionSection assignmentId={data.id} onGone={goBack} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
