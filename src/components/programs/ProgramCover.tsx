// src/components/programs/ProgramCover.tsx
// A program's cover image, or a light branded placeholder (type tint + icon) when it has none.
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import type { ProgramType } from '@/types/api.contract';
import { resolveFileUrl } from '@/services/fileUrl';
import { getProgramTypeUi } from './programTypeUi';

interface ProgramCoverProps {
  coverImage: string | null;
  type: ProgramType;
  /** Size and corner classes, e.g. "h-32 rounded-t-[28px]". */
  className?: string;
  iconSize?: number;
}

export function ProgramCover({ coverImage, type, className = '', iconSize = 40 }: ProgramCoverProps) {
  const { Icon, color, tint } = getProgramTypeUi(type);

  return (
    <View className={`overflow-hidden ${className}`} style={{ backgroundColor: tint }}>
      {coverImage ? (
        <Image
          source={{ uri: resolveFileUrl(coverImage) }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <View className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-white/60" />
          <View className="absolute -bottom-10 -left-8 w-28 h-28 rounded-full bg-tb-gold/10" />
          <Icon size={iconSize} color={color} strokeWidth={1.6} />
        </View>
      )}
    </View>
  );
}
