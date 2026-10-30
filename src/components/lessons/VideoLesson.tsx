// src/components/lessons/VideoLesson.tsx
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
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

/** Save the video position about this often while it plays (the API asks for ~15 s). */
const SAVE_EVERY_SEC = 15;
/** Do not resume this close to the start or the end. */
const RESUME_MARGIN_SEC = 5;

async function openInBrowser(url: string) {
  try {
    await openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
  } catch {
    Alert.alert('تعذّر تشغيل الفيديو', 'تعذّر فتح مشغّل الفيديو على هذا الجهاز، حاول مرة أخرى.');
  }
}

interface InlinePlayerProps {
  url: string;
  /** Where the learner stopped last time (NodeContent.progress.lastPositionSec). */
  resumeAt: number;
  /** Called about every 15 s while playing, on pause and when leaving the screen. */
  onPosition?: (positionSec: number) => void;
}

function InlinePlayer({ url, resumeAt, onPosition }: InlinePlayerProps) {
  const player = useVideoPlayer(url, (p) => {
    p.timeUpdateEventInterval = 1;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  const lastTime = useRef(0);
  const lastSaved = useRef<number | null>(null);
  const resumed = useRef(false);

  // `force` (pause, leaving): save unless nothing moved; otherwise only every SAVE_EVERY_SEC.
  const save = useEffectEvent((force: boolean) => {
    const at = Math.floor(lastTime.current);
    if (!onPosition || at <= 0) return;
    const moved = lastSaved.current === null ? Infinity : Math.abs(at - lastSaved.current);
    if (moved >= (force ? 1 : SAVE_EVERY_SEC)) {
      lastSaved.current = at;
      onPosition(at);
    }
  });

  // Resume once, when the video is ready (seeking before that is ignored on Android).
  const resume = useEffectEvent(() => {
    if (resumed.current) return;
    resumed.current = true;
    const end = player.duration > 0 ? player.duration - RESUME_MARGIN_SEC : Infinity;
    if (resumeAt > RESUME_MARGIN_SEC && resumeAt < end) {
      player.seekBy(resumeAt - player.currentTime);
      lastTime.current = resumeAt;
      lastSaved.current = Math.floor(resumeAt);
    }
  });

  useEffect(() => {
    const subscriptions = [
      player.addListener('statusChange', ({ status: next }) => {
        if (next === 'readyToPlay') resume();
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        lastTime.current = currentTime;
        if (player.playing) save(false);
      }),
      player.addListener('playingChange', ({ isPlaying }) => {
        if (!isPlaying) save(true);
      }),
    ];
    return () => {
      subscriptions.forEach((s) => s.remove());
      save(true); // leaving the lesson
    };
  }, [player]);

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

interface VideoLessonProps {
  video: NodeContent['video'];
  /** Resume position in seconds (0 = from the start). */
  resumeAt?: number;
  /** Receives the playback position to save (inline player only: embeds cannot report it). */
  onPosition?: (positionSec: number) => void;
}

export function VideoLesson({ video, resumeAt = 0, onPosition }: VideoLessonProps) {
  if (!video?.playbackUrl) {
    return (
      <View className="rounded-3xl bg-white border border-tb-muted/10 items-center justify-center p-8">
        <VideoOff size={32} color="#8A99B8" />
        <Text className="text-tb-muted text-sm mt-3">الفيديو غير متوفر حالياً.</Text>
      </View>
    );
  }

  const url = resolveFileUrl(video.playbackUrl);
  return DIRECT_MEDIA.test(url) ? (
    <InlinePlayer url={url} resumeAt={resumeAt} onPosition={onPosition} />
  ) : (
    <EmbedCard url={url} durationSec={video.durationSec} />
  );
}
