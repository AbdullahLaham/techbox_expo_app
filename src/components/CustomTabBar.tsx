// src/components/CustomTabBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleProp, ViewStyle } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LucideIcon, Home, BookOpen, Search, User } from 'lucide-react-native';

// Map icon components to route names
const ICONS: Record<string, LucideIcon> = {
  index: Home,
  courses: BookOpen,
  search: Search,
  profile: User,
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View className="absolute bottom-6 left-6 right-6 items-center">
      <View className="flex-row bg-tb-navy h-16 rounded-full px-3 items-center justify-between shadow-2xl shadow-tb-navy/50 border border-white/10">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          const IconComponent = ICONS[route.name] || Home;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              className={`flex-row items-center justify-center px-4 py-2.5 rounded-full transition-all ${
                isFocused ? 'bg-tb-gold' : 'bg-transparent'
              }`}
            >
              <IconComponent
                size={22}
                color={isFocused ? '#FFFFFF' : '#8A99B8'} // Gold highlighted with white icon, muted gray inactive
                strokeWidth={isFocused ? 2.5 : 1.8}
              />
              {isFocused && (
                <Text className="text-white font-bold text-xs ml-2 tracking-wide capitalize">
                  {label === 'index' ? 'Home' : label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}