// src/components/assignments/SubmissionSection.tsx
// The student's hand-in for one assignment (GET /v1/assignments/:id/my-submission): latest
// attempt with its review, older attempts, and the form whenever a new attempt is allowed.
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  AlarmClockOff,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  FileImage,
  FileText,
  Hourglass,
  Link2,
  MessageSquare,
} from 'lucide-react-native';

import { useMySubmission } from '@/hooks/useAssignments';
import { getApiErrorMessage } from '@/api/errors';
import { resolveFileUrl } from '@/services/fileUrl';
import { Bone, SectionTitle, formatBytes, isNotFound } from '@/components/lessons/LessonUi';
import { formatDate, formatScore, getSubmissionStatusUi } from '@/components/assignments/assignmentFormat';
import { SubmissionForm } from '@/components/assignments/SubmissionForm';
import { ATTACHMENT_URL_TTL_MS } from '@/types/assignmentDetail';
import type {
  MySubmissionResponse,
  SubmissionContent,
  SubmissionFile,
  SubmissionView,
} from '@/types/submissions.contract';

/** Re-fetch signed file links this long before they expire. */
const URL_REFRESH_MARGIN_MS = 5 * 60 * 1000;

type Props = { assignmentId: string; onGone: () => void };

export function SubmissionSection({ assignmentId, onGone }: Props) {
  const query = useMySubmission(assignmentId);
  const { data, error, isPending, refetch } = query;

  if (!data) {
    return (
      <>
        <SectionTitle>تسليمك</SectionTitle>
        <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-6">
          {isPending ? (
            <View className="gap-2">
              <Bone className="h-3 w-1/2" />
              <Bone className="h-3 w-5/6" />
              <Bone className="h-10 w-full rounded-2xl mt-2" />
            </View>
          ) : isNotFound(error) ? (
            // The detail query reports the missing assignment; nothing to hand in here.
            <Text className="text-tb-muted text-sm">التسليم غير متاح لهذا الواجب.</Text>
          ) : (
            <Pressable onPress={() => void refetch()} accessibilityRole="button" className="flex-row items-center gap-2">
              <AlertCircle size={16} color="#EF4444" />
              <Text className="text-tb-muted text-xs flex-1">
                {getApiErrorMessage(error, 'تعذّر تحميل حالة التسليم.')} اضغط لإعادة المحاولة.
              </Text>
            </Pressable>
          )}
        </View>
      </>
    );
  }

  return <SubmissionState mine={data} query={query} onGone={onGone} />;
}

function SubmissionState({
  mine,
  query,
  onGone,
}: {
  mine: MySubmissionResponse;
  query: ReturnType<typeof useMySubmission>;
  onGone: () => void;
}) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const { latest } = mine;
  const olderAttempts = mine.attempts.filter((a) => a.id !== latest?.id);

  const openFile = async (file: SubmissionFile) => {
    if (openingId) return;
    setOpeningId(file.id);
    try {
      let url = file.url;
      // Signed links expire after about an hour: get fresh ones if this response is getting old.
      if (Date.now() - query.dataUpdatedAt > ATTACHMENT_URL_TTL_MS - URL_REFRESH_MARGIN_MS) {
        const fresh = await query.refetch();
        if (fresh.isError) throw fresh.error;
        const match = fresh.data?.attempts.flatMap((a) => a.content.files).find((f) => f.id === file.id);
        if (!match) {
          Alert.alert('الملف غير متاح', 'لم يعد هذا الملف متاحاً.');
          return;
        }
        url = match.url;
      }
      await Linking.openURL(resolveFileUrl(url));
    } catch (e) {
      Alert.alert('تعذّر فتح الملف', getApiErrorMessage(e, 'تعذّر فتح الملف على هذا الجهاز، حاول مرة أخرى.'));
    } finally {
      setOpeningId(null);
    }
  };

  const fileProps = { openingId, onOpenFile: (f: SubmissionFile) => void openFile(f) };

  return (
    <>
      <SectionTitle>تسليمك</SectionTitle>
      {latest ? (
        <AttemptCard attempt={latest} {...fileProps} />
      ) : (
        <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-6">
          <Text className="text-tb-muted text-sm">لم تقم بتسليم هذا الواجب بعد.</Text>
        </View>
      )}

      {mine.canSubmit && (
        <>
          <SectionTitle>{latest ? 'إعادة التسليم' : 'تسليم الواجب'}</SectionTitle>
          <SubmissionForm
            // A new attempt starts from an empty form.
            key={latest?.id ?? 'first'}
            assignmentId={mine.assignmentId}
            allowedType={mine.allowedType}
            dueDate={mine.dueDate}
            isRevision={latest != null}
            onLocked={() => void query.refetch()}
            onGone={onGone}
          />
        </>
      )}

      {olderAttempts.length > 0 && (
        <>
          <SectionTitle>المحاولات السابقة</SectionTitle>
          <View className="bg-white rounded-3xl border border-tb-muted/10 p-2 mb-6">
            {olderAttempts.map((attempt, index) => (
              <HistoryRow key={attempt.id} attempt={attempt} first={index === 0} {...fileProps} />
            ))}
          </View>
        </>
      )}
    </>
  );
}

