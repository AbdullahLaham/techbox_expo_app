// src/app/profile/edit.tsx
// Edit profile: picture, names, contact details, bio. Email and national ID are read-only here.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { isAxiosError } from 'axios';
import { AlertCircle, Camera, IdCard, Lock, Mail, Phone, User } from 'lucide-react-native';
import { ScreenTopBar } from '@/components/common/ScreenTopBar';
import { StateCard } from '@/components/common/StateCard';
import { FormInput } from '@/components/enrollment/FormInput';
import { FormSelect } from '@/components/enrollment/FormSelect';
import { Avatar } from '@/components/profile/Avatar';
import { getApiErrorMessage } from '@/api/errors';
import { useMyProfile, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/hooks/useMe';
import { PALESTINE_GOVERNORATES } from '@/types/enrollment';
import { AVATAR_LIMITS, PROFILE_LIMITS, type MyProfile, type UpdateMyProfileBody } from '@/types/profile.contract';

type FormKey = 'firstName' | 'lastName' | 'fullNameAr' | 'fullNameEn' | 'age' | 'phoneWhatsApp' | 'governorate' | 'bio';
type Form = Record<FormKey, string>;
type Errors = Partial<Record<FormKey, string>>;

const MIME_EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_AVATAR_MB = AVATAR_LIMITS.maxBytes / (1024 * 1024);

const toForm = (p: MyProfile): Form => ({
  firstName: p.firstName ?? '',
  lastName: p.lastName ?? '',
  fullNameAr: p.fullNameAr ?? '',
  fullNameEn: p.fullNameEn ?? '',
  age: p.age != null ? String(p.age) : '',
  phoneWhatsApp: p.phoneWhatsApp ?? '',
  governorate: p.governorate ?? '',
  bio: p.bio ?? '',
});

function validate(form: Form): Errors {
  const errors: Errors = {};
  if (!form.firstName.trim()) errors.firstName = 'الاسم الأول مطلوب';
  if (!form.lastName.trim()) errors.lastName = 'اسم العائلة مطلوب';
  if (form.age.trim()) {
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < PROFILE_LIMITS.ageMin || age > PROFILE_LIMITS.ageMax) errors.age = 'العمر غير صالح';
  }
  return errors;
}

/** Only the fields that changed; "" clears an optional field. */
function changes(form: Form, saved: Form): UpdateMyProfileBody {
  const body: UpdateMyProfileBody = {};
  for (const key of Object.keys(form) as FormKey[]) {
    const value = form[key].trim();
    if (value === saved[key].trim()) continue;
    if (key === 'age') body.age = value ? Number(value) : null;
    else if (key === 'firstName' || key === 'lastName') body[key] = value;
    else body[key] = value || null;
  }
  return body;
}

/** VALIDATION_FAILED details from the server, per field. */
function serverFieldErrors(error: unknown): Errors {
  if (!isAxiosError(error)) return {};
  return (error.response?.data?.details ?? {}) as Errors;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));
  const query = useMyProfile();

  if (!query.data) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background" edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <ScreenTopBar title="تعديل الملف الشخصي" onBack={goBack} />
        <View className="flex-1 justify-center px-6">
          {query.isError ? (
            <StateCard
              Icon={AlertCircle}
              title="تعذّر تحميل ملفك الشخصي"
              message={getApiErrorMessage(query.error, 'حدث خطأ غير متوقع، حاول مرة أخرى.')}
              actionLabel="إعادة المحاولة"
              onAction={() => void query.refetch()}
            />
          ) : (
            <ActivityIndicator color="#BF9B30" />
          )}
        </View>
      </SafeAreaView>
    );
  }
  return <EditProfileForm profile={query.data} goBack={goBack} />;
}

