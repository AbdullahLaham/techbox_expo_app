// src/components/assignments/SubmissionForm.tsx
// Hand-in form for POST /v1/assignments/:id/submit. Inputs follow SUBMISSION_RULES[allowedType].
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { File as FsFile } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { FilePlus2, FileText, ImagePlus, Info, Link2, Plus, Send, X } from 'lucide-react-native';

import { useSubmitAssignment } from '@/hooks/useAssignments';
import { getApiErrorMessage } from '@/api/errors';
import type { PickedFile } from '@/api/submissions';
import { errorCode, formatBytes, isNotFound } from '@/components/lessons/LessonUi';
import {
  SUBMISSION_LIMITS,
  SUBMISSION_RULES,
  type SubmissionType,
} from '@/types/submissions.contract';

const ALLOWED_TYPES = SUBMISSION_LIMITS.allowedFileTypes;
/** MIME type -> preferred extension, for picked files whose name has none. */
const EXT_BY_MIME: Record<string, string> = {};
for (const [ext, mime] of Object.entries(ALLOWED_TYPES)) EXT_BY_MIME[mime] ??= ext;
const MAX_FILE_MB = SUBMISSION_LIMITS.maxFileBytes / (1024 * 1024);
const URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

const ACCEPTS_HINT: Record<SubmissionType, string> = {
  FILE_UPLOAD: 'يُسلَّم هذا الواجب برفع ملف واحد أو أكثر، مع ملاحظة اختيارية.',
  URL_LINK: 'يُسلَّم هذا الواجب كرابط واحد فقط (مثل رابط GitHub أو Google Drive)، ولا يقبل رفع ملفات.',
  TEXT_CONTENT: 'يُسلَّم هذا الواجب كإجابة نصية مكتوبة، ولا يقبل رفع ملفات أو روابط.',
  MULTIMEDIA: 'يمكنك تسليم هذا الواجب بروابط أو ملفات أو كليهما.',
};

type FieldErrors ={ files?: string; links?: string; text?: string; form?: string };

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
};

/** Size of a picked file; null when the provider doesn't report it (the server still enforces the limit). */
const readSize = (file: FsFile): number | null => {
  try {
    return file.size;
  } catch {
    return null;
  }
};

/** Gives the picked file an accepted name and MIME type, or returns why it can't be sent. */
function toUploadFile(uri: string, name: string, mimeType: string | null | undefined, size: number | null | undefined) {
  let fileName = name;
  let type = ALLOWED_TYPES[extensionOf(fileName)];
  if (!type && mimeType && EXT_BY_MIME[mimeType.toLowerCase()]) {
    type = mimeType.toLowerCase();
    fileName = `${fileName}${EXT_BY_MIME[type]}`;
  }
  if (!type) return `«${name}»: نوع الملف غير مدعوم (PDF أو Word أو صورة).`;
  if (size != null && size > SUBMISSION_LIMITS.maxFileBytes) return `«${name}»: الحجم يتجاوز ${MAX_FILE_MB} ميجابايت.`;
  return { uri, name: fileName, mimeType: type, sizeBytes: size ?? null } satisfies PickedFile;
}

type Props = {
  assignmentId: string;
  allowedType: SubmissionType;
  dueDate: string | null;
  /** Second or later attempt after a revision request. */
  isRevision: boolean;
  /** 409 SUBMISSION_LOCKED: the state changed on the server; the parent refetches. */
  onLocked: () => void;
  /** 404: the assignment is gone or the enrollment is no longer active. */
  onGone: () => void;
};