type FileProps = { openingId: string | null; onOpenFile: (file: SubmissionFile) => void };

function StatusBadge({ attempt }: { attempt: SubmissionView }) {
  const ui = getSubmissionStatusUi(attempt.status);
  return (
    <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: ui.tint }}>
      <ui.Icon size={12} color={ui.color} />
      <Text className="text-[11px] font-bold" style={{ color: ui.color }}>
        {ui.label}
      </Text>
    </View>
  );
}

function LateBadge() {
  return (
    <View className="flex-row items-center gap-1 bg-red-50 px-2.5 py-1.5 rounded-full">
      <AlarmClockOff size={11} color="#EF4444" />
      <Text className="text-red-500 text-[11px] font-bold">متأخر</Text>
    </View>
  );
}

/** The latest attempt: status, grade or review notes, and what was handed in. */
function AttemptCard({ attempt, ...fileProps }: { attempt: SubmissionView } & FileProps) {
  const ui = getSubmissionStatusUi(attempt.status);
  const awaiting = attempt.status === 'SUBMITTED' || attempt.status === 'UNDER_REVIEW';

  return (
    <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-6">
      <View className="flex-row flex-wrap items-center gap-2 mb-3">
        <StatusBadge attempt={attempt} />
        {attempt.isLate && <LateBadge />}
        <Text className="text-tb-muted text-[11px] font-semibold ms-auto">
          المحاولة {attempt.attemptNumber} · {formatDate(attempt.submittedAt)}
        </Text>
      </View>

      {awaiting && (
        <View className="flex-row items-center gap-2 bg-tb-background rounded-2xl p-3 mb-1">
          <Hourglass size={14} color="#1B254B" />
          <Text className="text-tb-navy text-xs font-semibold flex-1">تم التسليم، بانتظار المراجعة.</Text>
        </View>
      )}

      {attempt.score != null && <ScoreBar score={attempt.score} maxScore={attempt.maxScore} />}

      {attempt.feedback ? (
        <View className={`flex-row gap-2 mt-3 p-3 rounded-2xl ${ui.feedbackClass}`}>
          <MessageSquare size={14} color={ui.color} style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-tb-muted text-[10px] font-bold mb-1">ملاحظات المدرّب</Text>
            <Text selectable className="text-tb-navy text-xs leading-5">
              {attempt.feedback}
            </Text>
          </View>
        </View>
      ) : null}

      {attempt.status === 'NEEDS_REVISION' && (
        <Text className="text-orange-600 text-xs font-semibold mt-3">طُلب منك تعديل عملك، يمكنك إعادة التسليم أدناه.</Text>
      )}
      {attempt.status === 'REJECTED' && (
        <Text className="text-red-500 text-xs font-semibold mt-3">تم رفض هذا التسليم ولا يمكن إعادة تسليمه.</Text>
      )}

      <View className="border-t border-tb-muted/10 mt-4 pt-4">
        <Text className="text-tb-muted text-[11px] font-bold mb-2">ما قمت بتسليمه</Text>
        <SubmittedContent content={attempt.content} {...fileProps} />
      </View>
    </View>
  );
}

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;
  return (
    <View className="mt-2">
      <View className="flex-row items-end justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <Award size={14} color="#10B981" />
          <Text className="text-tb-muted text-xs font-semibold">الدرجة ({pct}%)</Text>
        </View>
        <Text className="text-tb-navy font-bold text-lg">
          {formatScore(score)}
          <Text className="text-tb-muted text-xs font-semibold"> / {formatScore(maxScore)}</Text>
        </Text>
      </View>
      <View className="h-2 rounded-full bg-tb-background overflow-hidden">
        <View className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

function SubmittedContent({ content, openingId, onOpenFile }: { content: SubmissionContent } & FileProps) {
  const openLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url).catch(() => Alert.alert('تعذّر فتح الرابط', url));
    }
  };

  const empty = !content.text && content.links.length === 0 && content.files.length === 0;
  if (empty) return <Text className="text-tb-muted text-xs">لا يوجد محتوى.</Text>;

  return (
    <View className="gap-2">
      {content.text ? (
        <Text selectable className="text-tb-navy text-sm leading-6">
          {content.text}
        </Text>
      ) : null}

      {content.links.map((link) => (
        <Pressable
          key={link}
          onPress={() => void openLink(link)}
          accessibilityRole="link"
          className="flex-row items-center gap-2 bg-tb-background rounded-2xl p-3 active:opacity-70"
        >
          <Link2 size={16} color="#BF9B30" />
          <Text className="text-tb-navy text-xs flex-1" numberOfLines={1} style={{ writingDirection: 'ltr' }}>
            {link}
          </Text>
        </Pressable>
      ))}

      {content.files.map((file) => {
        const FileIcon = file.mimeType.startsWith('image/') ? FileImage : FileText;
        return (
          <Pressable
            key={file.id}
            onPress={() => onOpenFile(file)}
            disabled={!!openingId}
            accessibilityRole="button"
            accessibilityLabel={`فتح الملف ${file.fileName}`}
            className="flex-row items-center gap-3 bg-tb-background rounded-2xl p-3 active:opacity-70"
          >
            <FileIcon size={18} color="#1B254B" />
            <View className="flex-1 items-start">
              <Text className="text-tb-navy text-xs font-bold" numberOfLines={1}>
                {file.fileName}
              </Text>
              <Text className="text-tb-muted text-[10px]">{formatBytes(file.sizeBytes)}</Text>
            </View>
            {openingId === file.id ? <ActivityIndicator color="#BF9B30" /> : <Download size={16} color="#BF9B30" />}
          </Pressable>
        );
      })}
    </View>
  );
}

