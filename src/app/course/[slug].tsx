// // app/course/[programId].tsx
// import React, { useState } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { ChevronRight, Layers, Award, CheckCircle2, BookOpen, Clock, ShieldCheck } from 'lucide-react-native';

// import { useProgramDetail } from '@/hooks/usePrograms';
// import { EnrollmentCTA } from '@/components/programs/EnrollmentCTA';
// import { ProgramTrackNode } from '@/components/programs/ProgramTrackNode';

// export default function ProgramDetailScreen() {
//   const { slug } = useLocalSearchParams<{ slug: string }>();
//   console.log(slug, 'programId in program detail screen');
//   const router = useRouter();
  

//   const { data: program, isLoading, isError } = useProgramDetail(slug as string);

//   // افتراض حالة الالتحاق من استجابة البيانات أو المتجر
//   const isEnrolled = (program as any)?.enrollments?.length > 0 || false;
//   console.log(program?.enrollments?.[0]?.status, 'isEnrolled in program detail screen');

//   if (isLoading) {
//     return (
//       <View className="flex-1 bg-tb-background items-center justify-center">
//         <ActivityIndicator size="large" color="#BF9B30" />
//         <Text className="text-tb-muted text-xs mt-3">جاري جلب تفاصيل البرنامج والمنهج...</Text>
//       </View>
//     );
//   }

//   if (isError || !program) {
//     return (
//       <SafeAreaView className="flex-1 bg-tb-background justify-center items-center px-6">
//         <Text className="text-tb-navy font-bold text-lg mb-2">تعذر تحميل بيانات البرنامج</Text>
//         <TouchableOpacity onPress={() => router.back()} className="bg-tb-gold px-6 py-3 rounded-2xl mt-4">
//           <Text className="text-white font-bold">العودة للخلف</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
//       <StatusBar barStyle="dark-content" />

//       {/* Header */}
//       <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-tb-muted/10">
//         <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center">
//           <ChevronRight size={20} color="#1B254B" />
//         </TouchableOpacity>
//         <Text className="text-tb-navy font-bold text-base">منهج البرنامج</Text>
//         <View className="w-10" />
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} className="px-6 pt-6">
        
//         {/* Banner Cover Image */}
//         {program.coverImage ? (
//           <Image source={{ uri: program.coverImage }} className="w-full h-44 rounded-3xl mb-6" resizeMode="cover" />
//         ) : (
//           <View className="w-full h-40 bg-tb-navy rounded-3xl items-center justify-center mb-6 p-6">
//             <Award size={48} color="#BF9B30" />
//             <Text className="text-white font-bold text-lg mt-2 text-center">{program.title}</Text>
//           </View>
//         )}

//         {/* Title & Badge */}
//         <View className="flex-row items-center justify-between mb-3">
//           <View className="bg-tb-gold/10 px-3 py-1 rounded-full border border-tb-gold/30">
//             <Text className="text-tb-gold text-xs font-bold">{program.type}</Text>
//           </View>
//           {isEnrolled && (
//             <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center">
//               <CheckCircle2 size={12} color="#10B981" />
//               <Text className="text-green-700 text-xs font-bold mr-1">أنت مشترك في هذا البرنامج</Text>
//             </View>
//           )}
//         </View>

//         <Text className="text-tb-navy text-2xl font-bold mb-3 ">{program.title}</Text>
//         <Text className="text-tb-muted text-xs leading-6 mb-6 ">{program.description}</Text>

//         {/* Curriculum Structure (Tracks & Modules) */}
//         <Text className="text-tb-navy text-lg font-bold mb-4 ">المسارات والوحدات التدريبية</Text>

//         {program.tracks?.map((track) => (
//           <View key={track.id} className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-5 shadow-sm">
//             <View className="flex-row items-center mb-3">
//               <View className="w-8 h-8 bg-tb-navy/10 rounded-xl items-center justify-center ml-2">
//                 <Layers size={18} color="#1B254B" />
//               </View>
//               <Text className="text-tb-navy font-bold text-base">{track.title}</Text>
//             </View>

//             {track.modules?.map((module) => (
//               <View key={module.id} className="mt-3">
//                 <Text className="text-tb-muted font-bold text-xs mb-2">وحدة: {module.title}</Text>
//                 {module.nodes?.map((node) => (
//                   <ProgramTrackNode
//                     key={node.id}
//                     node={node}
//                     isEnrolled={isEnrolled}
//                     onPress={() => router.push(`/classroom/${node.id}` as any)}
//                   />
//                 ))}
//               </View>
//             ))}
//           </View>
//         ))}
//       </ScrollView>

