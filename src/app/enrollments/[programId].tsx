
// // src/app/enrollments/[programId].tsx
// import React, { useState } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as ImagePicker from 'expo-image-picker';
// import { ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react-native';

// import { FormInput } from '@/components/enrollment/FormInput';
// import { FormSelect } from '@/components/enrollment/FormSelect';
// import { FileUploader } from '@/components/enrollment/FileUploader';
// import { enrollmentsApi } from '@/api/enrollments';
// import { PALESTINE_GOVERNORATES } from '@/types/enrollment';

// export default function EnrollmentScreen() {
//   const { programId } = useLocalSearchParams<{ programId: string }>();
//   const router = useRouter();

//   // حالة النماذج
//   const [fullNameAr, setFullNameAr] = useState('');
//   const [fullNameEn, setFullNameEn] = useState('');
//   const [age, setAge] = useState('');
//   const [phoneWhatsApp, setPhoneWhatsApp] = useState('');
//   const [nationalId, setNationalId] = useState('');
//   const [governorate, setGovernorate] = useState('');

//   // حالة الملف
//   const [receiptUri, setReceiptUri] = useState<string | undefined>();
//   const [receiptName, setReceiptName] = useState<string | undefined>();
//   const [receiptMimeType, setReceiptMimeType] = useState<string | undefined>();

//   // حالات العرض والتحميل
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isSuccess, setIsSuccess] = useState(false);

//   // اختيار صورة الإيصال
//   const handlePickReceipt = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: false,
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets[0]) {
//       const asset = result.assets[0];
//       setReceiptUri(asset.uri);
//       setReceiptName(asset.fileName || 'receipt.jpg');
//       setReceiptMimeType(asset.mimeType || 'image/jpeg');
//     }
//   };

//   // التحقق من صحة المدخلات
//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (!fullNameAr.trim()) newErrors.fullNameAr = 'يرجى إدخال الاسم الثلاثي بالعربي';
//     if (!fullNameEn.trim()) newErrors.fullNameEn = 'يرجى إدخال الاسم بالإنجليزية';
    
//     const parsedAge = parseInt(age, 10);
//     if (!age || isNaN(parsedAge) || parsedAge < 10) {
//       newErrors.age = 'العمر يجب أن يكون 10 سنوات على الأقل';
//     }

//     if (!phoneWhatsApp.trim()) newErrors.phoneWhatsApp = 'يرجى إدخال رقم الجوال/الواتساب';
//     if (!nationalId.trim()) newErrors.nationalId = 'يرجى إدخال رقم الهوية الوطنية';
//     if (!governorate) newErrors.governorate = 'يرجى اختيار المحافظة';

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // إرسال الطلب
//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     try {
//       setLoading(true);
//       await enrollmentsApi.enrollInProgram(programId as string, {
//         fullNameAr: fullNameAr.trim(),
//         fullNameEn: fullNameEn.trim(),
//         age: parseInt(age, 10),
//         phoneWhatsApp: phoneWhatsApp.trim(),
//         nationalId: nationalId.trim(),
//         governorate,
//         receiptUri,
//         receiptName,
//         receiptMimeType,
//       });

//       setIsSuccess(true);
//     } catch (error: any) {
//       Alert.alert(
//         'خطأ في التسجيل',
//         error.message || 'حدث خطأ أثناء تقديم طلب التسجيل، يرجى المحاولة لاحقاً'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // واجهة النجاح المكتملة
//   if (isSuccess) {
//     return (
//       <SafeAreaView className="flex-1 bg-tb-background justify-center px-6">
//         <View className="bg-white p-8 rounded-3xl border border-tb-muted/10 shadow-lg items-center">
//           <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
//             <CheckCircle2 size={48} color="#10B981" />
//           </View>
//           <Text className="text-tb-navy text-2xl font-bold mb-2 text-center">تم تقديم الطلب بنجاح!</Text>
//           <Text className="text-tb-muted text-sm text-center leading-6 mb-8">
//             شكرًا لتقديمك. طلبك الآن قيد المراجعة لدى إدارة حاضنة تك بوكس، وسنرسل لك إشعاراً فور قبولك.
//           </Text>
//           <TouchableOpacity
//             onPress={() => router.replace('/(tabs)/home' as any)}
//             className="bg-tb-gold h-14 rounded-2xl w-full items-center justify-center shadow-md shadow-tb-gold/30"
//           >
//             <Text className="text-white font-bold text-base">العودة للرئيسية</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
//       <StatusBar barStyle="dark-content" />

//       {/* الشريط العلوي */}
//       <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-tb-muted/10">
//         <TouchableOpacity
//           onPress={() => router.back()}
//           className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center"
//         >
//           <ChevronRight size={20} color="#1B254B" />
//         </TouchableOpacity>
//         <Text className="text-tb-navy font-bold text-lg">طلب الالتحاق بالبرنامج</Text>
//         <View className="w-10" />
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }} className="px-6 pt-6">
        
