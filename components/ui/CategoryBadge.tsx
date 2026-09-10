import React from 'react';
import { View, Text } from 'react-native';
import {
  Coffee,
  ShoppingBag,
  Bus,
  Film,
  Zap,
  BookOpen,
  DollarSign,
  Briefcase,
  Award,
  CircleDollarSign,
} from 'lucide-react-native';
import { TransactionCategory } from '../../types/finance';

interface CategoryBadgeProps {
  category: TransactionCategory;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CATEGORY_META: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ size: number; color: string }> }
> = {
  food: { label: 'Food & Dining', color: '#F97316', icon: Coffee },
  groceries: { label: 'Groceries', color: '#22C55E', icon: ShoppingBag },
  transport: { label: 'Transport', color: '#3B82F6', icon: Bus },
  entertainment: { label: 'Entertainment', color: '#8B5CF6', icon: Film },
  bills: { label: 'Bills & Utilities', color: '#14B8A6', icon: Zap },
  education: { label: 'Campus & Books', color: '#EC4899', icon: BookOpen },
  allowance: { label: 'Allowance', color: '#12B76A', icon: DollarSign },
  part_time: { label: 'Part-Time Job', color: '#059669', icon: Briefcase },
  scholarship: { label: 'Scholarship', color: '#14B8A6', icon: Award },
  loan_aid: { label: 'Financial Aid', color: '#3B82F6', icon: CircleDollarSign },
  other: { label: 'General', color: '#667085', icon: DollarSign },
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const IconComponent = meta.icon;

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { boxSize: 32, iconSize: 16 };
      case 'lg':
        return { boxSize: 48, iconSize: 24 };
      case 'md':
      default:
        return { boxSize: 40, iconSize: 20 };
    }
  };

  const { boxSize, iconSize } = getDimensions();

  // Convert hex to 15% opacity RGBA
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const badgeBg = hexToRgba(meta.color, 0.15);

  return (
    <View className={`flex-row items-center ${className}`}>
      <View
        className="rounded-pill items-center justify-center"
        style={{
          width: boxSize,
          height: boxSize,
          backgroundColor: badgeBg,
        }}
      >
        <IconComponent size={iconSize} color={meta.color} />
      </View>
      {showLabel && (
        <Text className="ml-2.5 font-body-medium text-ink text-sm">
          {meta.label}
        </Text>
      )}
    </View>
  );
};
