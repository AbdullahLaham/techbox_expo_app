// src/components/lessons/VideoLesson.tsx
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { AlertCircle, ExternalLink, PlayCircle, VideoOff } from 'lucide-react-native';

import { resolveFileUrl } from '@/services/fileUrl';
import { formatDuration } from '@/components/lessons/LessonUi';
import type { NodeContent } from '@/types/nodes.contract';

/** Direct media files play inline; anything else (e.g. a Bunny iframe embed page) opens in the in-app browser. */
const DIRECT_MEDIA = /\.(mp4|m4v|mov|webm|m3u8)(\?|#|$)/i;

async function openInBrowser(url: string) {
  try {
    await openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
  } catch {
    Alert.alert('تعذّر تشغيل الفيديو', 'تعذّر فتح مشغّل الفيديو على هذا الجهاز، حاول مرة أخرى.');
  }
}

function InlinePlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  return (
    <>
      <View className="rounded-3xl overflow-hidden bg-black" style={{ aspectRatio: 16 / 9 }}>
        <VideoView player={player} style={{ flex: 1 }} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />
        {status === 'loading' && (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </View>
      {status === 'error' && (
        <View className="flex-row items-center gap-2 mt-3 bg-red-50 rounded-2xl p-3">
          <AlertCircle size={16} color="#EF4444" />
          <Text className="text-red-600 text-xs flex-1">تعذّر تشغيل الفيديو هنا.</Text>
          <Pressable onPress={() => void openInBrowser(url)} accessibilityRole="button" hitSlop={8}>
            <Text className="text-tb-gold text-xs font-bold">فتح في المتصفح</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

function EmbedCard({ url, durationSec }: { url: string; durationSec: number }) {
  const [opening, setOpening] = useState(false);
  const open = async () => {
    setOpening(true);
    await openInBrowser(url);
    setOpening(false);
  };

  return (
    <Pressable
      onPress={() => void open()}
      disabled={opening}
      accessibilityRole="button"
      accessibilityLabel="تشغيل الفيديو"
      className="rounded-3xl bg-tb-navy items-center justify-center active:opacity-90"
      style={{ aspectRatio: 16 / 9 }}
    >
      {opening ? <ActivityIndicator color="#FFFFFF" /> : <PlayCircle size={56} color="#FFFFFF" strokeWidth={1.5} />}
      <Text className="text-white font-bold text-sm mt-3">تشغيل الفيديو</Text>
      <View className="flex-row items-center gap-1.5 mt-1">
        <ExternalLink size={11} color="#C9D1E3" />
        <Text className="text-[#C9D1E3] text-[11px]">
          يُفتح في المشغّل{durationSec > 0 ? ` • ${formatDuration(durationSec)}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export function VideoLesson({ video }: { video: NodeContent['video'] }) {
  if (!video?.playbackUrl) {
    return (
      <View className="rounded-3xl bg-white border border-tb-muted/10 items-center justify-center p-8">
        <VideoOff size={32} color="#8A99B8" />
        <Text className="text-tb-muted text-sm mt-3">الفيديو غير متوفر حالياً.</Text>
      </View>
    );
  }

  const url = resolveFileUrl(video.playbackUrl);
  return DIRECT_MEDIA.test(url) ? <InlinePlayer url={url} /> : <EmbedCard url={url} durationSec={video.durationSec} />;
}
