// src/hooks/useRefetchOnFocus.ts
import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/** Refetch when the screen regains focus; skips the first focus (the query has just fetched on mount). */
export function useRefetchOnFocus(refetch: () => unknown) {
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );
}
