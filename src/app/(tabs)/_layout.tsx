// src/app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';

export { RouteErrorBoundary as ErrorBoundary };

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#F4F7FE' }, // TB Background color
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="courses" options={{ title: 'البرامج' }} />
      <Tabs.Screen name="assignments" options={{ title: 'الواجبات' }} />
      <Tabs.Screen name="notifications" options={{ title: 'الإشعارات' }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي' }} />
    </Tabs>
  );
}
