// src/components/common/StateCard.tsx
// Same card the programs screen defined inline; extracted so every list screen shares it.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface StateCardProps {
  Icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function StateCard({ Icon, title, message, actionLabel, onAction }: StateCardProps) {
  return (
    <View className="bg-white rounded-3xl border border-tb-muted/10 px-6 py-10 items-center">
      <View className="w-14 h-14 rounded-2xl bg-tb-gold/10 items-center justify-center mb-4">
        <Icon size={26} color="#BF9B30" />
      </View>
      <Text className="text-tb-navy font-bold text-base mb-1">{title}</Text>
      <Text className="text-tb-muted text-xs leading-5 text-center">{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          className="mt-5 bg-tb-navy px-6 py-3 rounded-2xl active:opacity-80"
        >
          <Text className="text-white font-bold text-sm">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}