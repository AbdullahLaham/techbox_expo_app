// // src/components/enrollment/FormSelect.tsx
// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
// import { ChevronDown, MapPin, Check } from 'lucide-react-native';

// interface FormSelectProps {
//   label: string;
//   value: string;
//   options: string[];
//   onSelect: (val: string) => void;
//   error?: string;
// }

// export function FormSelect({ label, value, options, onSelect, error }: FormSelectProps) {
//   const [modalVisible, setModalVisible] = useState(false);

//   return (
//     <View className="mb-5">
//       <View className="flex-row items-center justify-end mb-1.5">
//         <Text className="text-red-500 mr-1 text-xs">*</Text>
//         <Text className="text-tb-navy text-sm font-semibold">{label}</Text>
//       </View>


//       <TouchableOpacity
//         onPress={() => setModalVisible(true)}
//         className={`bg-white border rounded-2xl p-4 shadow-sm flex-row items-center justify-between ${
//           error ? 'border-red-400 bg-red-50/20' : 'border-tb-muted/20'
//         }`}
//       >
//         <ChevronDown size={20} color="#8A99B8" />
//         <View className="flex-row items-center">
//           <Text className={`text-base font-normal ${value ? 'text-tb-navy' : 'text-[#A3AED0]'}`}>
//             {value || 'اختر المحافظة...'}
//           </Text>
//           <MapPin size={18} color="#BF9B30" className="mr-2" />
//         </View>
//       </TouchableOpacity>

//       {error ? <Text className="text-red-500 text-xs mt-1.5 font-medium">{error}</Text> : null}

//       {/* نافذة الخيارات Modal */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//         <View className="flex-1 bg-black/40 justify-end">
//           <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
//             <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-tb-muted/10">
//               <TouchableOpacity onPress={() => setModalVisible(false)}>
//                 <Text className="text-tb-gold font-bold text-sm">تم</Text>
//               </TouchableOpacity>
//               <Text className="text-tb-navy font-bold text-lg">اختر المحافظة</Text>
//             </View>

//             <FlatList
//               data={options}
//               keyExtractor={(item) => item}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   onPress={() => {
//                     onSelect(item);
//                     setModalVisible(false);
//                   }}
//                   className={`p-4 rounded-xl mb-2 flex-row justify-between items-center ${
//                     value === item ? 'bg-tb-gold/10 border border-tb-gold/30' : 'bg-tb-background'
//                   }`}
//                 >
//                   {value === item ? <Check size={18} color="#BF9B30" /> : <View />}
//                   <Text className={`text-base font-medium ${value === item ? 'text-tb-gold font-bold' : 'text-tb-navy'}`}>
//                     {item}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//             />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }


// src/components/enrollment/FormSelect.tsx
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Check, ChevronDown, MapPin, Search, X, type LucideIcon } from 'lucide-react-native';

interface FormSelectProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: string;
  required?: boolean;
  /** Text shown while nothing is selected. */
  placeholder?: string;
  /** Sheet title. Defaults to the label. */
  modalTitle?: string;
  icon?: LucideIcon;
}

/** A search box appears in the sheet when the list is longer than this. */
const SEARCH_THRESHOLD = 8;

export function FormSelect({
  label,
  value,
  options,
  onSelect,
  error,
  required = true,
  placeholder = 'اختر...',
  modalTitle,
  icon: Icon = MapPin,
}: FormSelectProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const showSearch = options.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const open = () => setVisible(true);
  const close = () => {
    setVisible(false);
    setQuery('');
  };

  const handleSelect = (item: string) => {
    onSelect(item);
    close();
  };

  return (
    <View className="mb-5">
      {/* Label */}
      <View className="flex-row items-center gap-1 mb-1.5">
        <Text className="text-tb-navy text-sm font-semibold">{label}</Text>
        {required && <Text className="text-red-500 text-xs">*</Text>}
      </View>

      {/* Trigger */}
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        className={`flex-row items-center gap-3 border rounded-2xl px-4 h-14 active:opacity-80 ${
          error ? 'border-red-400 bg-red-50/30' : 'border-tb-muted/20 bg-white'
        }`}
      >
        <Icon size={18} color="#BF9B30" />
        <Text className={`flex-1 text-base ${value ? 'text-tb-navy' : 'text-[#A3AED0]'}`} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#8A99B8" />
      </Pressable>

      {error ? (
        <View className="flex-row items-center gap-1 mt-1.5" accessibilityLiveRegion="polite">
          <AlertCircle size={12} color="#EF4444" />
          <Text className="text-red-500 text-xs font-medium flex-1">{error}</Text>
        </View>
      ) : null}

      {/* Bottom sheet */}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
        <View className="flex-1 justify-end">
          {/* Tap outside to dismiss */}
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="إغلاق"
          />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View
              className="bg-white rounded-t-[32px] px-6 pt-3"
              style={{ maxHeight: height * 0.75, paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <View className="w-10 h-1 rounded-full bg-tb-muted/30 self-center mb-4" />

              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-tb-navy font-bold text-lg">{modalTitle ?? label}</Text>
                <Pressable
                  onPress={close}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="إغلاق"
                  className="w-9 h-9 rounded-xl bg-tb-background items-center justify-center active:opacity-70"
                >
                  <X size={18} color="#1B254B" />
                </Pressable>
              </View>

              {showSearch && (
                <View className="flex-row items-center gap-3 bg-tb-background rounded-2xl px-4 h-12 mb-3">
                  <Search size={18} color="#8A99B8" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="ابحث..."
                    placeholderTextColor="#A3AED0"
                    autoCorrect={false}
                    className="flex-1 h-full text-tb-navy text-sm"
                  />
                </View>
              )}

              <FlatList
                data={filtered}
                keyExtractor={(item) => item}
                style={{ flexGrow: 0 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="text-tb-muted text-sm text-center py-8">لا توجد نتائج</Text>
                }
                renderItem={({ item }) => {
                  const selected = value === item;
                  return (
                    <Pressable
                      onPress={() => handleSelect(item)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className={`flex-row items-center gap-3 px-4 h-14 rounded-2xl mb-2 border ${
                        selected ? 'bg-tb-gold/10 border-tb-gold/30' : 'bg-tb-background border-transparent'
                      } active:opacity-80`}
                    >
                      <Text
                        className={`flex-1 text-base ${
                          selected ? 'text-tb-gold font-bold' : 'text-tb-navy font-medium'
                        }`}
                      >
                        {item}
                      </Text>
                      {selected ? <Check size={18} color="#BF9B30" /> : null}
                    </Pressable>
                  );
                }}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}