// src/components/program/ProgramTrackNode.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ActivityNode } from '@/types/lms';
import { getNodeUi } from '@/types/nodeUi';
import { Lock, ChevronLeft, CheckCircle2 } from 'lucide-react-native';

interface ProgramTrackNodeProps {
  node: ActivityNode;
  isEnrolled: boolean;
  onPress: () => void;
}

export function ProgramTrackNode({ node, isEnrolled, onPress }: ProgramTrackNodeProps) {
  const { Icon, label, color, tintClass } = getNodeUi(node.type);

  return (
    <TouchableOpacity
      disabled={!isEnrolled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${node.title}${isEnrolled && node.isCompleted ? '، مكتمل' : ''}`}
      className={`p-4 rounded-2xl mb-2 flex-row items-center justify-between border ${
        isEnrolled
          ? 'bg-white border-tb-muted/10 active:bg-tb-gold/5'
          : 'bg-tb-background/60 border-tb-muted/10 opacity-75'
      }`}
    >
      <View className="flex-row items-center flex-1">
        {/* أيقونة نوع النشاط */}
        <View className={`w-10 h-10 rounded-xl items-center justify-center ml-3 ${tintClass}`}>
          <Icon size={20} color={color} />
        </View>

        <View className="flex-1 items-start">
          <Text className="text-tb-navy font-bold text-sm mb-0.5 text-right" numberOfLines={1}>
            {node.title}
          </Text>
          <Text className="text-tb-muted text-[11px]">{label}</Text>
        </View>
      </View>

      {/* القفل للزائر مقابل إمكانية الفتح للمشترك */}
      {isEnrolled && node.isCompleted ? (
        <View className="flex-row items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
          <CheckCircle2 size={13} color="#10B981" />
          <Text className="text-emerald-600 text-[10px] font-bold">مكتمل</Text>
        </View>
      ) : isEnrolled ? (
        <View className="w-8 h-8 bg-tb-background rounded-full items-center justify-center">
          <ChevronLeft size={16} color="#BF9B30" />
        </View>
      ) : (
        <View className="flex-row items-center bg-gray-200/60 px-2.5 py-1 rounded-lg">
          <Lock size={12} color="#8A99B8" />
          <Text className="text-tb-muted text-[10px] font-bold mr-1">مغلق</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
