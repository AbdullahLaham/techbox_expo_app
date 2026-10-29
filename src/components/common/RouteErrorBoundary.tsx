// src/components/common/RouteErrorBoundary.tsx
// Fallback for render crashes. Export it as `ErrorBoundary` from a route or layout file;
// Expo Router wraps that route in a React error boundary and renders this instead of a blank screen.
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ErrorBoundaryProps } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { StateCard } from './StateCard';

export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error('Route crashed:', error);

  return (
    <SafeAreaView className="flex-1 bg-tb-background justify-center px-6">
      <View>
        <StateCard
          Icon={AlertTriangle}
          title="حدث خطأ غير متوقع"
          message={
            __DEV__ ? error.message : 'نعتذر، حدثت مشكلة أثناء عرض هذه الصفحة. يرجى المحاولة مرة أخرى.'
          }
          actionLabel="إعادة المحاولة"
          onAction={retry}
        />
      </View>
    </SafeAreaView>
  );
}
