// src/components/Header.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

interface HeaderProps {
  title?: string;
  showUser?: boolean;
}

export function Header({ title, showUser = true }: HeaderProps) {
  const { user } = useAuthStore();
  // Read once: `user` is null after logout, and the React Compiler may evaluate a plain
  // `user.x` read before its `user?.x` guard (see course/[slug].tsx).
  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';

  return (
    <View className="bg-white px-6 pt-4 pb-4 border-b border-tb-muted/10 flex-row items-center justify-between">
      {/* جهة اليمين: معلومات المستخدم أو عنوان الصفحة */}
      <View className="flex-row items-center space-x-3 space-x-reverse">
        {showUser ? (
          <View className="w-11 h-11 rounded-full bg-tb-navy items-center justify-center shadow-sm">
            <Text className="text-tb-gold font-bold text-base">
              {firstName ? firstName.charAt(0).toUpperCase() : 'ت'}
            </Text>
          </View>
        ) : (
          <Image
            source={require('@/assets/images/logo.jpg')}
            className="w-10 h-10"
            resizeMode="contain"
          />
        )}

        <View className="items-start">
          {showUser ? (
            <>
              <Text className="text-tb-muted text-xs font-semibold">مرحباً بك 👋</Text>
              <Text className="text-tb-navy text-lg font-bold">
                {firstName ? `${firstName} ${lastName}` : 'طالب تك بوكس'}
              </Text>
            </>
          ) : (
            <Text className="text-tb-navy text-xl font-bold">{title}</Text>
          )}
        </View>
      </View>

      {/* جهة اليسار: أزرار الإجراءات (الإشعارات والبحث) */}
      <View className="flex-row items-center space-x-2 space-x-reverse">
        <TouchableOpacity className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center border border-tb-muted/10">
          <Search size={20} color="#1B254B" />
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center border border-tb-muted/10 relative">
          <Bell size={20} color="#1B254B" />
          <View className="w-2.5 h-2.5 bg-tb-gold rounded-full absolute top-2 right-2 border border-white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}