//         {/* بطاقة التوجيه */}
//         <View className="bg-tb-navy p-5 rounded-3xl mb-6 shadow-md shadow-tb-navy/20 flex-row items-center">
//           <ShieldCheck size={32} color="#BF9B30" />
//           <View className="flex-1 mr-3 items-start">
//             <Text className="text-white font-bold text-sm mb-1 text-right">تعبئة البيانات الرسمية</Text>
//             <Text className="text-tb-muted text-xs leading-5 text-right">
//               يرجى التأكد من إدخال بياناتك بشكل دقيق ليتم إصدار شهادتك واعتمادك بالنظام.
//             </Text>
//           </View>
//         </View>

//         {/* نموذج البيانات */}
//         <FormInput
//           label="الاسم الثلاثي (بالعربي)"
//           placeholder="عبدالله محمد اللحام"
//           value={fullNameAr}
//           onChangeText={setFullNameAr}
//           error={errors.fullNameAr}
//         />

//         <FormInput
//           label="الاسم الكامل (English)"
//           placeholder="Abdallah M. Al-Laham"
//           value={fullNameEn}
//           onChangeText={setFullNameEn}
//           error={errors.fullNameEn}
//           autoCapitalize="words"
//         />

//         {/* تقسيم العمر ورقم الهوية باستخدام gap-3 لضمان الاتجاه الأيمن الصحيح */}
//         <View className="flex-row gap-3 w-full">
//           <View className="flex-1">
//             <FormInput
//               label="العمر"
//               placeholder="22"
//               keyboardType="number-pad"
//               value={age}
//               onChangeText={setAge}
//               error={errors.age}
//             />
//           </View>
//           <View className="flex-1">
//             <FormInput
//               label="رقم الهوية"
//               placeholder="401234567"
//               keyboardType="number-pad"
//               value={nationalId}
//               onChangeText={setNationalId}
//               error={errors.nationalId}
//             />
//           </View>
//         </View>

//         <FormInput
//           label="رقم الواتساب"
//           placeholder="+970 59 123 4567"
//           keyboardType="phone-pad"
//           value={phoneWhatsApp}
//           onChangeText={setPhoneWhatsApp}
//           error={errors.phoneWhatsApp}
//         />

//         <FormSelect
//           label="المحافظة"
//           value={governorate}
//           options={PALESTINE_GOVERNORATES}
//           onSelect={setGovernorate}
//           error={errors.governorate}
//         />

//         <FileUploader
//           fileUri={receiptUri}
//           fileName={receiptName}
//           onPickFile={handlePickReceipt}
//           onRemoveFile={() => {
//             setReceiptUri(undefined);
//             setReceiptName(undefined);
//             setReceiptMimeType(undefined);
//           }}
//         />

//         {/* زر التقديم */}
//         <TouchableOpacity
//           onPress={handleSubmit}
//           disabled={loading}
//           className="bg-tb-gold h-14 rounded-2xl items-center justify-center shadow-lg shadow-tb-gold/40 active:opacity-90 mt-2"
//         >
//           {loading ? (
//             <ActivityIndicator color="#FFFFFF" />
//           ) : (
//             <Text className="text-white text-lg font-bold">تأكيد ورسل طلب التسجيل</Text>
//           )}
//         </TouchableOpacity>

//       </ScrollView>
//     </SafeAreaView>
//   );
// }









// src/app/enrollments/[programId].tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  type LayoutChangeEvent,
  type TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CheckCircle2, ChevronRight, Phone, ShieldCheck, User } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { FormInput } from '@/components/enrollment/FormInput';
import { FormSelect } from '@/components/enrollment/FormSelect';
import { FileUploader } from '@/components/enrollment/FileUploader';
import { enrollmentsApi } from '@/api/enrollments';
import { getApiErrorMessage } from '@/api/errors';
import { programKeys } from '@/hooks/usePrograms';
import { PALESTINE_GOVERNORATES } from '@/types/enrollment';
import { ENROLLMENT_RECEIPT_LIMITS, type ApiErrorBody } from '@/types/api.contract';

/* -------------------------------------------------------------------------- */
/*  Rules (change these in one place)                                         */
/* -------------------------------------------------------------------------- */

