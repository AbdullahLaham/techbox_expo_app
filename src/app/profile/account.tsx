// src/app/profile/account.tsx
// Account & security: change password, sign out everywhere, support, app version, delete account.
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { isAxiosError } from 'axios';
import {
  ChevronLeft,
  Info,
  KeyRound,
  Mail,
  MessageCircle,
  ShieldAlert,
  Smartphone,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { ScreenTopBar } from '@/components/common/ScreenTopBar';
import { FormInput } from '@/components/enrollment/FormInput';
import { getApiErrorMessage } from '@/api/errors';
import { useChangePassword, useDeleteAccount, useLogoutAll, useMyProfile } from '@/hooks/useMe';
import { APP_VERSION, SUPPORT } from '@/constants/support';
import { PROFILE_LIMITS } from '@/types/profile.contract';

type PasswordForm = { currentPassword: string; newPassword: string; confirm: string };
type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;
const EMPTY_PASSWORDS: PasswordForm = { currentPassword: '', newPassword: '', confirm: '' };

/** VALIDATION_FAILED details from the server, per field. */
const fieldErrors = (error: unknown): Record<string, string> =>
  isAxiosError(error) ? (error.response?.data?.details ?? {}) : {};

export default function AccountScreen() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));
  const profile = useMyProfile().data;
  const changePassword = useChangePassword();
  const logoutAll = useLogoutAll();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState<PasswordForm>(EMPTY_PASSWORDS);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setPassword = (key: keyof PasswordForm) => (value: string) => {
    setPasswords((prev) => ({ ...prev, [key]: value }));
    setPasswordErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const submitPassword = () => {
    const errors: PasswordErrors = {};
    if (!passwords.currentPassword) errors.currentPassword = 'أدخل كلمة المرور الحالية';
    if (passwords.newPassword.length < PROFILE_LIMITS.passwordMin) {
      errors.newPassword = `كلمة المرور يجب أن لا تقل عن ${PROFILE_LIMITS.passwordMin} حروف`;
    }
    if (passwords.confirm !== passwords.newPassword) errors.confirm = 'كلمتا المرور غير متطابقتين';
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    changePassword.mutate(
      { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword },
      {
        onSuccess: () => {
          setPasswords(EMPTY_PASSWORDS);
          setPasswordOpen(false);
          Alert.alert('تم تغيير كلمة المرور', 'تم تسجيل الخروج من جميع الأجهزة الأخرى، وبقيت متصلاً على هذا الجهاز.');
        },
        onError: (error) => {
          const fields = fieldErrors(error);
          if (Object.keys(fields).length) setPasswordErrors(fields);
          else Alert.alert('تعذّر تغيير كلمة المرور', getApiErrorMessage(error, 'حاول مرة أخرى.'));
        },
      },
    );
  };

  const confirmLogoutAll = () => {
    Alert.alert(
      'تسجيل الخروج من كل الأجهزة',
      'سيتم إنهاء جميع الجلسات، بما فيها هذا الجهاز، وستحتاج لتسجيل الدخول مجدداً.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: () =>
            logoutAll.mutate(undefined, {
              onError: (error) => Alert.alert('تعذّر تسجيل الخروج', getApiErrorMessage(error, 'حاول مرة أخرى.')),
            }),
        },
      ],
    );
  };

  const open = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert('تعذّر فتح الرابط', 'تأكد من وجود تطبيق مناسب على جهازك.'));

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScreenTopBar title="الحساب والأمان" onBack={goBack} />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {/* SECURITY */}
          <SectionTitle>الأمان</SectionTitle>
          <View className="bg-white rounded-3xl border border-tb-muted/10 p-2 mb-6">
            <Row
              Icon={KeyRound}
              label="تغيير كلمة المرور"
              hint="ستبقى متصلاً على هذا الجهاز فقط"
              onPress={() => setPasswordOpen((v) => !v)}
              expanded={passwordOpen}
            />
            {passwordOpen && (
              <View className="px-3 pt-2 pb-3">
                <FormInput
                  label="كلمة المرور الحالية"
                  value={passwords.currentPassword}
                  onChangeText={setPassword('currentPassword')}
                  error={passwordErrors.currentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="password"
                />
                <FormInput
                  label="كلمة المرور الجديدة"
                  value={passwords.newPassword}
                  onChangeText={setPassword('newPassword')}
                  error={passwordErrors.newPassword}
                  hint={`${PROFILE_LIMITS.passwordMin} أحرف على الأقل`}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  maxLength={PROFILE_LIMITS.passwordMax}
                />
                <FormInput
                  label="تأكيد كلمة المرور الجديدة"
                  value={passwords.confirm}
                  onChangeText={setPassword('confirm')}
                  error={passwordErrors.confirm}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  maxLength={PROFILE_LIMITS.passwordMax}
                />
                <Pressable
                  onPress={submitPassword}
                  disabled={changePassword.isPending}
                  accessibilityRole="button"
                  className="h-12 rounded-2xl bg-tb-navy items-center justify-center active:opacity-85"
                >
                  {changePassword.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-sm">حفظ كلمة المرور</Text>
                  )}
                </Pressable>
              </View>
            )}
            <View className="h-px bg-tb-muted/10 mx-3" />
            <Row
              Icon={Smartphone}
              label="تسجيل الخروج من كل الأجهزة"
              hint="إذا فقدت جهازاً أو سجّلت الدخول على جهاز غيرك"
              onPress={confirmLogoutAll}
              busy={logoutAll.isPending}
            />
          </View>

          {/* SUPPORT & APP */}
          <SectionTitle>الدعم والتطبيق</SectionTitle>
          <View className="bg-white rounded-3xl border border-tb-muted/10 p-2 mb-6">
            {SUPPORT.whatsapp && (
              <Row Icon={MessageCircle} label="تواصل معنا عبر واتساب" onPress={() => open(`https://wa.me/${SUPPORT.whatsapp}`)} />
            )}
            {SUPPORT.email && (
              <Row Icon={Mail} label="راسلنا بالبريد الإلكتروني" hint={SUPPORT.email} onPress={() => open(`mailto:${SUPPORT.email}`)} />
            )}
            <View className="flex-row items-center gap-3 p-4">
              <View className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center">
                <Info size={20} color="#1B254B" />
              </View>
              <Text className="flex-1 text-tb-navy font-bold text-sm">إصدار التطبيق</Text>
              <Text className="text-tb-muted text-sm">{APP_VERSION}</Text>
            </View>
          </View>

          {/* DANGER ZONE */}
          <SectionTitle>منطقة الخطر</SectionTitle>
          {profile?.canDeleteAccount === false ? (
            <View className="bg-white rounded-3xl border border-tb-muted/10 p-5">
              <Text className="text-tb-muted text-xs leading-5">
                حسابات الطاقم (المدرّبين والموجّهين والإدارة) تُحذف عن طريق إدارة المنصة.
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => setDeleteOpen(true)}
              disabled={!profile}
              accessibilityRole="button"
              className="bg-red-50 border border-red-200 rounded-3xl p-5 flex-row items-center gap-3 active:opacity-80"
            >
              <View className="w-10 h-10 rounded-xl bg-red-100 items-center justify-center">
                <Trash2 size={20} color="#DC2626" />
              </View>
              <View className="flex-1 items-start">
                <Text className="text-red-600 font-bold text-sm">حذف الحساب نهائياً</Text>
                <Text className="text-red-500/80 text-[11px] mt-0.5">لا يمكن التراجع عن هذه الخطوة</Text>
              </View>
              <ChevronLeft size={16} color="#DC2626" />
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <DeleteAccountModal visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </SafeAreaView>
  );
}

function DeleteAccountModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const deleteAccount = useDeleteAccount();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();

  const close = () => {
    if (deleteAccount.isPending) return;
    setPassword('');
    setError(undefined);
    onClose();
  };

  const confirm = () => {
    if (!password) return setError('أدخل كلمة المرور لتأكيد حذف الحساب');
    deleteAccount.mutate(password, {
      // On success the session ends and the app returns to the sign-in screen.
      onError: (e) => {
        const fields = fieldErrors(e);
        if (fields.password) setError(fields.password);
        else Alert.alert('تعذّر حذف الحساب', getApiErrorMessage(e, 'حاول مرة أخرى.'));
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/50 justify-center px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="bg-white rounded-3xl p-6">
          <View className="w-12 h-12 rounded-2xl bg-red-100 items-center justify-center mb-4">
            <ShieldAlert size={24} color="#DC2626" />
          </View>
          <Text className="text-tb-navy text-lg font-bold mb-2">حذف الحساب نهائياً</Text>
          <Text className="text-tb-muted text-xs leading-5 mb-1">عند الحذف:</Text>
          {[
            'تُمسح بياناتك الشخصية: الاسم، الصورة، أرقام التواصل، رقم الهوية، الإيصالات والإشعارات.',
            'تُلغى طلبات الالتحاق والتسجيلات المفتوحة، وتُلغى شهاداتك.',
            'تبقى تسليماتك ودرجاتك في سجلات البرامج بدون اسمك.',
            'يمكنك إنشاء حساب جديد بنفس البريد لاحقاً.',
          ].map((line) => (
            <Text key={line} className="text-tb-navy text-xs leading-5">
              • {line}
            </Text>
          ))}

          <View className="mt-5">
            <FormInput
              label="كلمة المرور للتأكيد"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(undefined);
              }}
              error={error}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={close}
              disabled={deleteAccount.isPending}
              accessibilityRole="button"
              className="flex-1 h-12 rounded-2xl bg-tb-background items-center justify-center active:opacity-80"
            >
              <Text className="text-tb-navy font-bold text-sm">إلغاء</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={deleteAccount.isPending}
              accessibilityRole="button"
              className="flex-1 h-12 rounded-2xl bg-red-600 items-center justify-center active:opacity-85"
            >
              {deleteAccount.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-sm">حذف حسابي</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-tb-muted text-xs font-bold mb-2 px-1">{children}</Text>;
}

type RowProps = {
  Icon: LucideIcon;
  label: string;
  hint?: string;
  onPress: () => void;
  expanded?: boolean;
  busy?: boolean;
};

function Row({ Icon, label, hint, onPress, expanded, busy }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      className="flex-row items-center gap-3 p-4 active:opacity-70"
    >
      <View className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center">
        <Icon size={20} color="#1B254B" />
      </View>
      <View className="flex-1 items-start">
        <Text className="text-tb-navy font-bold text-sm">{label}</Text>
        {hint ? <Text className="text-tb-muted text-[11px] mt-0.5">{hint}</Text> : null}
      </View>
      {busy ? <ActivityIndicator size="small" color="#BF9B30" /> : <ChevronLeft size={16} color="#8A99B8" />}
    </Pressable>
  );
}
