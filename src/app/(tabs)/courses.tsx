// // src/app/(tabs)/courses.tsx
// import React, { useState } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, StatusBar } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Header } from '@/components/Header';
// import { Search, BookOpen, Clock, Star, Play, Filter } from 'lucide-react-native';
// import { useRouter } from 'expo-router';

// const CATEGORIES = ['الكل', 'تطوير البرمجيات', 'حاضنة الأعمال', 'التصميم', 'الذكاء الاصطناعي'];

// export default function CoursesScreen() {

//   const router = useRouter();
//   const [selectedCategory, setSelectedCategory] = useState('الكل');

//   return (
//     <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
//       <StatusBar barStyle="dark-content" />
//       <Header title="مسارات التعلم" showUser={false} />

//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} className="px-6 pt-4">
//         {/* شريط البحث والفلترة */}
//         <View className="flex-row items-center space-x-3 space-x-reverse mb-6">
//           <View className="flex-1 bg-white border border-tb-muted/20 rounded-2xl p-3.5 flex-row items-center shadow-sm">
//             <Search size={20} color="#8A99B8" />
//             <TextInput
//               placeholder="ابحث عن دورة أو مهارة..."
//               placeholderTextColor="#A3AED0"
//               textAlign="right"
//               className="flex-1 text-tb-navy mr-3 text-sm"
//             />
//           </View>
//           <TouchableOpacity className="bg-tb-navy w-12 h-12 rounded-2xl items-center justify-center shadow-md shadow-tb-navy/20">
//             <Filter size={20} color="#FFFFFF" />
//           </TouchableOpacity>
//         </View>

//         {/* تصنيفات الدورات */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-6 px-6">
//           {CATEGORIES.map((cat, index) => (
//             <TouchableOpacity
//               key={index}
//               onPress={() => setSelectedCategory(cat)}
//               className={`px-5 py-2.5 rounded-2xl ml-3 border ${
//                 selectedCategory === cat
//                   ? 'bg-tb-gold border-tb-gold shadow-md shadow-tb-gold/30'
//                   : 'bg-white border-tb-muted/10'
//               }`}
//             >
//               <Text className={`font-bold text-xs ${selectedCategory === cat ? 'text-white' : 'text-tb-navy'}`}>
//                 {cat}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* قائمة الدورات */}
//         <Text className="text-tb-navy text-lg font-bold mb-4 text-right">الدورات المتاحة</Text>

//         {[1, 2, 3].map((item) => (
//           <TouchableOpacity
//             key={item}
//             onPress={() => router.push(`/course/${item}` as any)}
//             className="bg-white rounded-3xl p-4 border border-tb-muted/10 shadow-sm mb-5 flex-row items-center space-x-4 space-x-reverse"
//           >
//             <View className="w-24 h-24 bg-tb-navy/10 rounded-2xl items-center justify-center relative overflow-hidden">
//               <BookOpen size={36} color="#1B254B" />
//               <View className="absolute bottom-2 right-2 bg-tb-navy/80 px-2 py-0.5 rounded-md">
//                 <Text className="text-tb-gold text-[10px] font-bold">12 درس</Text>
//               </View>
//             </View>

//             <View className="flex-1 items-start">
//               <View className="flex-row justify-between w-full items-center mb-1">
//                 <View className="bg-tb-gold/10 px-2.5 py-0.5 rounded-full">
//                   <Text className="text-tb-gold text-[10px] font-bold">برمجة</Text>
//                 </View>
//                 <View className="flex-row items-center">
//                   <Star size={12} color="#BF9B30" fill="#BF9B30" />
//                   <Text className="text-tb-navy text-xs font-bold mr-1">4.9</Text>
//                 </View>
//               </View>

//               <Text className="text-tb-navy font-bold text-base mb-2 text-right">
//                 بناء تطبيقات الجوال باستخدام Expo & React Native
//               </Text>

