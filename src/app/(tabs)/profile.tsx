// src/app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_LABELS_AR } from '@/types/auth';
import { User, Mail, Shield, LogOut, ChevronLeft, Settings, Award } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  // Read once: `user` is null after logout, and the React Compiler may evaluate a plain
  // `user.x` read before its `user?.x` guard (see course/[slug].tsx).
  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const role = user?.globalRole ?? null;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت تأكد من رغبتك في تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} className="px-6 pt-6">
        {/* البطاقة الشخصية */}
        <View className="bg-white p-6 rounded-3xl border border-tb-muted/10 shadow-sm items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-tb-navy items-center justify-center mb-4 border-4 border-tb-gold/20 shadow-md">
            <Text className="text-tb-gold font-bold text-3xl">
              {firstName ? firstName.charAt(0).toUpperCase() : 'ت'}
            </Text>
          </View>

          <Text className="text-tb-navy text-2xl font-bold mb-1">
            {firstName ? `${firstName} ${lastName}` : 'طالب تك بوكس'}
          </Text>
          <Text className="text-tb-muted text-sm mb-3">{user?.email || 'user@example.com'}</Text>

          <View className="bg-tb-gold/10 px-4 py-1.5 rounded-full border border-tb-gold/30">
            <Text className="text-tb-gold text-xs font-bold">الدور: {role ? ROLE_LABELS_AR[role] : '—'}</Text>
          </View>
        </View>

        {/* خيارات الحساب */}
        <View className="bg-white rounded-3xl border border-tb-muted/10 shadow-sm p-2 mb-6">
          {[
            { label: 'تعديل الملف الشخصي', icon: User },
            { label: 'الشهادات والإنجازات', icon: Award },
            { label: 'إعدادات الحساب', icon: Settings },
            { label: 'الأمان والخصوصية', icon: Shield },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={index} className="flex-row items-center justify-between p-4 border-b border-tb-muted/5">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center ml-3">
                    <Icon size={20} color="#1B254B" />
                  </View>
                  <Text className="text-tb-navy font-bold text-sm">{item.label}</Text>
                </View>
                <ChevronLeft size={16} color="#8A99B8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* زر تسجيل الخروج */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 p-4 rounded-2xl border border-red-200 flex-row items-center justify-center space-x-2 space-x-reverse"
        >
          <LogOut size={20} color="#DC2626" />
          <Text className="text-red-600 font-bold text-base">تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}