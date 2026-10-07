// src/app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthInput } from '@/components/AuthInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();

    const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, isLoading, error, token, user } = useAuthStore();

  console.log(user, 'ttttttttttttttttttttttttttttt')

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      const res = await login({ email, password });
      console.log(res, 'login response');
      router.replace("/(tabs)/home");
      // Router will automatically redirect via Auth Guard
    } catch (err: any) {
      Alert.alert('فشل تسجيل الدخول', err.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-tb-background">
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          
          {/* قسم الشعار والعنوان */}
          <View className="items-center mb-10">
            <Image 
              source={require('@/assets/images/logo.jpg')} // مسار الشعار الخاص بك
              className="w-32 h-32 mb-6"
              resizeMode="contain"
            />
            <Text className="text-tb-navy text-3xl font-bold tracking-tight mb-2 text-center">
              مرحباً بك مجدداً
            </Text>
            <Text className="text-tb-muted text-base px-2 text-center">
              سجل الدخول للوصول إلى دوراتك وحسابك الشخصي في تك بوكس
            </Text>
          </View>

          {/* نموذج البيانات */}
          <View className="bg-white p-6 rounded-3xl shadow-sm border border-tb-muted/10 mb-8">
            <AuthInput 
              label="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AuthInput 
              label="كلمة المرور"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={true}
            />
            
            <View className="flex-row justify-start mb-6 -mt-3">
              <TouchableOpacity onPress={handleLogin}>
                <Text className="text-tb-gold/90 text-sm font-medium">نسيت كلمة المرور؟</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
        title={isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
        onPress={handleLogin}
        disabled={isLoading}
      />
          </View>

          {/* أسفل الصفحة */}
          <View className="flex-row justify-center items-center">
            <Text className="text-tb-muted text-base ml-1">ليس لديك حساب؟</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-tb-navy text-base font-bold">إنشاء حساب جديد</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}










// import React, { useState } from 'react';
// import { View, Text, Alert } from 'react-native';
// import { useAuthStore } from '@/store/useAuthStore';
// import { AuthInput } from '@/components/AuthInput';
// import { PrimaryButton } from '@/components/PrimaryButton';

// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
  
//   const { login, isLoading, error } = useAuthStore();

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
//       return;
//     }

//     try {
//       await login({ email, password });
//       Alert.alert('نجاح', 'تم تسجيل الدخول بنجاح!');
//       // Router will automatically redirect via Auth Guard
//     } catch (err: any) {
//       Alert.alert('فشل تسجيل الدخول', err.message);
//     }
//   };

//   return (
//     <View className="p-6">
//       {error && <Text className="text-red-500 mb-4 text-right">{error}</Text>}
      
//       <AuthInput
//         label="البريد الإلكتروني"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
      
//       <AuthInput
//         label="كلمة المرور"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       <PrimaryButton
//         title={isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
//         onPress={handleLogin}
//         disabled={isLoading}
//       />
//     </View>
//   );
// }