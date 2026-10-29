// // src/components/enrollment/FileUploader.tsx
// import React from 'react';
// import { View, Text, TouchableOpacity, Image } from 'react-native';
// import { UploadCloud, FileCheck, Trash2, Image as ImageIcon } from 'lucide-react-native';

// interface FileUploaderProps {
//   fileUri?: string;
//   fileName?: string;
//   onPickFile: () => void;
//   onRemoveFile: () => void;
// }

// export function FileUploader({ fileUri, fileName, onPickFile, onRemoveFile }: FileUploaderProps) {
//   return (
//     <View className="mb-6">
//       <Text className="text-tb-navy text-sm font-semibold mb-1.5 text-right">
//         صورة إيصال التحويل المالي (اختياري / اختياري حسب الدفع)
//       </Text>
//       <Text className="text-tb-muted text-xs mb-3 text-right">
//         صيغ المقبولة: JPG, PNG, PDF (الحد الأقصى 5 ميجابايت)
//       </Text>

//       {fileUri ? (
//         <View className="bg-white p-4 rounded-2xl border border-tb-gold/40 shadow-sm flex-row items-center justify-between">
//           <TouchableOpacity onPress={onRemoveFile} className="p-2 bg-red-50 rounded-xl">
//             <Trash2 size={18} color="#DC2626" />
//           </TouchableOpacity>

//           <View className="flex-row items-center flex-1 justify-end ml-3">
//             <View className="items-end mr-3 flex-1">
//               <Text className="text-tb-navy font-bold text-xs text-right" numberOfLines={1}>
//                 {fileName || 'إيصال التحويل'}
//               </Text>
//               <Text className="text-green-600 text-[10px] font-bold mt-0.5">تم اختيار الملف بنجاح</Text>
//             </View>
//             <View className="w-10 h-10 bg-tb-gold/10 rounded-xl items-center justify-center">
//               <FileCheck size={20} color="#BF9B30" />
//             </View>
//           </View>
//         </View>
//       ) : (
//         <TouchableOpacity
//           onPress={onPickFile}
//           className="bg-white border-2 border-dashed border-tb-muted/30 p-6 rounded-2xl items-center justify-center active:bg-tb-background"
//         >
//           <View className="w-12 h-12 bg-tb-navy/5 rounded-2xl items-center justify-center mb-2">
//             <UploadCloud size={24} color="#1B254B" />
//           </View>
//           <Text className="text-tb-navy font-bold text-sm mb-1">اضغط هنا لرفع إيصال التحويل</Text>
//           <Text className="text-tb-muted text-[11px]">اختر صورة أو ملف PDF من جهازك</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }


// src/components/enrollment/FileUploader.tsx
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, UploadCloud } from 'lucide-react-native';

interface FileUploaderProps {
  fileUri?: string;
  fileName?: string;
  onPickFile: () => void;
  onRemoveFile: () => void;
  label?: string;
  /** Helper line under the label. Keep it in sync with what the picker really accepts. */
  hint?: string;
  /** Shows the "اختياري" pill next to the label. */
  optional?: boolean;
  error?: string;
}

export function FileUploader({
  fileUri,
  fileName,
  onPickFile,
  onRemoveFile,
  label = 'صورة إيصال التحويل المالي',
  hint = 'صيغ مقبولة: JPG, PNG (الحد الأقصى 5 ميجابايت)',
  optional = true,
  error,
}: FileUploaderProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center gap-2 mb-1">
        <Text className="text-tb-navy text-sm font-semibold">{label}</Text>
        {optional && (
          <View className="bg-tb-background px-2 py-0.5 rounded-md">
            <Text className="text-tb-muted text-[10px] font-bold">اختياري</Text>
          </View>
        )}
      </View>
      <Text className="text-tb-muted text-xs mb-3">{hint}</Text>

      {fileUri ? (
        <View
          className={`bg-white p-3 rounded-2xl border shadow-sm flex-row items-center gap-3 ${
            error ? 'border-red-400' : 'border-tb-gold/40'
          }`}
        >
          <Image
            source={{ uri: fileUri }}
            className="w-14 h-14 rounded-xl bg-tb-background"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />

          <View className="flex-1 items-start">
            <Text className="text-tb-navy font-bold text-xs" numberOfLines={1}>
              {fileName || 'إيصال التحويل'}
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <CheckCircle2 size={12} color="#10B981" />
              <Text className="text-green-600 text-[11px] font-bold">تم اختيار الملف</Text>
            </View>
          </View>

          <Pressable
            onPress={onPickFile}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="تغيير الملف"
            className="w-10 h-10 bg-tb-gold/10 rounded-xl items-center justify-center active:opacity-70"
          >
            <RefreshCw size={18} color="#BF9B30" />
          </Pressable>
          <Pressable
            onPress={onRemoveFile}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="حذف الملف"
            className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center active:opacity-70"
          >
            <Trash2 size={18} color="#DC2626" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onPickFile}
          accessibilityRole="button"
          accessibilityLabel="رفع إيصال التحويل"
          className={`bg-white border-2 border-dashed p-6 rounded-2xl items-center justify-center active:bg-tb-background ${
            error ? 'border-red-400' : 'border-tb-muted/30'
          }`}
        >
          <View className="w-12 h-12 bg-tb-navy/5 rounded-2xl items-center justify-center mb-3">
            <UploadCloud size={24} color="#1B254B" />
          </View>
          <Text className="text-tb-navy font-bold text-sm mb-1">اضغط هنا لرفع إيصال التحويل</Text>
          <Text className="text-tb-muted text-[11px]">اختر صورة من معرض الصور</Text>
        </Pressable>
      )}

      {error ? (
        <View className="flex-row items-center gap-1 mt-1.5" accessibilityLiveRegion="polite">
          <AlertCircle size={12} color="#EF4444" />
          <Text className="text-red-500 text-xs font-medium flex-1">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}