// src/components/lessons/LessonUi.tsx
// Building blocks shared by the lesson, quiz and quiz-result screens (same look as the assignment detail).
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import axios from 'axios';
import { ChevronRight } from 'lucide-react-native';

export const isNotFound = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404;

export const errorCode = (error: unknown): string | undefined =>
  axios.isAxiosError<{ code?: string }>(error) ? error.response?.data?.code : undefined;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 600 -> "10:00", 3725 -> "1:02:05" */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
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
      <Text accessibilityRole="header" className="text-tb-navy font-bold text-lg flex-1 text-center mx-3" numberOfLines={1}>
        {title}
      </Text>
      <View className="w-10" />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text className="text-tb-navy text-base font-bold mb-3 mt-2">{children}</Text>;
}

export function InfoTile({ label, value, valueClass = 'text-tb-navy' }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-1 min-w-[45%] bg-tb-background rounded-2xl p-3">
      <Text className="text-tb-muted text-[11px] font-semibold mb-1">{label}</Text>
      <Text className={`text-sm font-bold ${valueClass}`}>{value}</Text>
    </View>
  );
}

export function Bone({ className }: { className: string }) {
  return <View className={`rounded-lg bg-tb-muted/15 ${className}`} />;
}

export function ScreenSkeleton() {
  return (
    <View className="px-6 pt-6 gap-4">
      <View className="bg-white rounded-3xl p-6 gap-3">
        <Bone className="h-3 w-1/3" />
        <Bone className="h-5 w-3/4" />
        <Bone className="h-7 w-24 rounded-full" />
      </View>
      <View className="bg-white rounded-3xl p-6 gap-3">
        <Bone className="h-40 w-full rounded-2xl" />
        <Bone className="h-3 w-5/6" />
        <Bone className="h-3 w-2/3" />
      </View>
    </View>
  );
}
