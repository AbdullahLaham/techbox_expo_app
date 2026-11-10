// src/components/profile/Avatar.tsx
// Profile picture from a signed link, or the first letter of the name.
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

type AvatarProps = { url: string | null | undefined; name: string | null | undefined; size: number };

export function Avatar({ url, name, size }: AvatarProps) {
  // A signed link can expire while the screen is open: fall back to the letter.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!url && url !== failedUrl;
  const letter = name?.trim().charAt(0).toUpperCase() || 'ت';

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-tb-navy items-center justify-center overflow-hidden"
    >
      {showImage ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          onError={() => setFailedUrl(url)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text className="text-tb-gold font-bold" style={{ fontSize: size * 0.38 }}>
          {letter}
        </Text>
      )}
    </View>
  );
}