/** Mounted once the profile is loaded, so the form starts from it (later refetches never wipe edits). */
function EditProfileForm({ profile, goBack }: { profile: MyProfile; goBack: () => void }) {
  const navigation = useNavigation();
  const update = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();

  const [form, setForm] = useState<Form>(() => toForm(profile));
  const [errors, setErrors] = useState<Errors>({});

  const pending = changes(form, toForm(profile));
  const dirty = Object.keys(pending).length > 0;

  const set = (key: FormKey) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // Every way out (top-bar back, Android back button, iOS swipe) asks before dropping unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    return navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert('تجاهل التغييرات؟', 'لم تحفظ التعديلات التي أجريتها.', [
        { text: 'متابعة التعديل', style: 'cancel' },
        { text: 'تجاهل', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, dirty]);

  const save = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0 || !dirty) return;
    update.mutate(pending, {
      onSuccess: (next) => {
        setForm(toForm(next));
        Alert.alert('تم الحفظ', 'تم تحديث ملفك الشخصي.', [{ text: 'حسناً', onPress: goBack }]);
      },
      onError: (error) => {
        const fields = serverFieldErrors(error);
        if (Object.keys(fields).length) setErrors(fields);
        else Alert.alert('تعذّر الحفظ', getApiErrorMessage(error, 'حدث خطأ غير متوقع، حاول مرة أخرى.'));
      },
    });
  };

  const pickAvatar = async () => {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        // iOS: a JPEG instead of HEIC, which the server rejects.
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
    } catch {
      Alert.alert('تعذّر فتح معرض الصور', 'يرجى السماح للتطبيق بالوصول إلى الصور من إعدادات الجهاز ثم المحاولة مجدداً.');
      return;
    }
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = (asset.mimeType || 'image/jpeg').toLowerCase();
    const ext = MIME_EXT[mimeType];
    if (!ext) return Alert.alert('صيغة غير مدعومة', 'اختر صورة بصيغة JPG أو PNG أو WEBP.');
    if (asset.fileSize && asset.fileSize > AVATAR_LIMITS.maxBytes) {
      return Alert.alert('الصورة كبيرة', `يجب ألا يتجاوز حجم الصورة ${MAX_AVATAR_MB} ميجابايت.`);
    }
    uploadAvatar.mutate(
      // The server checks the extension against the real type, so build it from the type.
      { uri: asset.uri, name: `avatar${ext}`, mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType },
      { onError: (error) => Alert.alert('تعذّر رفع الصورة', getApiErrorMessage(error, 'حاول مرة أخرى.')) },
    );
  };

  const onAvatarPress = () => {
    if (!profile?.avatarUrl) return void pickAvatar();
    Alert.alert('صورة الملف الشخصي', undefined, [
      { text: 'اختيار صورة جديدة', onPress: () => void pickAvatar() },
      {
        text: 'حذف الصورة',
        style: 'destructive',
        onPress: () =>
          removeAvatar.mutate(undefined, {
            onError: (error) => Alert.alert('تعذّر حذف الصورة', getApiErrorMessage(error, 'حاول مرة أخرى.')),
          }),
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const avatarBusy = uploadAvatar.isPending || removeAvatar.isPending;

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScreenTopBar title="تعديل الملف الشخصي" onBack={goBack} />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Picture */}
          <View className="items-center mb-6">
            <Pressable
              onPress={onAvatarPress}
              disabled={avatarBusy}
              accessibilityRole="button"
              accessibilityLabel="تغيير صورة الملف الشخصي"
              className="active:opacity-80"
            >
              <Avatar url={profile.avatarUrl} name={form.firstName} size={104} />
              <View className="absolute bottom-0 left-0 w-9 h-9 rounded-full bg-tb-gold items-center justify-center border-2 border-white">
                {avatarBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Camera size={16} color="#FFFFFF" />}
              </View>
            </Pressable>
            <Text className="text-tb-muted text-xs mt-2">JPG أو PNG أو WEBP، حتى {MAX_AVATAR_MB} ميجابايت</Text>
          </View>

          <FormInput label="الاسم الأول" icon={User} value={form.firstName} onChangeText={set('firstName')} error={errors.firstName} maxLength={PROFILE_LIMITS.nameMax} />
          <FormInput label="اسم العائلة" icon={User} value={form.lastName} onChangeText={set('lastName')} error={errors.lastName} maxLength={PROFILE_LIMITS.nameMax} />
          <FormInput
            label="الاسم الثلاثي بالعربي"
            required={false}
            hint="يظهر على شهادات الإتمام"
            value={form.fullNameAr}
            onChangeText={set('fullNameAr')}
            error={errors.fullNameAr}
            maxLength={PROFILE_LIMITS.fullNameMax}
          />
          <FormInput
            label="الاسم الكامل بالإنجليزية"
            required={false}
            value={form.fullNameEn}
            onChangeText={set('fullNameEn')}
            error={errors.fullNameEn}
            maxLength={PROFILE_LIMITS.fullNameMax}
            autoCapitalize="words"
          />
          <FormInput
            label="رقم الواتساب"
            required={false}
            icon={Phone}
            value={form.phoneWhatsApp}
            onChangeText={set('phoneWhatsApp')}
            error={errors.phoneWhatsApp}
            keyboardType="phone-pad"
            maxLength={PROFILE_LIMITS.phoneMax}
          />
          <FormInput
            label="العمر"
            required={false}
            value={form.age}
            onChangeText={(v) => set('age')(v.replace(/[^\d]/g, ''))}
            error={errors.age}
            keyboardType="number-pad"
            maxLength={3}
          />
          <FormSelect
            label="المحافظة"
            required={false}
            value={form.governorate}
            options={PALESTINE_GOVERNORATES}
            onSelect={set('governorate')}
            error={errors.governorate}
          />
          <FormInput
            label="نبذة عنك"
            required={false}
            value={form.bio}
            onChangeText={set('bio')}
            error={errors.bio}
            multiline
            maxLength={PROFILE_LIMITS.bioMax}
            hint={`${form.bio.length}/${PROFILE_LIMITS.bioMax}`}
          />

          {/* Read-only */}
          <View className="bg-white rounded-2xl border border-tb-muted/10 p-4 gap-3 mb-6">
            <ReadOnlyRow Icon={Mail} label="البريد الإلكتروني" value={profile.email} />
            <ReadOnlyRow Icon={IdCard} label="رقم الهوية" value={profile.nationalId ?? 'غير مُدخل'} />
            <View className="flex-row items-start gap-2 pt-1">
              <Lock size={13} color="#8A99B8" />
              <Text className="flex-1 text-tb-muted text-[11px] leading-5">
                لتغيير البريد الإلكتروني أو رقم الهوية تواصل مع الإدارة، فهي بيانات رسمية مرتبطة بطلبات الالتحاق.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={save}
            disabled={!dirty || update.isPending}
            accessibilityRole="button"
            accessibilityState={{ disabled: !dirty || update.isPending }}
            className={`h-14 rounded-2xl items-center justify-center ${dirty ? 'bg-tb-navy active:opacity-85' : 'bg-tb-muted/30'}`}
          >
            {update.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-base">{dirty ? 'حفظ التغييرات' : 'لا توجد تغييرات'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReadOnlyRow({ Icon, label, value }: { Icon: typeof Mail; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-9 h-9 rounded-xl bg-tb-background items-center justify-center">
        <Icon size={16} color="#8A99B8" />
      </View>
      <View className="flex-1 items-start">
        <Text className="text-tb-muted text-[11px]">{label}</Text>
        <Text className="text-tb-navy text-sm font-semibold" selectable>
          {value}
        </Text>
      </View>
    </View>
  );
}
