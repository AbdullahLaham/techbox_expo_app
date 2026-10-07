// src/components/PrimaryButton.tsx
import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
}

export function PrimaryButton({ title, ...props }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      className="bg-tb-gold h-14 rounded-2xl items-center justify-center shadow-lg shadow-tb-gold/40 active:opacity-90 mt-2 mb-4"
      {...props}
    >
      <Text className="text-white text-lg font-bold tracking-wider">
        {title}
      </Text>
    </TouchableOpacity>
  );
}