//               <View className="flex-row items-center space-x-4 space-x-reverse">
//                 <View className="flex-row items-center">
//                   <Clock size={12} color="#8A99B8" />
//                   <Text className="text-tb-muted text-xs mr-1">8 ساعات</Text>
//                 </View>
//                 <Text className="text-tb-gold font-bold text-sm">مجانًا</Text>
//               </View>
//             </View>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }






// // src/app/(tabs)/courses.tsx
// import React, { useEffect, useState } from 'react';
// import { View, Text, ScrollView, TextInput, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Header } from '@/components/Header';
// import { Search } from 'lucide-react-native';
// import { useRouter } from 'expo-router';
// import { programsApi } from '@/api/programs';
// import { Program } from '@/types/lms';
// import { ProgramCard } from '@/components/programs/ProgramCard';
// import { TypeFilterTab } from '@/components/programs/TypeFilterTab';

// const FILTER_OPTIONS = [
//   { label: 'الكل', value: 'ALL' },
//   { label: 'حاضنة الأعمال 🚀', value: 'INCUBATOR' },
//   { label: 'المسارات التدريبية 🎓', value: 'COURSE_TRACK' },
//   { label: 'المعسكرات ⚡', value: 'BOOTCAMP' },
// ];

// export default function ProgramsScreen() {
//   const router = useRouter();
//   const [programs, setPrograms] = useState<Program[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [refreshing, setRefreshing] = useState<boolean>(false);
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [selectedType, setSelectedType] = useState<string>('ALL');

//   const fetchPrograms = async () => {
//     try {
//       setLoading(true);
//       const data = await programsApi.getAllPrograms();
//       setPrograms(data);
//     } catch (error) {

//       console.error('Error fetching programs:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchPrograms();
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchPrograms();
//   };

//   // تصفية نتائج البحث والتصنيف
//   const filteredPrograms = programs.filter((prog) => {
//     const matchesSearch = prog.title.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesType = selectedType === 'ALL' || prog.type === selectedType;
//     return matchesSearch && matchesType;
//   });

//   return (
//     <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
//       <StatusBar barStyle="dark-content" />
//       <Header title="البرامج وحاضنة الأعمال" showUser={false} />

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 100 }}
//         className="px-6 pt-4"
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#BF9B30']} />}
//       >
//         {/* شريط البحث */}
//         <View className="bg-white border border-tb-muted/20 rounded-2xl p-3.5 flex-row items-center shadow-sm mb-6">
//           <Search size={20} color="#8A99B8" />
//           <TextInput
//             placeholder="ابحث عن برنامج أو حاضنة..."
//             placeholderTextColor="#A3AED0"
//             textAlign="right"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             className="flex-1 text-tb-navy mr-3 text-sm text-right"
//           />
//         </View>

//         {/* شريط الفلترة بالتصنيف */}
//         <TypeFilterTab
//           options={FILTER_OPTIONS}
//           selectedValue={selectedType}
//           onSelect={setSelectedType}
//         />

//         {/* عرض البرامج أو مؤشر التحميل */}
//         <Text className="text-tb-navy text-lg font-bold mb-4 text-right">
//           البرامج المتاحة ({filteredPrograms.length})
//         </Text>

//         {loading ? (
//           <View className="py-12 items-center">
//             <ActivityIndicator size="large" color="#BF9B30" />
//             <Text className="text-tb-muted text-xs mt-3">جاري تحميل البرامج...</Text>
//           </View>
//         ) : filteredPrograms.length === 0 ? (
//           <View className="bg-white p-8 rounded-3xl border border-tb-muted/10 items-center my-4">
//             <Text className="text-tb-navy font-bold text-base mb-1">لا توجد برامج متاحة</Text>
//             <Text className="text-tb-muted text-xs">جرّب البحث باسم آخر أو تغيير التصفية</Text>
//           </View>
//         ) : (
//           filteredPrograms.map((prog) => (
//             <ProgramCard
//               key={prog.id}
//               program={prog}
//               onPress={() => router.push(`/course/${prog.slug}` as any)}
//             />
//           ))
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }





// // api-contract.md