//       {/* Floating Enrollment CTA if NOT enrolled */}
//       {!isEnrolled && (
//         <EnrollmentCTA onEnrollPress={() => router.push(`/enrollments/${program.id}` as any)} />
//       )}
//     </SafeAreaView>
//   );
// }






// app/course/[slug].tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Layers, Award, CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react-native';

import { useProgramDetail } from '@/hooks/usePrograms';
import { getApiErrorMessage } from '@/api/errors';
import { EnrollmentCTA } from '@/components/programs/EnrollmentCTA';
import { ProgramTrackNode } from '@/components/programs/ProgramTrackNode';
import {
  PROGRAM_TYPE_LABELS_AR,
  canApply,
  type EnrollmentBlockReason,
  type EnrollmentStatus,
} from '@/types/api.contract';
import type { ActivityNode } from '@/types/lms';

const BLOCK_REASON_TEXT: Record<EnrollmentBlockReason, string> = {
  NOT_AVAILABLE: 'هذا البرنامج لا يستقبل طلبات حالياً.',
  CLOSED: 'التسجيل في هذه الدفعة مغلق حالياً.',
  ENDED: 'انتهت هذه الدفعة.',
  FULL: 'اكتملت المقاعد في هذه الدفعة.',
};

/** Shown once when the admin changes the status while the student is using the app. */
const STATUS_CHANGE_ALERT: Record<EnrollmentStatus, { title: string; message: string }> = {
  PENDING: { title: 'طلبك قيد المراجعة', message: 'أُعيد طلبك إلى المراجعة من قِبل الإدارة.' },
  ACTIVE: { title: 'تم قبول طلبك 🎉', message: 'أصبح بإمكانك الآن الوصول إلى محتوى البرنامج.' },
  COMPLETED: { title: 'تهانينا!', message: 'أتممت هذا البرنامج بنجاح.' },
  SUSPENDED: { title: 'تم إيقاف الوصول', message: 'تم إيقاف وصولك لهذا البرنامج مؤقتاً.' },
  DROPPED: { title: 'انتهى تسجيلك', message: 'لم تعد مسجلاً في هذا البرنامج.' },
  REJECTED: { title: 'لم يتم قبول طلبك', message: 'نأسف، لم يتم قبول طلب انضمامك لهذه الدفعة.' },
};

/**
 * Loading and error states only. The loaded program is rendered by ProgramDetailContent, which
 * receives it non-null: the React Compiler can hoist a plain `program.x` read above a null
 * check, so no property is read here before `program` is known to exist.
 */