export function SubmissionForm({ assignmentId, allowedType, dueDate, isRevision, onLocked, onGone }: Props) {
  const submit = useSubmitAssignment(assignmentId);
  const rules = SUBMISSION_RULES[allowedType];
  const maxFiles = rules.files[1];
  const maxLinks = rules.links[1];
  const isTextAnswer = allowedType === 'TEXT_CONTENT';

  const [text, setText] = useState('');
  const [links, setLinks] = useState<string[]>(maxLinks > 0 ? [''] : []);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [progress, setProgress] = useState<number | null>(null);

  const busy = submit.isPending;
  const remainingFiles = maxFiles - files.length;

  const clearError = (key: keyof FieldErrors) =>
    setErrors((prev) => (prev[key] || prev.form ? { ...prev, [key]: undefined, form: undefined } : prev));

  const addFiles = (picked: (PickedFile | string)[]) => {
    const problems = picked.filter((p): p is string => typeof p === 'string');
    const accepted = picked.filter((p): p is PickedFile => typeof p !== 'string');
    setFiles((prev) => {
      const fresh = accepted.filter((f) => !prev.some((p) => p.uri === f.uri));
      return [...prev, ...fresh].slice(0, maxFiles);
    });
    const dropped = files.length + accepted.length > maxFiles;
    const message = [...problems, ...(dropped ? [`يمكنك إرفاق ${maxFiles} ملفات كحد أقصى.`] : [])].join('\n');
    setErrors((prev) => ({ ...prev, files: message || undefined, form: undefined }));
  };

  const pickDocuments = async () => {
    try {
      const mimeTypes = [...new Set(Object.values(ALLOWED_TYPES))];
      const picked =
        remainingFiles > 1
          ? await FsFile.pickFileAsync({ multipleFiles: true, mimeTypes })
          : await FsFile.pickFileAsync({ mimeTypes });
      if (picked.canceled) return;
      const list = Array.isArray(picked.result) ? picked.result : [picked.result];
      addFiles(list.map((f) => toUploadFile(f.uri, f.name, f.type, readSize(f))));
    } catch {
      Alert.alert('تعذّر فتح الملفات', 'حدث خطأ أثناء اختيار الملف، حاول مرة أخرى.');
    }
  };

  const pickImages = async () => {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: remainingFiles > 1,
        selectionLimit: remainingFiles,
        // iOS: hand over a JPEG instead of the original HEIC, which the server rejects.
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
    } catch {
      Alert.alert('تعذّر فتح معرض الصور', 'يرجى السماح للتطبيق بالوصول إلى الصور من إعدادات الجهاز ثم المحاولة مجدداً.');
      return;
    }
    if (result.canceled) return;
    addFiles(
      result.assets.map((a, i) =>
        toUploadFile(a.uri, a.fileName ?? `image-${Date.now()}-${i + 1}`, a.mimeType ?? 'image/jpeg', a.fileSize),
      ),
    );
  };

  const validate = (cleanLinks: string[]): FieldErrors => {
    const found: FieldErrors = {};
    if (isTextAnswer && !text.trim()) found.text = 'يرجى كتابة إجابتك.';
    else if (text.length > SUBMISSION_LIMITS.textMax) found.text = `النص أطول من ${SUBMISSION_LIMITS.textMax} حرف.`;

    if (cleanLinks.some((l) => !URL_PATTERN.test(l) || l.length > SUBMISSION_LIMITS.urlMax)) {
      found.links = 'رابط غير صالح، يجب أن يبدأ بـ http:// أو https://';
    } else if (cleanLinks.length < rules.links[0]) {
      found.links = 'يرجى إدخال الرابط.';
    }

    if (files.length < rules.files[0]) found.files = 'يرجى إرفاق ملف واحد على الأقل.';
    if (allowedType === 'MULTIMEDIA' && cleanLinks.length === 0 && files.length === 0) {
      found.form = 'أضف رابطاً أو ملفاً واحداً على الأقل.';
    }
    return found;
  };

  const send = (cleanLinks: string[]) => {
    setProgress(files.length ? 0 : null);
    submit.mutate(
      {
        text: text.trim() || undefined,
        links: cleanLinks,
        files,
        onProgress: files.length ? setProgress : undefined,
      },
      {
        onSuccess: () => {
          // The hand-in state is refetched (onSettled), which replaces this form with the submission.
          Alert.alert('تم التسليم', 'تم تسليم الواجب بنجاح، وسيتم إشعارك عند مراجعته.');
        },
        onError: (e) => {
          const code = errorCode(e);
          const status = axios.isAxiosError(e) ? e.response?.status : undefined;
          if (code === 'SUBMISSION_LOCKED') {
            Alert.alert('لا يمكن التسليم الآن', getApiErrorMessage(e, 'تسليمك السابق قيد المراجعة أو تم تقييمه.'));
            onLocked();
          } else if (isNotFound(e)) {
            Alert.alert('الواجب غير متاح', 'لم يعد هذا الواجب متاحاً.', [{ text: 'حسناً', onPress: onGone }]);
          } else if (status === 413 || status === 415) {
            setErrors({ files: getApiErrorMessage(e, 'تعذّر رفع الملف.') });
          } else if (code === 'VALIDATION_FAILED' && axios.isAxiosError<{ details?: Record<string, string> }>(e)) {
            // details keys are field names, sometimes with an index (links.0).
            const next: FieldErrors = {};
            for (const [key, message] of Object.entries(e.response?.data?.details ?? {})) {
              const field = key.split(/[.[]/)[0];
              const slot = field === 'files' || field === 'links' || field === 'text' ? field : 'form';
              next[slot] = next[slot] ? `${next[slot]}\n${message}` : message;
            }
            setErrors(Object.keys(next).length ? next : { form: getApiErrorMessage(e, 'يرجى مراجعة المدخلات.') });
          } else {
            // Network or server problem: everything stays filled in so the student can try again.
            Alert.alert('تعذّر تسليم الواجب', getApiErrorMessage(e, 'حدث خطأ أثناء التسليم، حاول مرة أخرى.'));
          }
        },
        onSettled: () => setProgress(null),
      },
    );
  };

  const confirmSubmit = () => {
    if (busy) return;
    const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
    const found = validate(cleanLinks);
    setErrors(found);
    if (Object.keys(found).length) return;

    const late = dueDate != null && new Date(dueDate).getTime() < Date.now();
    Alert.alert(
      isRevision ? 'إعادة التسليم' : 'تسليم الواجب',
      [
        late ? 'انتهى الموعد النهائي، سيُسجَّل هذا التسليم كمتأخر.' : null,
        'لن تتمكن من التعديل بعد التسليم إلا إذا طلب المدرّب ذلك. هل تريد المتابعة؟',
      ]
        .filter(Boolean)
        .join('\n\n'),
      [
        { text: 'مراجعة', style: 'cancel' },
        { text: 'تسليم', onPress: () => send(cleanLinks) },
      ],
    );
  };

  return (
    <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-6 gap-5">
      {/* What this assignment accepts (set per assignment in the dashboard) */}
      <View className="flex-row items-start gap-2 bg-tb-background rounded-2xl p-3">
        <Info size={14} color="#1B254B" style={{ marginTop: 2 }} />
        <Text className="text-tb-navy text-xs leading-5 flex-1">{ACCEPTS_HINT[allowedType]}</Text>
      </View>

      {/* Links */}
      {maxLinks > 0 && (
        <View>
          <Text className="text-tb-navy text-sm font-bold mb-2">
            {maxLinks === 1 ? 'الرابط' : `الروابط (حتى ${maxLinks})`}
          </Text>
          <View className="gap-2">
            {links.map((link, index) => (
              <View key={index} className="flex-row items-center gap-2">
                <View
                  className={`flex-1 flex-row items-center gap-2 bg-tb-background rounded-2xl px-3 border ${
                    errors.links ? 'border-red-300' : 'border-transparent'
                  }`}
                >
                  <Link2 size={16} color="#8A99B8" />
                  <TextInput
                    value={link}
                    onChangeText={(value) => {
                      setLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
                      clearError('links');
                    }}
                    editable={!busy}
                    placeholder="https://"
                    placeholderTextColor="#8A99B8"
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={SUBMISSION_LIMITS.urlMax}
                    accessibilityLabel={`الرابط ${index + 1}`}
                    className="flex-1 py-3 text-tb-navy text-sm"
                    style={{ textAlign: 'left', writingDirection: 'ltr' }}
                  />
                </View>
                {links.length > 1 && (
                  <Pressable
                    onPress={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
                    disabled={busy}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`حذف الرابط ${index + 1}`}
                    className="w-9 h-9 rounded-xl bg-tb-background items-center justify-center active:opacity-70"
                  >
                    <X size={16} color="#EF4444" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
          {links.length < maxLinks && (
            <Pressable
              onPress={() => setLinks((prev) => [...prev, ''])}
              disabled={busy}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 self-start mt-2 py-1 active:opacity-70"
            >
              <Plus size={14} color="#BF9B30" />
              <Text className="text-tb-gold text-xs font-bold">إضافة رابط</Text>
            </Pressable>
          )}
          {errors.links ? <Text className="text-red-500 text-[11px] mt-2">{errors.links}</Text> : null}
        </View>
      )}

      {/* Files */}
      {maxFiles > 0 && (
        <View>
          <Text className="text-tb-navy text-sm font-bold mb-1">الملفات (حتى {maxFiles})</Text>
          <Text className="text-tb-muted text-[11px] mb-3">
            PDF أو Word أو صور (PNG، JPG، WEBP)، بحد أقصى {MAX_FILE_MB} ميجابايت للملف.
          </Text>

          {files.length > 0 && (
            <View className="gap-2 mb-3">
              {files.map((file) => (
                <View key={file.uri} className="flex-row items-center gap-3 bg-tb-background rounded-2xl p-3">
                  <FileText size={18} color="#1B254B" />
                  <View className="flex-1 items-start">
                    <Text className="text-tb-navy text-xs font-bold" numberOfLines={1}>
                      {file.name}
                    </Text>
                    {file.sizeBytes != null && (
                      <Text className="text-tb-muted text-[10px]">{formatBytes(file.sizeBytes)}</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => {
                      setFiles((prev) => prev.filter((f) => f.uri !== file.uri));
                      clearError('files');
                    }}
                    disabled={busy}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`إزالة ${file.name}`}
                  >
                    <X size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {remainingFiles > 0 && (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => void pickDocuments()}
                disabled={busy}
                accessibilityRole="button"
                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-tb-gold/50 bg-tb-gold/5 active:opacity-70"
              >
                <FilePlus2 size={16} color="#BF9B30" />
                <Text className="text-tb-gold text-xs font-bold">اختيار ملف</Text>
              </Pressable>
              <Pressable
                onPress={() => void pickImages()}
                disabled={busy}
                accessibilityRole="button"
                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-tb-gold/50 bg-tb-gold/5 active:opacity-70"
              >
                <ImagePlus size={16} color="#BF9B30" />
                <Text className="text-tb-gold text-xs font-bold">صورة من المعرض</Text>
              </Pressable>
            </View>
          )}
          {errors.files ? <Text className="text-red-500 text-[11px] mt-2">{errors.files}</Text> : null}
        </View>
      )}

      {/* Text: the answer for TEXT_CONTENT, an optional note otherwise */}
      <View>
        <Text className="text-tb-navy text-sm font-bold mb-2">{isTextAnswer ? 'إجابتك' : 'ملاحظة (اختياري)'}</Text>
        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            clearError('text');
          }}
          editable={!busy}
          multiline
          textAlignVertical="top"
          maxLength={SUBMISSION_LIMITS.textMax}
          placeholder={isTextAnswer ? 'اكتب إجابتك هنا…' : 'أضف ملاحظة للمدرّب…'}
          placeholderTextColor="#8A99B8"
          accessibilityLabel={isTextAnswer ? 'إجابتك' : 'ملاحظة'}
          className={`bg-tb-background rounded-2xl p-3 text-tb-navy text-sm leading-6 border ${
            errors.text ? 'border-red-300' : 'border-transparent'
          }`}
          style={{ minHeight: isTextAnswer ? 180 : 90, textAlign: 'right' }}
        />
        <View className="flex-row justify-between mt-1">
          {errors.text ? <Text className="text-red-500 text-[11px] flex-1">{errors.text}</Text> : <View />}
          {isTextAnswer && (
            <Text className="text-tb-muted text-[10px]">
              {text.length} / {SUBMISSION_LIMITS.textMax}
            </Text>
          )}
        </View>
      </View>

      {errors.form ? <Text className="text-red-500 text-xs text-center">{errors.form}</Text> : null}

      <Pressable
        onPress={confirmSubmit}
        disabled={busy}
        accessibilityRole="button"
        className={`flex-row items-center justify-center gap-2 py-4 rounded-2xl ${busy ? 'bg-tb-gold/60' : 'bg-tb-gold active:opacity-80'}`}
      >
        {busy ? (
          <>
            <ActivityIndicator color="#FFFFFF" />
            {progress != null && <Text className="text-white font-bold">{Math.round(progress * 100)}%</Text>}
          </>
        ) : (
          <>
            <Send size={16} color="#FFFFFF" />
            <Text className="text-white font-bold">{isRevision ? 'إعادة التسليم' : 'تسليم الواجب'}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