// Age bounds and receipt limits mirror EnrollDto / ENROLLMENT_RECEIPT_LIMITS on the server.
const MIN_AGE = 10;
const MAX_AGE = 100;
const NATIONAL_ID_PATTERN = /^\d{9}$/;
const PHONE_PATTERN = /^\+?\d{9,15}$/;
const MAX_RECEIPT_BYTES = ENROLLMENT_RECEIPT_LIMITS.maxBytes;
const MAX_RECEIPT_MB = MAX_RECEIPT_BYTES / (1024 * 1024);

/** Image MIME type -> file extension the server accepts (it checks the extension, then the bytes). */
const RECEIPT_IMAGE_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(ENROLLMENT_RECEIPT_LIMITS.allowedTypes)
    .filter(([, mime]) => mime.startsWith('image/'))
    .reverse() // '.jpg' wins over '.jpeg' for image/jpeg
    .map(([ext, mime]) => [mime, ext]),
);

/** The application is already decided or impossible: retrying the form won't help. */
const FINAL_ERROR_CODES = new Set(['ALREADY_ENROLLED', 'ENROLLMENT_CLOSED', 'PROGRAM_FULL', 'NOT_FOUND']);

/* -------------------------------------------------------------------------- */
/*  Types & helpers                                                           */
/* -------------------------------------------------------------------------- */

type EnrollmentForm = {
  fullNameAr: string;
  fullNameEn: string;
  age: string;
  nationalId: string;
  phoneWhatsApp: string;
  governorate: string;
};

type FieldKey = keyof EnrollmentForm | 'receipt';
type FormErrors = Partial<Record<FieldKey, string>>;
type Receipt = { uri: string; name: string; mimeType: string };

const INITIAL_FORM: EnrollmentForm = {
  fullNameAr: '',
  fullNameEn: '',
  age: '',
  nationalId: '',
  phoneWhatsApp: '',
  governorate: '',
};

const REQUIRED_KEYS: (keyof EnrollmentForm)[] = [
  'fullNameAr',
  'fullNameEn',
  'age',
  'nationalId',
  'phoneWhatsApp',
  'governorate',
];

/** Used to find the first invalid field to scroll to. */
const FIELD_ORDER: FieldKey[] = [...REQUIRED_KEYS, 'receipt'];

/** Arabic-Indic digits (٠-٩) → Latin digits, so validation works whatever keyboard is used. */
const normalizeDigits = (value: string): string =>
  value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

const digitsOnly = (value: string): string => normalizeDigits(value).replace(/\D/g, '');

function validate(form: EnrollmentForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.fullNameAr.trim()) errors.fullNameAr = 'يرجى إدخال الاسم الثلاثي بالعربي';
  if (!form.fullNameEn.trim()) errors.fullNameEn = 'يرجى إدخال الاسم بالإنجليزية';

  const age = Number(form.age);
  if (!form.age || !Number.isInteger(age) || age < MIN_AGE) {
    errors.age = `العمر يجب أن يكون ${MIN_AGE} سنوات على الأقل`;
  } else if (age > MAX_AGE) {
    errors.age = 'يرجى إدخال عمر صحيح';
  }

  if (!form.nationalId) {
    errors.nationalId = 'يرجى إدخال رقم الهوية الوطنية';
  } else if (!NATIONAL_ID_PATTERN.test(form.nationalId)) {
    errors.nationalId = 'رقم الهوية يجب أن يتكون من 9 أرقام';
  }

  const phone = form.phoneWhatsApp.replace(/[\s\-()]/g, '');
  if (!phone) {
    errors.phoneWhatsApp = 'يرجى إدخال رقم الجوال/الواتساب';
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phoneWhatsApp = 'رقم الجوال غير صالح';
  }

  if (!form.governorate) errors.governorate = 'يرجى اختيار المحافظة';

  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-tb-navy font-bold text-base mb-4 mt-2">{children}</Text>;
}

