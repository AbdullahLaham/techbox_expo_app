// src/components/AuthInput.tsx
import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
}

export function AuthInput({ label, ...props }: AuthInputProps) {
  return (
    <View className="mb-6">
      <Text className="text-tb-navy/80 text-sm font-semibold mb-2">
        {label}
      </Text>
      <View className="bg-white border-tb-muted/20 border rounded-2xl p-2 shadow-inner focus:border-tb-gold/60">
        <TextInput
          placeholderTextColor="#A3AED0"
          textAlign="right"
          className="text-tb-navy text-base leading-5 font-normal"
          {...props}
        />
      </View>
    </View>
  );
}