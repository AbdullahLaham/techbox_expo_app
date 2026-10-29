// src/components/enrollment/FormInput.tsx
import React, { forwardRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { AlertCircle, type LucideIcon } from 'lucide-react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  /** Helper text shown under the field while there is no error. */
  hint?: string;
  required?: boolean;
  /** Optional leading icon (shown at the start of the field). */
  icon?: LucideIcon;
}

const COLORS = {
  gold: '#BF9B30',
  muted: '#8A99B8',
  error: '#EF4444',
} as const;

export const FormInput = forwardRef<TextInput, FormInputProps>(function FormInput(
  { label, error, hint, required = true, icon: Icon, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-red-400 bg-red-50/30'
    : focused
      ? 'border-tb-gold bg-white'
      : 'border-tb-muted/20 bg-white';

  return (
    <View className="mb-5 w-full">
      {/* Label */}
      <View className="flex-row items-center gap-1 mb-1.5">
        <Text className="text-tb-navy text-sm font-semibold">{label}</Text>
        {required && <Text className="text-red-500 text-xs">*</Text>}
      </View>

      {/* Field */}
      <View
        className={`flex-row items-center gap-3 border rounded-2xl px-4 ${
          inputProps.multiline ? 'min-h-[96px] py-3 items-start' : 'h-14'
        } ${borderClass}`}
      >
        {Icon ? <Icon size={18} color={focused ? COLORS.gold : COLORS.muted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#A3AED0"
          accessibilityLabel={label}
          className="flex-1 text-tb-navy text-base"
          style={inputProps.multiline ? undefined : { height: '100%' }}
          textAlignVertical={inputProps.multiline ? 'top' : 'center'}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>

      {/* Error or hint */}
      {error ? (
        <View className="flex-row items-center gap-1 mt-1.5" accessibilityLiveRegion="polite">
          <AlertCircle size={12} color={COLORS.error} />
          <Text className="text-red-500 text-xs font-medium flex-1">{error}</Text>
        </View>
      ) : hint ? (
        <Text className="text-tb-muted text-[11px] mt-1.5">{hint}</Text>
      ) : null}
    </View>
  );
});