function SuccessView({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <SafeAreaView className="flex-1 bg-tb-background justify-center px-6">
      <View className="bg-white p-8 rounded-[32px] border border-tb-muted/10 shadow-lg items-center">
        <Animated.View style={{ transform: [{ scale }] }}>
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
            <CheckCircle2 size={48} color="#10B981" />
          </View>
        </Animated.View>

        <Text accessibilityRole="header" className="text-tb-navy text-2xl font-bold mb-2 text-center">
          تم تقديم الطلب بنجاح!
        </Text>
        <Text className="text-tb-muted text-sm text-center leading-6 mb-8">
          شكرًا لتقديمك. طلبك الآن قيد المراجعة لدى إدارة حاضنة تك بوكس، وسنرسل لك إشعاراً فور قبولك.
        </Text>

        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          className="bg-tb-gold h-14 rounded-2xl w-full items-center justify-center shadow-md shadow-tb-gold/30 active:opacity-90"
        >
          <Text className="text-white font-bold text-base">متابعة حالة الطلب</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function EnrollmentScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EnrollmentForm>(INITIAL_FORM);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const nameEnRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const fieldY = useRef<Partial<Record<FieldKey, number>>>({});

  /** Records a field's vertical position so we can scroll to it on a validation error. */
  const trackField = (...keys: FieldKey[]) => ({
    onLayout: (e: LayoutChangeEvent) => {
      for (const key of keys) fieldY.current[key] = e.nativeEvent.layout.y;
    },
  });

  const updateField = useCallback(
    <K extends keyof EnrollmentForm>(key: K, value: EnrollmentForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Clear the error as soon as the user starts fixing the field.
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    },
    [],
  );

  const completedCount = REQUIRED_KEYS.filter((key) => form[key].trim().length > 0).length;
  const progress = completedCount / REQUIRED_KEYS.length;

  const handlePickReceipt = async () => {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        // iOS: hand over a JPEG instead of the original HEIC, which the server rejects.
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
    } catch {
      // Called from onPress: an uncaught rejection here would be an unhandled promise.
      Alert.alert('تعذّر فتح معرض الصور', 'يرجى السماح للتطبيق بالوصول إلى الصور من إعدادات الجهاز ثم المحاولة مجدداً.');
      return;
    }

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > MAX_RECEIPT_BYTES) {
      setErrors((prev) => ({ ...prev, receipt: `حجم الملف يتجاوز ${MAX_RECEIPT_MB} ميجابايت` }));
      return;
    }

    const mimeType = (asset.mimeType || 'image/jpeg').toLowerCase();
    const ext = RECEIPT_IMAGE_EXT[mimeType];
    if (!ext) {
      setErrors((prev) => ({ ...prev, receipt: 'صيغة الصورة غير مدعومة، يرجى اختيار صورة JPG أو PNG' }));
      return;
    }

    setReceipt({
      uri: asset.uri,
      // The server trusts the extension, so build it from the real type, not the original name (IMG_1.HEIC).
      name: `receipt${ext}`,
      mimeType,
    });
    setErrors((prev) => ({ ...prev, receipt: undefined }));
  };

  const handleSubmit = async () => {
    if (loading || !programId) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);

    const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key]);
    if (firstInvalid) {
      const y = fieldY.current[firstInvalid];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      return;
    }

    try {
      setLoading(true);
      await enrollmentsApi.enrollInProgram(programId, {
        fullNameAr: form.fullNameAr.trim(),
        fullNameEn: form.fullNameEn.trim(),
        age: parseInt(form.age, 10),
        phoneWhatsApp: form.phoneWhatsApp.trim(),
        nationalId: form.nationalId.trim(),
        governorate: form.governorate,
        receiptUri: receipt?.uri,
        receiptName: receipt?.name,
        receiptMimeType: receipt?.mimeType,
      });
      // The program screen must show the new PENDING application, not the cached "apply" state.
      void queryClient.invalidateQueries({ queryKey: programKeys.all });
      setIsSuccess(true);
    } catch (e: unknown) {
      // e.g. "اكتمل العدد الأقصى للمقاعد…" instead of "Request failed with status code 409".
      const message = getApiErrorMessage(e, 'حدث خطأ أثناء تقديم طلب التسجيل، يرجى المحاولة لاحقاً');
      const body = axios.isAxiosError<Partial<ApiErrorBody>>(e) ? e.response?.data : undefined;

      // Server-side field errors go under the matching inputs (keys are EnrollDto field names).
      if (body?.code === 'VALIDATION_FAILED' && body.details) {
        const fieldErrors: FormErrors = {};
        for (const [key, text] of Object.entries(body.details)) {
          if ((FIELD_ORDER as string[]).includes(key)) fieldErrors[key as FieldKey] = text;
        }
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      if (body?.code && FINAL_ERROR_CODES.has(body.code)) {
        void queryClient.invalidateQueries({ queryKey: programKeys.all });
        Alert.alert('تعذّر تقديم الطلب', message, [{ text: 'العودة للبرنامج', onPress: () => router.back() }]);
      } else {
        Alert.alert('خطأ في التسجيل', message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return <SuccessView onDone={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar */}
      <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-tb-muted/10">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center active:opacity-70"
        >
          <ChevronRight size={20} color="#1B254B" />
        </Pressable>
        <Text accessibilityRole="header" className="text-tb-navy font-bold text-lg">
          طلب الالتحاق بالبرنامج
        </Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        >
          {/* Guidance + live progress */}
          <View className="bg-tb-navy p-5 rounded-[28px] mb-6 shadow-md shadow-tb-navy/20">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-tb-gold/15 items-center justify-center">
                <ShieldCheck size={26} color="#BF9B30" />
              </View>
              <View className="flex-1 items-start">
                <Text className="text-white font-bold text-sm mb-1">تعبئة البيانات الرسمية</Text>
                <Text className="text-white/60 text-xs leading-5">
                  يرجى التأكد من إدخال بياناتك بشكل دقيق ليتم إصدار شهادتك واعتمادك بالنظام.
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white/60 text-[11px] font-semibold">اكتمال البيانات</Text>
                <Text className="text-tb-gold text-[11px] font-bold">
                  {completedCount} من {REQUIRED_KEYS.length}
                </Text>
              </View>
              <View className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                <View className="h-full bg-tb-gold rounded-full" style={{ width: `${progress * 100}%` }} />
              </View>
            </View>
          </View>

          {/* Section 1: personal details */}
          <SectionTitle>البيانات الشخصية</SectionTitle>

          <View {...trackField('fullNameAr')}>
            <FormInput
              label="الاسم الثلاثي (بالعربي)"
              placeholder="عبدالله محمد اللحام"
              icon={User}
              value={form.fullNameAr}
              onChangeText={(v) => updateField('fullNameAr', v)}
              error={errors.fullNameAr}
              returnKeyType="next"
              onSubmitEditing={() => nameEnRef.current?.focus()}
              submitBehavior="submit"
            />
          </View>

          <View {...trackField('fullNameEn')}>
            <FormInput
              ref={nameEnRef}
              label="الاسم الكامل (English)"
              placeholder="Abdallah M. Al-Laham"
              icon={User}
              value={form.fullNameEn}
              onChangeText={(v) => updateField('fullNameEn', v)}
              error={errors.fullNameEn}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => ageRef.current?.focus()}
              submitBehavior="submit"
            />
          </View>

          <View className="flex-row gap-3 w-full" {...trackField('age', 'nationalId')}>
            <View className="flex-1">
              <FormInput
                ref={ageRef}
                label="العمر"
                placeholder="22"
                keyboardType="number-pad"
                maxLength={3}
                value={form.age}
                onChangeText={(v) => updateField('age', digitsOnly(v))}
                error={errors.age}
              />
            </View>
            <View className="flex-1">
              <FormInput
                label="رقم الهوية"
                placeholder="401234567"
                keyboardType="number-pad"
                maxLength={9}
                value={form.nationalId}
                onChangeText={(v) => updateField('nationalId', digitsOnly(v))}
                error={errors.nationalId}
              />
            </View>
          </View>

          {/* Section 2: contact & location */}
          <SectionTitle>التواصل والموقع</SectionTitle>

          <View {...trackField('phoneWhatsApp')}>
            <FormInput
              label="رقم الواتساب"
              placeholder="+970 59 123 4567"
              icon={Phone}
              keyboardType="phone-pad"
              value={form.phoneWhatsApp}
              onChangeText={(v) => updateField('phoneWhatsApp', normalizeDigits(v))}
              error={errors.phoneWhatsApp}
            />
          </View>

          <View {...trackField('governorate')}>
            <FormSelect
              label="المحافظة"
              placeholder="اختر المحافظة..."
              value={form.governorate}
              options={PALESTINE_GOVERNORATES}
              onSelect={(v) => updateField('governorate', v)}
              error={errors.governorate}
            />
          </View>

          {/* Section 3: payment receipt */}
          <SectionTitle>إيصال الدفع</SectionTitle>

          <View {...trackField('receipt')}>
            <FileUploader
              fileUri={receipt?.uri}
              fileName={receipt?.name}
              hint={`صيغ مقبولة: JPG, PNG, WEBP (الحد الأقصى ${MAX_RECEIPT_MB} ميجابايت)`}
              error={errors.receipt}
              onPickFile={handlePickReceipt}
              onRemoveFile={() => setReceipt(null)}
            />
          </View>
        </ScrollView>

        {/* Sticky submit bar: always reachable, safe-area aware */}
        <View
          className="bg-white border-t border-tb-muted/10 px-6 pt-4 shadow-2xl"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="تأكيد وإرسال طلب التسجيل"
            accessibilityState={{ disabled: loading, busy: loading }}
            className={`bg-tb-gold h-14 rounded-2xl items-center justify-center shadow-lg shadow-tb-gold/40 active:opacity-90 ${
              loading ? 'opacity-70' : ''
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-bold">تأكيد وإرسال طلب التسجيل</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}