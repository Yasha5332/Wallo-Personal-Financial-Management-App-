import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useCurrency } from '../../context/CurrencyContext';
import { Card } from '../ui/Card';
import { ChevronRight } from 'lucide-react-native';

interface CurrencyCardProps {
  onPress?: () => void;
  className?: string;
}

export const CurrencyCard: React.FC<CurrencyCardProps> = ({ onPress, className = '' }) => {
  const { currency } = useCurrency();

  return (
    <Pressable onPress={onPress} className={`active:opacity-90 ${className}`}>
      <Card className="border border-border/80">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            {/* Flag emblem */}
            <View className="w-12 h-12 rounded-2xl bg-surface-alt border border-border items-center justify-center mr-3.5">
              <Text style={{ fontSize: 24 }}>{currency.flag}</Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-display text-base text-ink">{currency.code}</Text>
                <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                  <Text className="font-body-semibold text-xs text-primary">
                    {currency.symbol}
                  </Text>
                </View>
              </View>
              <Text className="font-body text-xs text-ink-muted mt-0.5" numberOfLines={1}>
                {currency.name} · Tap to change
              </Text>
            </View>
          </View>

          {/* Change action */}
          <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-xl">
            <Text className="font-body-semibold text-xs text-primary mr-1">Change</Text>
            <ChevronRight size={14} color="#1E3D3C" />
          </View>
        </View>
      </Card>
    </Pressable>
  );
};
