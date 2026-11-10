// src/components/common/ScreenTopBar.tsx
// Back button + centred title, as on the assignment detail screen.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export function ScreenTopBar({ title, onBack }: { title: string; onBack: () => void }) {
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
        {title}
      </Text>
      <View className="w-10" />
    </View>
  );
}
