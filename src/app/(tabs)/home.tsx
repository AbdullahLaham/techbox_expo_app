// src/app/(tabs)/index.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Rocket, BookOpen, Clock, Award, PlayCircle, ChevronLeft } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* الهيدر القابل للإعادة الاستخدام */}
      <Header />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="px-6 pt-6"
      >
        {/* BANNER: بطاقة الحاضنة والتطوير */}
        <View className="bg-tb-navy rounded-3xl p-6 shadow-xl shadow-tb-navy/30 mb-8 relative overflow-hidden">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pl-4 items-start">
              <View className="bg-tb-gold/20 px-3 py-1 rounded-full mb-3 border border-tb-gold/30">
                <Text className="text-tb-gold text-xs font-bold">حاضنة المشاريع 🚀</Text>
              </View>
              <Text className="text-white text-2xl font-bold mb-2 text-right">
                انطلق بمشروعك إلى المستوى التالي
              </Text>
              <Text className="text-tb-muted text-xs leading-5 mb-4 text-right">
                احصل على توجيه مباشر من الخبراء وادعم مهاراتك التقنية في تك بوكس.
              </Text>
              <TouchableOpacity className="bg-tb-gold px-5 py-3 rounded-xl flex-row items-center">
                <Text className="text-white font-bold text-sm ml-2">استكشف البرامج</Text>
                <Rocket size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 1: إحصائيات التعلم السريعة */}
        <Text className="text-tb-navy text-lg font-bold mb-4 text-right">ملخص نظرتك العامة</Text>
        <View className="flex-row space-x-3 space-x-reverse mb-8">
          <View className="flex-1 bg-white p-4 rounded-2xl border border-tb-muted/10 shadow-sm items-start">
            <View className="w-10 h-10 bg-tb-navy/5 rounded-xl items-center justify-center mb-3">
              <BookOpen size={20} color="#1B254B" />
            </View>
            <Text className="text-tb-navy text-xl font-bold">4</Text>
            <Text className="text-tb-muted text-xs font-semibold mt-1">الكورسات الحالية</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-2xl border border-tb-muted/10 shadow-sm items-start">
            <View className="w-10 h-10 bg-tb-gold/10 rounded-xl items-center justify-center mb-3">
              <Clock size={20} color="#BF9B30" />
            </View>
            <Text className="text-tb-navy text-xl font-bold">12.5 س</Text>
            <Text className="text-tb-muted text-xs font-semibold mt-1">ساعات التعلم</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-2xl border border-tb-muted/10 shadow-sm items-start">
            <View className="w-10 h-10 bg-green-500/10 rounded-xl items-center justify-center mb-3">
              <Award size={20} color="#10B981" />
            </View>
            <Text className="text-tb-navy text-xl font-bold">2</Text>
            <Text className="text-tb-muted text-xs font-semibold mt-1">شهادات مكتملة</Text>
          </View>
        </View>

        {/* SECTION 2: متابعة التعلم (مواصلة الكورس) */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-tb-navy text-lg font-bold">متابعة التعلم</Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-tb-gold text-xs font-bold ml-1">عرض الكل</Text>
            <ChevronLeft size={14} color="#BF9B30" />
          </TouchableOpacity>
        </View>

        <View className="bg-white p-5 rounded-3xl border border-tb-muted/10 shadow-sm mb-8">
          <View className="flex-row items-center mb-4 space-x-4 space-x-reverse">
            <View className="w-14 h-14 bg-tb-navy/10 rounded-2xl items-center justify-center">
              <PlayCircle size={32} color="#1B254B" />
            </View>
            <View className="flex-1 items-start">
              <Text className="text-tb-navy font-bold text-base mb-1">
                تطوير التطبيقات بـ React Native & Expo
              </Text>
              <Text className="text-tb-muted text-xs">الوحدة 3: إدارة الحالات المتقدمة</Text>
            </View>
          </View>

          {/* شريط التقدم */}
          <View className="w-full bg-tb-background h-2 rounded-full overflow-hidden mb-2">
            <View className="bg-tb-gold h-full w-[65%]" />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-tb-muted text-xs">تم إنجاز 65%</Text>
            <Text className="text-tb-navy text-xs font-bold">المتبقي 20 دقيقة</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}