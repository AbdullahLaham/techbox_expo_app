// // src/app/(auth)/register.tsx
// import React from 'react';
// import { View, Text, Image, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
// import { Link, useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { AuthInput } from '@/components/AuthInput';
// import { PrimaryButton } from '@/components/PrimaryButton';

// export default function RegisterPage() {
//   const router = useRouter();

//   const handleRegister = () => {
//     console.log("جاري إنشاء الحساب...");
//     // router.replace('/(auth)/login');
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-tb-background">
//       <StatusBar barStyle="dark-content" />
//       <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
//         <View className="flex-1 justify-center px-6 py-6">
          
//           {/* قسم الشعار والعنوان */}
//           <View className="items-center mb-8">
//             <Image 
//               source={require('@/assets/images/logo.jpg')}
//               className="w-20 h-20 mb-4"
//               resizeMode="contain"
//             />
//             <Text className="text-tb-navy text-3xl font-bold tracking-tight mb-2 text-center">
//               إنشاء حساب جديد
//             </Text>
//             <Text className="text-tb-muted text-base text-center px-4">
//               أدخل بياناتك أدناه للبدء في استخدام منصة تك بوكس
//             </Text>
//           </View>

//           {/* نموذج البيانات */}
//           <View className="bg-white p-6 rounded-3xl shadow-sm border border-tb-muted/10 mb-8">
//             <AuthInput 
//               label="الاسم الكامل"
//               placeholder="عبدالله اللحام"
//             />
//             <AuthInput 
//               label="البريد الإلكتروني"
//               placeholder="name@example.com"
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />
//             <AuthInput 
//               label="كلمة المرور"
//               placeholder="8 أحرف على الأقل"
//               secureTextEntry={true}
//             />
//             <AuthInput 
//               label="تأكيد كلمة المرور"
//               placeholder="أعد كتابة كلمة المرور"
//               secureTextEntry={true}
//             />

//             <PrimaryButton title="إنشاء الحساب" onPress={handleRegister} />
//           </View>

//           {/* أسفل الصفحة */}
//           <View className="flex-row justify-center items-center">
//             <Text className="text-tb-muted text-base ml-1">لديك حساب بالفعل؟</Text>
//             <Link href="/(auth)/login" asChild>
//               <TouchableOpacity>
//                 <Text className="text-tb-navy text-base font-bold">تسجيل الدخول</Text>
//               </TouchableOpacity>
//             </Link>
//           </View>

//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }


// src/app/(auth)/register.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthInput } from '@/components/AuthInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  // state للحقول المطلوبة والاختيارية
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');

  const handleRegister = async () => {
    clearError();

    // 1. التحقق الأساسي من إدخال الحقول الإجبارية
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('خطأ في البيانات', 'يرجى إدخال جميع الحقول المطلوبة');
      return;
    }

    // 2. التحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
      Alert.alert('خطأ في كلمة المرور', 'كلمتا المرور غير متطابقتين');
      return;
    }

    // 3. التحقق من طول كلمة المرور (حسب DTO المطلوب - 8 حروف على الأقل)
    if (password.length < 8) {
      Alert.alert('كلمة المرور ضعيفة', 'كلمة المرور يجب أن لا تقل عن 8 حروف');
      return;
    }

    try {
      // إرسال البيانات للـ Store والتي ستقوم بالتسجيل والتسجيل التلقائي والدخول
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim() || undefined,
      });

      Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح!');
      // router.replace('/(tabs)'); // سيتم تحويل المستخدم تلقائياً عند الدخول
    } catch (err: any) {
      Alert.alert('فشل إنشاء الحساب', err.message || 'حدث خطأ غير متوقع');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-tb-background">
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          
          {/* قسم الشعار والعنوان */}
          <View className="items-center mb-8 mt-4">
            <Image 
              source={require('@/assets/images/logo.jpg')}
              className="w-20 h-20 mb-4"
              resizeMode="contain"
            />
            <Text className="text-tb-navy text-3xl font-bold tracking-tight mb-2 text-center">
              إنشاء حساب جديد
            </Text>
            <Text className="text-tb-muted text-base text-center px-4">
              أدخل بياناتك أدناه للبدء في استخدام منصة تك بوكس
            </Text>
          </View>

          {/* عرض الخطأ القادم من الـ Backend إن وجد */}
          {error && (
            <View className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6">
              <Text className="text-red-600 text-sm font-semibold text-right">
                {error}
              </Text>
            </View>
          )}

          {/* نموذج البيانات */}
          <View className="bg-white p-6 rounded-3xl shadow-sm border border-tb-muted/10 mb-8">
            <View className="flex-row space-x-3 space-x-reverse">
              <View className="flex-1">
                <AuthInput 
                  label="الاسم الأول *"
                  placeholder="عبدالله"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View className="flex-1">
                <AuthInput 
                  label="اسم العائلة *"
                  placeholder="اللحام"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <AuthInput 
              label="البريد الإلكتروني *"
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <AuthInput 
              label="كلمة المرور *"
              placeholder="8 أحرف على الأقل (مثال: Password123!)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <AuthInput 
              label="تأكيد كلمة المرور *"
              placeholder="أعد كتابة كلمة المرور"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <AuthInput 
              label="نبذة شخصية (اختياري)"
              placeholder="اكتب نبذة قصيرة عنك..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            <PrimaryButton 
              title={isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'} 
              onPress={handleRegister} 
              disabled={isLoading}
            />
          </View>

          {/* أسفل الصفحة */}
          <View className="flex-row justify-center items-center">
            <Text className="text-tb-muted text-base ml-1">لديك حساب بالفعل؟</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-tb-navy text-base font-bold">تسجيل الدخول</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}