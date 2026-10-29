// src/components/programs/TypeFilterTab.tsx
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export interface FilterOption<T extends string = string> {
  label: string;
  value: T;
}

export interface TypeFilterTabProps<T extends string = string> {
  options: FilterOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  /** Optional result count shown inside each chip, keyed by option value. Missing keys show 0. */
  counts?: Partial<Record<string, number>>;
}

export function TypeFilterTab<T extends string = string>({
  options = [],
  selectedValue,
  onSelect,
  counts,
}: TypeFilterTabProps<T>) {
  if (options.length === 0) return null;

  return (
    <View className="mb-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        accessibilityRole="tablist"
      >
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          const count = counts ? (counts[opt.value] ?? 0) : undefined;

          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full border active:opacity-80 ${
                isSelected ? 'bg-tb-navy border-tb-navy' : 'bg-white border-tb-muted/15'
              }`}
            >
              <Text className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-tb-navy'}`}>
                {opt.label}
              </Text>

              {count !== undefined && (
                <View
                  className={`min-w-[20px] h-5 px-1.5 rounded-full items-center justify-center ${
                    isSelected ? 'bg-tb-gold' : 'bg-tb-background'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-tb-muted'}`}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}