// src/app/(tabs)/courses.tsx
// Programs tab: the student's own programs on top ("برامجي الحالية"), then the rest of the
// catalog ("استكشف برامج جديدة"). Both lists share the search box and the type chips.
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  BookMarked,
  Compass,
  PartyPopper,
  Search,
  SearchX,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Header } from '@/components/Header';
import { StateCard } from '@/components/common/StateCard';
import { getApiErrorMessage } from '@/api/errors';
import { useMyEnrollments, useProgramCatalog } from '@/hooks/usePrograms';
import type { Program } from '@/types/lms';
import type { EnrollmentResponse } from '@/types/enrollment';
import { canApply, type EnrollmentStatus } from '@/types/api.contract';
import { ProgramCard, ProgramCardSkeleton } from '@/components/programs/ProgramCard';
import {
  ActiveProgramCard,
  ActiveProgramCardSkeleton,
  isActiveEnrollmentStatus,
  type ActiveEnrollmentStatus,
} from '@/components/programs/ActiveProgramCard';
import { TypeFilterTab, type FilterOption } from '@/components/programs/TypeFilterTab';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const COLORS = {
  gold: '#BF9B30',
  muted: '#8A99B8',
} as const;

const H_PADDING = 24;
const GRID_GAP = 16;

type ProgramTypeFilter = 'ALL' | Program['type'];

const FILTER_OPTIONS: FilterOption<ProgramTypeFilter>[] = [
  { label: 'الكل', value: 'ALL' },
  { label: 'حاضنة الأعمال', value: 'INCUBATOR_BATCH' },
  { label: 'كورس أكاديمي', value: 'ACADEMIC_COURSE' },
  { label: 'المعسكرات', value: 'BOOTCAMP' },
  { label: 'الورش العملية', value: 'WORKSHOP_SERIES' }
];

/** Order of the student's programs: what they can study now first, finished ones last. */
const STATUS_ORDER: Record<ActiveEnrollmentStatus, number> = {
  ACTIVE: 0,
  PENDING: 1,
  SUSPENDED: 2,
  COMPLETED: 3,
};

type ActiveEnrollment = EnrollmentResponse & { status: ActiveEnrollmentStatus };

/* -------------------------------------------------------------------------- */
/*  Local building blocks                                                     */
/* -------------------------------------------------------------------------- */

type SearchBarProps = { value: string; onChangeText: (value: string) => void };

