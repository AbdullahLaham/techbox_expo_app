// src/components/lessons/ReadingLesson.tsx
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { Download, ExternalLink, FileText, Link2, FileX } from 'lucide-react-native';

import { getApiErrorMessage } from '@/api/errors';
import { resolveFileUrl } from '@/services/fileUrl';
import { formatBytes } from '@/components/lessons/LessonUi';
import type { StudentNodeResource } from '@/types/nodes.contract';

function hostOf(url: string): string {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1] : url;
}

interface ReadingLessonProps {
  resource: StudentNodeResource | null;
  /**
   * Returns a usable copy of the resource: FILE links are signed for about an hour, so the
   * screen refetches the lesson when its copy is getting old. null = the resource was removed.
   */
  getFreshResource: () => Promise<StudentNodeResource | null>;
}

export function ReadingLesson({ resource, getFreshResource }: ReadingLessonProps) {
  const [opening, setOpening] = useState(false);

  if (!resource) {
    return (
      <View className="rounded-3xl bg-white border border-tb-muted/10 items-center justify-center p-8">
        <FileX size={32} color="#8A99B8" />
        <Text className="text-tb-muted text-sm mt-3">لم يُرفق محتوى لهذا الدرس بعد.</Text>
      </View>
    );
  }

  const isFile = resource.kind === 'FILE';
  const title = isFile ? (resource.fileName ?? 'ملف الدرس') : hostOf(resource.url);
  const subtitle = isFile
    ? [resource.sizeBytes != null ? formatBytes(resource.sizeBytes) : null, 'ملف'].filter(Boolean).join(' • ')
    : 'رابط خارجي';

  const open = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const fresh = await getFreshResource();
      if (!fresh) {
        Alert.alert('المحتوى غير متاح', 'تمت إزالة محتوى هذا الدرس.');
        return;
      }
      if (fresh.kind === 'FILE') {
        // Served with Content-Disposition: attachment; the system browser previews or saves it.
        await Linking.openURL(resolveFileUrl(fresh.url));
      } else {
        await openBrowserAsync(fresh.url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
      }
    } catch (e) {
      Alert.alert('تعذّر فتح المحتوى', getApiErrorMessage(e, 'تعذّر فتح المحتوى على هذا الجهاز، حاول مرة أخرى.'));
    } finally {
      setOpening(false);
    }
  };

  const Icon = isFile ? FileText : Link2;
  return (
    <Pressable
      onPress={() => void open()}
      disabled={opening}
      accessibilityRole="button"
      accessibilityLabel={isFile ? `فتح الملف ${title}` : `فتح الرابط ${title}`}
      className="flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-tb-muted/10 active:bg-tb-background"
    >
      <View className="w-12 h-12 rounded-2xl bg-emerald-500/10 items-center justify-center">
        <Icon size={22} color="#10B981" />
      </View>
      <View className="flex-1 items-start">
        <Text className="text-tb-navy text-sm font-bold" numberOfLines={2}>
          {title}
        </Text>
        <Text className="text-tb-muted text-[11px] mt-0.5">{subtitle}</Text>
      </View>
      {opening ? (
        <ActivityIndicator color="#BF9B30" />
      ) : isFile ? (
        <Download size={20} color="#BF9B30" />
      ) : (
        <ExternalLink size={20} color="#BF9B30" />
      )}
    </Pressable>
  );
}
