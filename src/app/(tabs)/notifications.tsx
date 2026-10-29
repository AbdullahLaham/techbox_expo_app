// src/app/(tabs)/notifications.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Bell, Award, BookOpen, CheckCircle } from 'lucide-react-native';

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Header title="الإشعارات والتنبيهات" showUser={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} className="px-6 pt-4">
        {[
          { title: 'تم تقييم واجبك بنجاح', desc: 'حصلت على درجة 95% في واجب نظام التوثيق.', icon: Award, color: 'bg-tb-gold/10', iconColor: '#BF9B30', time: 'منذ ساعتين' },
          { title: 'درس جديد متاح الآن', desc: 'تمت إضافة درس جديد في كورس حاضنة المشاريع التقنية.', icon: BookOpen, color: 'bg-tb-navy/10', iconColor: '#1B254B', time: 'أمس' },
          { title: 'تم تأكيد انضمامك للكورس', desc: 'أهلاً بك في كورس تطوير التطبيقات المتقدم.', icon: CheckCircle, color: 'bg-green-500/10', iconColor: '#10B981', time: 'منذ 3 أيام' },
        ].map((notif, index) => {
          const Icon = notif.icon;
          return (
            <TouchableOpacity key={index} className="bg-white p-4 rounded-3xl border border-tb-muted/10 shadow-sm mb-3 flex-row items-center space-x-4 space-x-reverse">
              <View className={`w-12 h-12 rounded-2xl items-center justify-center ${notif.color}`}>
                <Icon size={22} color={notif.iconColor} />
              </View>
              <View className="flex-1 items-start">
                <View className="flex-row justify-between w-full items-center mb-1">
                  <Text className="text-tb-navy font-bold text-sm">{notif.title}</Text>
                  <Text className="text-tb-muted text-[10px]">{notif.time}</Text>
                </View>
                <Text className="text-tb-muted text-xs leading-5 text-right">{notif.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}