// // src/components/program/EnrollmentCTA.tsx
// import React from 'react';
// import { View, Text, TouchableOpacity } from 'react-native';
// import { Rocket, Sparkles, ChevronLeft } from 'lucide-react-native';

// interface EnrollmentCTAProps {
//   onEnrollPress: () => void;
// }

// export function EnrollmentCTA({ onEnrollPress }: EnrollmentCTAProps) {
//   return (
//     <View className="bg-white p-5 mb-8 border-t border-tb-muted/10 shadow-2xl flex-row items-center justify-between">
//       <View className="flex-1 pl-3 items-start">
//         <View className="flex-row items-center mb-1">
//           <Sparkles size={14} color="#BF9B30" />
//           <Text className="text-tb-gold text-xs font-bold mr-1">المقاعد محدودة</Text>
//         </View>
//         <Text className="text-tb-navy font-bold text-xs">احجز مقعدك في الدفعة الحالية</Text>
//       </View>

//       <TouchableOpacity
//         onPress={onEnrollPress}
//         className="bg-tb-gold px-6 py-3.5 rounded-2xl flex-row items-center shadow-lg shadow-tb-gold/40 active:opacity-90"
//       >
//         <Text className="text-white font-bold text-base ml-2">تقديم طلب الانضمام</Text>
//         <Rocket size={18} color="#FFFFFF" />
//       </TouchableOpacity>
//     </View>
//   );
// }

// src/components/program/EnrollmentCTA.tsx
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Rocket, Sparkles } from 'lucide-react-native';

interface EnrollmentCTAProps {
  onEnrollPress: () => void;
  /** Shows a spinner and blocks double taps while the request is in flight. */
  isLoading?: boolean;
  disabled?: boolean;
}

export function EnrollmentCTA({ onEnrollPress, isLoading = false, disabled = false }: EnrollmentCTAProps) {
  const insets = useSafeAreaInsets();
  const isDisabled = disabled || isLoading;

  return (
    <View
      className="bg-white border-t border-tb-muted/10 px-5 pt-4 shadow-2xl flex-row items-center gap-4"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <View className="flex-1 items-start gap-1">
        <View className="flex-row items-center gap-1">
          <Sparkles size={14} color="#BF9B30" />
          <Text className="text-tb-gold text-xs font-bold">المقاعد محدودة</Text>
        </View>
        <Text className="text-tb-navy font-bold text-sm">احجز مقعدك في الدفعة الحالية</Text>
      </View>

      <Pressable
        onPress={onEnrollPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel="تقديم طلب الانضمام"
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        className={`bg-tb-gold h-12 px-5 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-tb-gold/40 active:opacity-90 ${
          isDisabled ? 'opacity-60' : ''
        }`}
      >
        <Text className="text-white font-bold text-sm">تقديم طلب الانضمام</Text>
        {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Rocket size={18} color="#FFFFFF" />}
      </Pressable>
    </View>
  );
}