function SearchBar({ value, onChangeText }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center gap-3 bg-white rounded-2xl px-4 h-14 border ${
        focused ? 'border-tb-gold' : 'border-tb-muted/15'
      }`}
    >
      <Search size={20} color={focused ? COLORS.gold : COLORS.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="ابحث عن برنامج أو حاضنة..."
        placeholderTextColor="#A3AED0"
        returnKeyType="search"
        autoCorrect={false}
        className="flex-1 h-full text-tb-navy text-sm"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="مسح البحث"
          className="w-6 h-6 rounded-full bg-tb-muted/15 items-center justify-center"
        >
          <X size={14} color={COLORS.muted} />
        </Pressable>
      )}
    </View>
  );
}

type SectionHeaderProps = {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  count?: number;
  /** Navy tile for "my programs", gold-tinted tile for the catalog. */
  tone: 'navy' | 'gold';
};

function SectionHeader({ Icon, title, subtitle, count, tone }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 mb-4" accessibilityRole="header">
      <View
        className={`w-10 h-10 rounded-2xl items-center justify-center ${
          tone === 'navy' ? 'bg-tb-navy' : 'bg-tb-gold/15'
        }`}
      >
        <Icon size={20} color={tone === 'navy' ? '#EBCB6C' : COLORS.gold} />
      </View>
      <View className="flex-1 items-start">
        <View className="flex-row items-center gap-2">
          <Text className="text-tb-navy text-lg font-bold">{title}</Text>
          {count !== undefined ? (
            <View
              className={`px-2.5 py-0.5 rounded-full ${tone === 'navy' ? 'bg-tb-navy' : 'bg-tb-gold/15'}`}
            >
              <Text
                className={`text-xs font-bold ${tone === 'navy' ? 'text-tb-gold-light' : 'text-tb-gold'}`}
              >
                {count}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-tb-muted text-xs mt-0.5">{subtitle}</Text>
      </View>
    </View>
  );
}

/** Wraps children into equal-width columns; each child cell stretches to the row height. */
function Grid({ columns, itemWidth, children }: { columns: number; itemWidth: number; children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: columns > 1 ? GRID_GAP : 0,
        rowGap: GRID_GAP,
        paddingHorizontal: H_PADDING,
      }}
    >
      {React.Children.map(children, (child) => (
        <View style={{ width: itemWidth }}>{child}</View>
      ))}
    </View>
  );
}

/** 1 column on phones, 2 on small tablets / landscape, `max` on large screens. */
function useGrid(max: number) {
  const { width } = useWindowDimensions();
  const columns = Math.min(max, width >= 1024 ? 3 : width >= 640 ? 2 : 1);
  const itemWidth = (width - H_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;
  return { columns, itemWidth: Math.floor(itemWidth) };
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function ProgramsScreen() {
  const router = useRouter();
  const catalogQuery = useProgramCatalog();
  const mineQuery = useMyEnrollments();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ProgramTypeFilter>('ALL');

  const activeGrid = useGrid(2);
  const catalogGrid = useGrid(3);

  const programs = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const enrollments = useMemo(() => mineQuery.data ?? [], [mineQuery.data]);

  // Wait for both lists: otherwise enrolled programs flash in the catalog, then jump to the top.
  const loading = catalogQuery.isPending || mineQuery.isPending;

  const catalogError = catalogQuery.error
    ? getApiErrorMessage(catalogQuery.error, 'تعذّر تحميل البرامج، حاول مرة أخرى.')
    : null;
  const mineError = mineQuery.error
    ? getApiErrorMessage(mineQuery.error, 'تعذّر تحميل برامجك، حاول مرة أخرى.')
    : null;

  // Pull-to-refresh keeps the lists on screen (no skeleton flash).
  const { refetch: refetchCatalog } = catalogQuery;
  const { refetch: refetchMine } = mineQuery;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCatalog(), refetchMine()]);
    setRefreshing(false);
  }, [refetchCatalog, refetchMine]);

  /* ----------------------------- Split the lists ---------------------------- */

  // The newest application per program decides where it is shown (the list is newest first).
  const statusByProgram = useMemo(() => {
    const map = new Map<string, EnrollmentStatus>();
    for (const e of enrollments) if (!map.has(e.program.id)) map.set(e.program.id, e.status);
    return map;
  }, [enrollments]);

  const tracksByProgram = useMemo(
    () => new Map(programs.map((p) => [p.id, p._count?.tracks] as const)),
    [programs],
  );

  // Built from my-enrollments, not the catalog: a COMPLETED program is no longer in the catalog.
  const myPrograms = useMemo(() => {
    const seen = new Set<string>();
    const result: ActiveEnrollment[] = [];
    for (const e of enrollments) {
      if (seen.has(e.program.id)) continue;
      seen.add(e.program.id);
      if (isActiveEnrollmentStatus(e.status)) result.push(e as ActiveEnrollment);
    }
    return result.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [enrollments]);

  // Not applied yet, or the last application was rejected or dropped.
  const catalog = useMemo(
    () => programs.filter((p) => canApply(statusByProgram.get(p.id))),
    [programs, statusByProgram],
  );

  /* --------------------------------- Filters -------------------------------- */

  const query = searchQuery.trim().toLowerCase();
  const matchesQuery = useCallback(
    (title: string, description?: string | null) =>
      query.length === 0 ||
      title.toLowerCase().includes(query) ||
      (description?.toLowerCase().includes(query) ?? false),
    [query],
  );

  // Search first, so the chip counts reflect what each filter would show.
  const mySearchMatches = useMemo(
    () => myPrograms.filter((e) => matchesQuery(e.program.title)),
    [myPrograms, matchesQuery],
  );
  const catalogSearchMatches = useMemo(
    () => catalog.filter((p) => matchesQuery(p.title, p.description)),
    [catalog, matchesQuery],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      ALL: mySearchMatches.length + catalogSearchMatches.length,
    };
    const bump = (type: string) => (result[type] = (result[type] ?? 0) + 1);
    mySearchMatches.forEach((e) => bump(e.program.type));
    catalogSearchMatches.forEach((p) => bump(p.type));
    return result;
  }, [mySearchMatches, catalogSearchMatches]);

  const visibleMine = useMemo(
    () =>
      selectedType === 'ALL'
        ? mySearchMatches
        : mySearchMatches.filter((e) => e.program.type === selectedType),
    [mySearchMatches, selectedType],
  );
  const visibleCatalog = useMemo(
    () =>
      selectedType === 'ALL'
        ? catalogSearchMatches
        : catalogSearchMatches.filter((p) => p.type === selectedType),
    [catalogSearchMatches, selectedType],
  );

  const hasActiveFilters = query.length > 0 || selectedType !== 'ALL';

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType('ALL');
  }, []);

  /* ------------------------------- Navigation ------------------------------- */

  const openProgram = useCallback(
    (slug: string) => router.push({ pathname: '/course/[slug]', params: { slug } }),
    [router],
  );
  const enroll = useCallback(
    (programId: string) => router.push({ pathname: '/enrollments/[programId]', params: { programId } }),
    [router],
  );

  /* --------------------------------- Sections ------------------------------- */

  const renderMySection = () => {
    // While filtering, hide an empty "my programs" section instead of showing the invite card.
    if (hasActiveFilters && visibleMine.length === 0 && !mineError) return null;

    let body: React.ReactNode;
    if (mineError && enrollments.length === 0) {
      body = (
        <View className="px-6">
          <StateCard
            Icon={AlertCircle}
            title="تعذّر تحميل برامجك"
            message={mineError}
            actionLabel="إعادة المحاولة"
            onAction={() => void refetchMine()}
          />
        </View>
      );
    } else if (visibleMine.length === 0) {
      body = (
        <View className="mx-6 rounded-3xl border border-dashed border-tb-gold/50 bg-tb-gold/5 px-5 py-6 flex-row items-center gap-4">
          <View className="w-12 h-12 rounded-2xl bg-tb-gold/15 items-center justify-center">
            <Sparkles size={22} color={COLORS.gold} />
          </View>
          <View className="flex-1 items-start">
            <Text className="text-tb-navy font-bold text-sm mb-1">لم تنضم إلى أي برنامج بعد</Text>
            <Text className="text-tb-muted text-xs leading-5">
              اختر برنامجاً من القائمة أدناه وابدأ رحلتك مع TechBox.
            </Text>
          </View>
        </View>
      );
    } else {
      body = (
        <Grid columns={activeGrid.columns} itemWidth={activeGrid.itemWidth}>
          {visibleMine.map((e) => (
            <ActiveProgramCard
              key={e.id}
              enrollment={e}
              tracksCount={tracksByProgram.get(e.program.id)}
              onPress={() => openProgram(e.program.slug)}
            />
          ))}
        </Grid>
      );
    }

    return (
      <View className="mb-8">
        <View className="px-6">
          <SectionHeader
            Icon={BookMarked}
            title="برامجي الحالية"
            subtitle="تابع تعلّمك من حيث توقفت"
            count={visibleMine.length > 0 ? visibleMine.length : undefined}
            tone="navy"
          />
        </View>
        {body}
      </View>
    );
  };

  const renderCatalogSection = () => {
    if (hasActiveFilters && visibleCatalog.length === 0) return null;

    let body: React.ReactNode;
    if (visibleCatalog.length > 0) {
      body = (
        <Grid columns={catalogGrid.columns} itemWidth={catalogGrid.itemWidth}>
          {visibleCatalog.map((p) => {
            const previous = statusByProgram.get(p.id);
            return (
              <ProgramCard
                key={p.id}
                program={p}
                previousStatus={previous === 'REJECTED' || previous === 'DROPPED' ? previous : undefined}
                onPress={() => openProgram(p.slug)}
                onEnroll={() => enroll(p.id)}
              />
            );
          })}
        </Grid>
      );
    } else if (programs.length > 0) {
      body = (
        <View className="px-6">
          <StateCard
            Icon={PartyPopper}
            title="انضممت إلى جميع البرامج المتاحة"
            message="سنعلمك عند إطلاق برامج ودفعات جديدة."
          />
        </View>
      );
    } else {
      body = (
        <View className="px-6">
          <StateCard
            Icon={SearchX}
            title="لا توجد برامج متاحة حالياً"
            message="سنعلمك عند إضافة برامج جديدة."
          />
        </View>
      );
    }

    return (
      <View>
        <View className="px-6">
          <SectionHeader
            Icon={Compass}
            title="استكشف برامج جديدة"
            subtitle="برامج ودفعات مفتوحة للانضمام"
            count={visibleCatalog.length > 0 ? visibleCatalog.length : undefined}
            tone="gold"
          />
        </View>
        {body}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View>
          <View className="px-6">
            <SectionHeader
              Icon={BookMarked}
              title="برامجي الحالية"
              subtitle="تابع تعلّمك من حيث توقفت"
              tone="navy"
            />
          </View>
          <Grid columns={activeGrid.columns} itemWidth={activeGrid.itemWidth}>
            {Array.from({ length: activeGrid.columns }, (_, i) => (
              <ActiveProgramCardSkeleton key={i} />
            ))}
          </Grid>
          <View className="px-6 mt-8">
            <SectionHeader
              Icon={Compass}
              title="استكشف برامج جديدة"
              subtitle="برامج ودفعات مفتوحة للانضمام"
              tone="gold"
            />
          </View>
          <Grid columns={catalogGrid.columns} itemWidth={catalogGrid.itemWidth}>
            {Array.from({ length: Math.max(2, catalogGrid.columns) }, (_, i) => (
              <ProgramCardSkeleton key={i} />
            ))}
          </Grid>
        </View>
      );
    }

    // Full-screen error only when there is nothing to show.
    if (catalogError && programs.length === 0 && enrollments.length === 0) {
      return (
        <View className="px-6">
          <StateCard
            Icon={AlertCircle}
            title="حدث خطأ"
            message={catalogError}
            actionLabel="إعادة المحاولة"
            onAction={() => void onRefresh()}
          />
        </View>
      );
    }

    if (hasActiveFilters && visibleMine.length === 0 && visibleCatalog.length === 0) {
      return (
        <View className="px-6">
          <StateCard
            Icon={SearchX}
            title="لا توجد نتائج مطابقة"
            message="جرّب البحث باسم آخر أو غيّر التصنيف."
            actionLabel="مسح التصفية"
            onAction={resetFilters}
          />
        </View>
      );
    }

    return (
      <View>
        {renderMySection()}
        {renderCatalogSection()}
      </View>
    );
  };

  // A failed refetch keeps the cached lists and shows a banner instead.
  const bannerError =
    (catalogError && programs.length > 0 ? catalogError : null) ??
    (mineError && enrollments.length > 0 ? mineError : null);

  return (
    <SafeAreaView className="flex-1 bg-tb-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Header title="البرامج وحاضنة الأعمال" showUser={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.gold]}
            tintColor={COLORS.gold}
          />
        }
      >
        <View className="px-6 pt-4 mb-4">
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <TypeFilterTab
          options={FILTER_OPTIONS}
          selectedValue={selectedType}
          onSelect={setSelectedType}
          counts={loading ? undefined : counts}
        />

        {bannerError ? (
          <View className="mx-6 mb-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <Text className="text-red-600 text-xs font-semibold">{bannerError}</Text>
          </View>
        ) : null}

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