export default function ProgramDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const { data: program, isLoading, error, refetch, isRefetching } = useProgramDetail(slug as string);

  if (isLoading) {
    return (
      <View className="flex-1 bg-tb-background items-center justify-center">
        <ActivityIndicator size="large" color="#BF9B30" />
        <Text className="text-tb-muted text-xs mt-3">جاري جلب تفاصيل البرنامج والمنهج...</Text>
      </View>
    );
  }

  // Full-screen error only when there is nothing to show; a failed refetch keeps the cached program.
  if (!program) {
    return (
      <SafeAreaView className="flex-1 bg-tb-background justify-center items-center px-6">
        <XCircle size={40} color="#DC2626" />
        <Text className="text-tb-navy font-bold text-lg mt-3 mb-2">تعذر تحميل بيانات البرنامج</Text>
        {error ? <Text className="text-tb-muted text-sm text-center mb-2">{error}</Text> : null}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={() => refetch()}
            disabled={isRefetching}
            className="bg-tb-gold px-6 py-3 rounded-2xl"
          >
            {isRefetching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold">إعادة المحاولة</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} className="bg-white border border-tb-muted/20 px-6 py-3 rounded-2xl">
            <Text className="text-tb-navy font-bold">العودة للخلف</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return <ProgramDetailContent program={program} refetch={refetch} isRefetching={isRefetching} />;
}

type DetailQuery = ReturnType<typeof useProgramDetail>;

function ProgramDetailContent({
  program,
  refetch,
  isRefetching,
}: {
  program: NonNullable<DetailQuery['data']>;
  refetch: DetailQuery['refetch'];
  isRefetching: boolean;
}) {
  const router = useRouter();
  
  // console.log(program.tracks[0].modules[0].nodes.length, 'program in program detail screen');

  // طلب التسجيل الخاص بالمستخدم الحالي فقط (يرسله الخادم في myEnrollment)
  const enrollment = program.myEnrollment;
  const enrollmentStatus = enrollment ? enrollment.status : null;
  // Read once: `enrollment` is null until the student applies.
  const reviewNote = enrollment ? enrollment.reviewNote : null;
  // الخادم يقرر فتح المحتوى: تسجيل مقبول (ACTIVE) أو مكتمل (COMPLETED)
  const isEnrolled = program.canAccessContent;
  const isRejected = enrollmentStatus === 'REJECTED' || enrollmentStatus === 'DROPPED';
  const canSubmit = program.canEnroll && canApply(enrollmentStatus);

  // Tell the student when a refetch brings a status the admin changed (e.g. PENDING -> ACTIVE).
  const lastStatus = useRef<EnrollmentStatus | null | undefined>(undefined);
  useEffect(() => {
    const previous = lastStatus.current;
    lastStatus.current = enrollmentStatus;
    // Skip the first load, and the student's own application (null -> PENDING).
    if (previous === undefined || previous === null || previous === enrollmentStatus || !enrollmentStatus) return;
    const { title, message } = STATUS_CHANGE_ALERT[enrollmentStatus];
    Alert.alert(title, reviewNote ? `${message}\n\nملاحظة الإدارة: ${reviewNote}` : message);
  }, [enrollmentStatus, reviewNote]);

  // Pull-to-refresh keeps the loaded program on screen and reports a failure (e.g. offline).
  const onRefresh = async () => {
    const result = await refetch();
    if (result.isError) {
      Alert.alert('تعذّر تحديث البيانات', getApiErrorMessage(result.error, 'حاول مرة أخرى لاحقاً.'));
    }
  };

  const openEnrollmentForm = () =>
    router.push({ pathname: '/enrollments/[programId]', params: { programId: program.id } });

  const openNode = (node: ActivityNode) => {
    if (node.type === 'ASSIGNMENT' && node.assignment) {
      router.push({ pathname: '/assignment/[assignmentId]', params: { assignmentId: node.assignment.id } });
      return;
    }
    if (node.type === 'VIDEO_LECTURE' || node.type === 'READING_MATERIAL' || node.type === 'QUIZ') {
      router.push({ pathname: '/lesson/[nodeId]', params: { nodeId: node.id } });
      return;
    }
    Alert.alert(node.title, 'سيتوفر عرض هذا المحتوى داخل التطبيق قريباً.');
  };

  const blockReasonText = BLOCK_REASON_TEXT[program.enrollmentBlockReason ?? 'NOT_AVAILABLE'];

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-tb-muted/10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-tb-background rounded-xl items-center justify-center">
          <ChevronRight size={20} color="#1B254B" />
        </TouchableOpacity>
        <Text className="text-tb-navy font-bold text-base">منهج البرنامج</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="px-6 pt-6"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={['#BF9B30']} />}
      >
        {/* Banner Cover Image */}
        {program.coverImage ? (
          <Image source={{ uri: program.coverImage }} className="w-full h-44 rounded-3xl mb-6" resizeMode="cover" />
        ) : (
          <View className="w-full h-40 bg-tb-navy rounded-3xl items-center justify-center mb-6 p-6">
            <Award size={48} color="#BF9B30" />
            <Text className="text-white font-bold text-lg mt-2 text-center">{program.title}</Text>
          </View>
        )}

        {/* Title & Enrollment Status Badge */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="bg-tb-gold/10 px-3 py-1 rounded-full border border-tb-gold/30">
            <Text className="text-tb-gold text-xs font-bold">{PROGRAM_TYPE_LABELS_AR[program.type]}</Text>
          </View>

          {/* شارات حالة الطلب */}
          {isEnrolled && enrollment && (
            <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center border border-green-200">
              <CheckCircle2 size={12} color="#10B981" />
              <Text className="text-green-700 text-xs font-bold mr-1">
                {enrollmentStatus === 'COMPLETED' ? 'أتممت البرنامج' : 'تم قبول انضمامك'}
              </Text>
            </View>
          )}

          {enrollmentStatus === 'SUSPENDED' && (
            <View className="bg-red-50 px-3 py-1 rounded-full flex-row items-center border border-red-200">
              <XCircle size={12} color="#DC2626" />
              <Text className="text-red-600 text-xs font-bold mr-1">الوصول موقوف مؤقتاً</Text>
            </View>
          )}

          {enrollmentStatus === 'PENDING' && (
            <View className="bg-amber-50 px-3 py-1 rounded-full flex-row items-center border border-amber-200">
              <Clock size={12} color="#D97706" />
              <Text className="text-amber-700 text-xs font-bold mr-1">طلبك قيد المراجعة</Text>
            </View>
          )}

          {isRejected && (
            <View className="bg-red-50 px-3 py-1 rounded-full flex-row items-center border border-red-200">
              <XCircle size={12} color="#DC2626" />
              <Text className="text-red-600 text-xs font-bold mr-1">
                {enrollmentStatus === 'REJECTED' ? 'تم رفض الطلب' : 'لم تعد مسجلاً'}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-tb-navy text-2xl font-bold mb-3">{program.title}</Text>
        <Text className="text-tb-muted text-xs leading-6 mb-6">{program.description}</Text>

        {/* Admin note on acceptance (rejection / suspension notes are in the bottom banner) */}
        {isEnrolled && reviewNote ? (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex-row items-start">
            <MessageSquare size={16} color="#059669" />
            <Text className="text-green-800 text-xs leading-5 mr-2 flex-1">ملاحظة الإدارة: {reviewNote}</Text>
          </View>
        ) : null}

        {/* Curriculum Structure (Tracks & Modules) */}
        <Text className="text-tb-navy text-lg font-bold mb-4">المسارات والوحدات التدريبية</Text>

        {program.tracks.map((track) => (
          <View key={track.id} className="bg-white p-5 rounded-3xl border border-tb-muted/10 mb-5 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-tb-navy/10 rounded-xl items-center justify-center ml-2">
                <Layers size={18} color="#1B254B" />
              </View>
              <Text className="text-tb-navy font-bold text-base">{track.title}</Text>
            </View>

            {track.modules.map((module) => (
              <View key={module.id} className="mt-3">
                <Text className="text-tb-muted font-bold text-xs mb-2">وحدة: {module.title}</Text>
                {
                  
                module.nodes.map((node) => (
                  <ProgramTrackNode
                    key={node.id}
                    node={node}
                    isEnrolled={isEnrolled && !node.isLocked}
                    onPress={() => openNode(node)}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Floating Enrollment Banner depending on status */}
      {!enrollmentStatus && !isEnrolled && canSubmit && <EnrollmentCTA onEnrollPress={openEnrollmentForm} />}

      {!enrollmentStatus && !isEnrolled && !program.canEnroll && (
        <View className="p-4 bg-tb-background border-t border-tb-muted/20 flex-row items-center">
          <Clock size={20} color="#8A99B8" />
          <Text className="text-tb-muted text-xs font-bold mr-2 flex-1">{blockReasonText}</Text>
        </View>
      )}

      {enrollmentStatus === 'PENDING' && (
        <View className="p-4 bg-amber-50 border-t border-amber-200 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Clock size={20} color="#D97706" />
            <Text className="text-amber-800 text-xs font-bold mr-2 flex-1">
              طلبك حالياً قيد المراجعة من قِبل إدارة حاضنة تك بوكس. اسحب للأسفل لتحديث الحالة.
            </Text>
          </View>
        </View>
      )}

      {isRejected && (
        <View className="p-4 bg-red-50 border-t border-red-200 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <XCircle size={20} color="#DC2626" />
            <Text className="text-red-800 text-xs font-bold mr-2 flex-1">
              {enrollmentStatus === 'REJECTED'
                ? 'نأسف، لم يتم قبول طلب انضمامك لهذه الدفعة.'
                : 'لم تعد مسجلاً في هذا البرنامج.'}
              {reviewNote ? ` ملاحظة الإدارة: ${reviewNote}` : ''}
              {canSubmit ? ' يمكنك المحاولة مجدداً.' : ` ${blockReasonText}`}
            </Text>
          </View>
          {canSubmit && (
            <TouchableOpacity onPress={openEnrollmentForm} className="bg-red-600 px-4 py-2 rounded-xl">
              <Text className="text-white text-xs font-bold">إعادة التقديم</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {enrollmentStatus === 'SUSPENDED' && (
        <View className="p-4 bg-red-50 border-t border-red-200 flex-row items-center">
          <XCircle size={20} color="#DC2626" />
          <Text className="text-red-800 text-xs font-bold mr-2 flex-1">
            تم إيقاف وصولك لهذا البرنامج مؤقتاً.{reviewNote ? ` ${reviewNote}` : ''}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
