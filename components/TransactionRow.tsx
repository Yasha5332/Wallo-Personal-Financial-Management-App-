import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Transaction } from '../types/finance';
import { CategoryBadge } from './ui/CategoryBadge';
import { AmountText } from './ui/AmountText';
import { Trash2 } from 'lucide-react-native';

interface TransactionRowProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  className?: string;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onDelete,
  className = '',
}) => {
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View className={`flex-row items-center py-3.5 ${className}`}>
      <CategoryBadge category={transaction.category} size="sm" />
      <View className="flex-1 ml-3 mr-3">
        <Text className="font-body-medium text-sm text-ink" numberOfLines={1}>
          {transaction.title}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <Text className="font-body text-xs text-ink-muted">{formattedDate}</Text>
          {transaction.isRecurring && (
            <Text className="font-body-medium text-[10px] text-primary ml-2">Recurring</Text>
          )}
        </View>
      </View>
      <View className="items-end">
        <AmountText amount={transaction.amount} type={transaction.type} showSign size="md" />
        {onDelete && (
          <Pressable
            onPress={() => onDelete(transaction.id)}
            className="mt-1 p-1 rounded-md active:bg-surface-alt"
            hitSlop={8}
            accessibilityLabel={`Delete ${transaction.title}`}
          >
            <Trash2 size={14} color="#667085" />
          </Pressable>
        )}
      </View>
    </View>
  );
};