/** An older attempt; tap to see its review and content. */
function HistoryRow({ attempt, first, ...fileProps }: { attempt: SubmissionView; first: boolean } & FileProps) {
  const [open, setOpen] = useState(false);
  const ui = getSubmissionStatusUi(attempt.status);

  return (
    <View className={first ? '' : 'border-t border-tb-muted/10'}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`المحاولة ${attempt.attemptNumber}، ${ui.label}`}
        className="flex-row items-center gap-3 p-3 rounded-2xl active:bg-tb-background"
      >
        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: ui.tint }}>
          <ui.Icon size={18} color={ui.color} />
        </View>
        <View className="flex-1 items-start">
          <Text className="text-tb-navy text-sm font-bold">المحاولة {attempt.attemptNumber}</Text>
          <Text className="text-tb-muted text-[11px]">
            {ui.label} · {formatDate(attempt.submittedAt)}
            {attempt.isLate ? ' · متأخر' : ''}
          </Text>
        </View>
        {attempt.score != null && (
          <Text className="text-tb-navy text-sm font-bold">
            {formatScore(attempt.score)}
            <Text className="text-tb-muted text-[11px]"> / {formatScore(attempt.maxScore)}</Text>
          </Text>
        )}
        {open ? <ChevronUp size={16} color="#BF9B30" /> : <ChevronDown size={16} color="#BF9B30" />}
      </Pressable>

      {open && (
        <View className="px-3 pb-3 gap-3">
          {attempt.feedback ? (
            <View className={`flex-row gap-2 p-3 rounded-2xl ${ui.feedbackClass}`}>
              <MessageSquare size={14} color={ui.color} style={{ marginTop: 2 }} />
              <Text selectable className="text-tb-navy text-xs leading-5 flex-1">
                {attempt.feedback}
              </Text>
            </View>
          ) : null}
          <SubmittedContent content={attempt.content} {...fileProps} />
        </View>
      )}
    </View>
  );
}
