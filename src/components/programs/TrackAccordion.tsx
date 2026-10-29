// // src/components/TrackAccordion.tsx
// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity } from 'react-native';
// import { Track } from '@/types/lms';
// import { ChevronDown, ChevronUp, Folder, PlayCircle, FileText, BookOpen } from 'lucide-react-native';

// interface TrackAccordionProps {
//   track: Track;
//   onNodePress?: (nodeId: string) => void;
// }

// export function TrackAccordion({ track, onNodePress }: TrackAccordionProps) {
//   const [expanded, setExpanded] = useState(false);

//   return (
//     <View className="bg-white rounded-3xl border border-tb-muted/10 mb-4 shadow-sm overflow-hidden">
//       {/* Track Header */}
//       <TouchableOpacity
//         onPress={() => setExpanded(!expanded)}
//         className="p-5 flex-row items-center justify-between bg-white"
//       >
//         <View className="flex-1 pr-2 items-start">
//           <Text className="text-tb-navy font-bold text-base mb-1">
//             المسار {track.orderIndex}: {track.title}
//           </Text>
//           {track.description && (
//             <Text className="text-tb-muted text-xs text-right" numberOfLines={1}>
//               {track.description}
//             </Text>
//           )}
//         </View>
//         <View className="w-9 h-9 bg-tb-background rounded-xl items-center justify-center">
//           {expanded ? <ChevronUp size={18} color="#1B254B" /> : <ChevronDown size={18} color="#1B254B" />}
//         </View>
//       </TouchableOpacity>

//       {/* Modules & Activity Nodes (Expandable) */}
//       {expanded && track.modules && (
//         <View className="bg-tb-background/60 p-4 border-t border-tb-muted/10">
//           {track.modules.map((module) => (
//             <View key={module.id} className="mb-4 bg-white p-4 rounded-2xl border border-tb-muted/10">
//               <View className="flex-row items-center mb-3">
//                 <Folder size={18} color="#BF9B30" />
//                 <Text className="text-tb-navy font-bold text-sm mr-2">
//                   وحدة: {module.title}
//                 </Text>
//               </View>

//               {/* Activity Nodes */}
//               {module.nodes?.map((node) => (
//                 <TouchableOpacity
//                   key={node.id}
//                   onPress={() => onNodePress && onNodePress(node.id)}
//                   className="flex-row items-center justify-between p-3 my-1 rounded-xl bg-tb-background/40 active:bg-tb-gold/10"
//                 >
//                   <View className="flex-row items-center flex-1">
//                     {node.type === 'VIDEO_LECTURE' && <PlayCircle size={16} color="#1B254B" />}
//                     {node.type === 'ASSIGNMENT' && <FileText size={16} color="#BF9B30" />}
//                     {node.type !== 'VIDEO_LECTURE' && node.type !== 'ASSIGNMENT' && (
//                       <BookOpen size={16} color="#8A99B8" />
//                     )}
//                     <Text className="text-tb-navy font-semibold text-xs mr-2 flex-1 text-right">
//                       {node.title}
//                     </Text>
//                   </View>
//                   {node.isMandatory && (
//                     <View className="bg-red-50 px-2 py-0.5 rounded-md">
//                       <Text className="text-red-500 text-[10px] font-bold">إجباري</Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>
//               ))}
//             </View>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// }


// src/components/TrackAccordion.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';
import { ChevronDown, Folder, ListChecks } from 'lucide-react-native';
import type { Track } from '@/types/lms';
import { getNodeUi } from '@/types/nodeUi';

interface TrackAccordionProps {
  track: Track;
  onNodePress?: (nodeId: string) => void;
}

export function TrackAccordion({ track, onNodePress }: TrackAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  const modulesCount = track.modules?.length ?? 0;
  const nodesCount = useMemo(
    () => track.modules?.reduce((sum, m) => sum + (m.nodes?.length ?? 0), 0) ?? 0,
    [track.modules],
  );

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((value) => !value);
  }, []);

  return (
    <View className="bg-white rounded-3xl border border-tb-muted/10 mb-4 shadow-sm overflow-hidden">
      {/* Track header */}
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={`المسار ${track.orderIndex}: ${track.title}`}
        accessibilityState={{ expanded }}
        className="flex-row items-center gap-3 p-5 active:bg-tb-background/60"
      >
        {/* The number is real information here: tracks are an ordered sequence */}
        <View className="w-10 h-10 rounded-2xl bg-tb-navy items-center justify-center">
          <Text className="text-white font-bold text-base">{track.orderIndex}</Text>
        </View>

        <View className="flex-1 items-start">
          <Text className="text-tb-navy font-bold text-base mb-1" numberOfLines={2}>
            {track.title}
          </Text>

          {track.description ? (
            <Text className="text-tb-muted text-xs" numberOfLines={1}>
              {track.description}
            </Text>
            
          ) : null}


          {modulesCount > 0 && (
            <View className="flex-row items-center gap-4 mt-2">
              <View className="flex-row items-center gap-1">
                <Folder size={12} color="#8A99B8" />
                <Text className="text-tb-muted text-[11px] font-semibold">{modulesCount} وحدات</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <ListChecks size={12} color="#8A99B8" />
                <Text className="text-tb-muted text-[11px] font-semibold">{nodesCount} نشاط</Text>
              </View>
            </View>
          )}
        </View>

        <View
          className="w-9 h-9 bg-tb-background rounded-xl items-center justify-center"
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        >
          <ChevronDown size={18} color="#1B254B" />
        </View>
      </Pressable>

      {/* Modules & activity nodes (expandable) */}
      {expanded && track.modules ? (
        <View className="bg-tb-background/60 p-4 border-t border-tb-muted/10 gap-3">
          {track.modules.map((module) => (
            <View key={module.id} className="bg-white p-4 rounded-2xl border border-tb-muted/10">
              <View className="flex-row items-center gap-2 mb-3">
                <Folder size={18} color="#BF9B30" />
                <Text className="text-tb-navy font-bold text-sm flex-1" numberOfLines={2}>
                  {module.title}
                </Text>
              </View>

              {module.nodes?.map((node) => {
                const { Icon, color, tintClass } = getNodeUi(node.type);

                return (
                  <Pressable
                    key={node.id}
                    onPress={() => onNodePress?.(node.id)}
                    accessibilityRole="button"
                    accessibilityLabel={node.title}
                    className="flex-row items-center gap-3 p-3 mt-1 rounded-xl bg-tb-background/40 active:bg-tb-gold/10"
                  >
                    <View className={`w-8 h-8 rounded-lg items-center justify-center ${tintClass}`}>
                      <Icon size={16} color={color} />
                    </View>
                    <Text className="text-tb-navy font-semibold text-xs flex-1" numberOfLines={2}>
                      {node.title}
                    </Text>
                    {node.isMandatory && (
                      <View className="bg-red-50 px-2 py-0.5 rounded-md">
                        <Text className="text-red-500 text-[10px] font-bold">إجباري</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}