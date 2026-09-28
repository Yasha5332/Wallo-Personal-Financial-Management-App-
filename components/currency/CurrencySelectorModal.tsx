import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Search, X, Check } from 'lucide-react-native';
import { useCurrency } from '../../context/CurrencyContext';
import type { CurrencyConfig } from '../../lib/constants/currencies';

interface CurrencySelectorModalProps {
  onSelect?: (currency: CurrencyConfig) => void;
  onClose?: () => void;
  selectedCode?: string;
  title?: string;
  subtitle?: string;
  updateGlobalPreference?: boolean;
}

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  onSelect,
  onClose,
  selectedCode,
  title = 'Change Currency',
  subtitle = 'Tap any currency to update your balance and amounts',
  updateGlobalPreference = true,
}) => {
  const {
    currency: activeCurrency,
    setCurrency,
    supportedCurrencies,
    refreshRates,
  } = useCurrency();
  const [search, setSearch] = useState('');

  // Automatically ensure rates are up to date from internet
  useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  const currentSelectionCode = selectedCode || activeCurrency.code;

  // Filter currencies: top currencies (VND, USD, GBP, AUD, EUR, JPY) shown first
  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) {
      const priorityCodes = ['VND', 'USD', 'GBP', 'AUD', 'EUR', 'JPY', 'SGD', 'CAD'];
      const priorityList = priorityCodes
        .map((code) => supportedCurrencies.find((c) => c.code === code))
        .filter((c): c is CurrencyConfig => !!c);
      const others = supportedCurrencies.filter((c) => !priorityCodes.includes(c.code));
      return [...priorityList, ...others];
    }

    const q = search.toLowerCase().trim();
    return supportedCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [search, supportedCurrencies]);

  const isDismissedRef = React.useRef(false);

  const handleSelect = async (curr: CurrencyConfig) => {
    if (isDismissedRef.current) return;
    isDismissedRef.current = true;

    if (updateGlobalPreference) {
      await setCurrency(curr.code);
    }
    if (onSelect) {
      onSelect(curr);
    } else if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (isDismissedRef.current) return;
    isDismissedRef.current = true;
    onClose?.();
  };

  const renderItem = ({ item }: { item: CurrencyConfig }) => {
    const isSelected = item.code === currentSelectionCode;

    return (
      <Pressable
        onPress={() => handleSelect(item)}
        className={`flex-row items-center justify-between p-3.5 mb-2 rounded-2xl border transition-all ${
          isSelected
            ? 'bg-primary/10 border-primary shadow-xs'
            : 'bg-surface border-border/70 active:bg-surface-alt'
        }`}
      >
        <View className="flex-row items-center flex-1 pr-3">
          {/* Flag emblem */}
          <View className="w-11 h-11 rounded-2xl bg-surface-alt border border-border/60 items-center justify-center mr-3.5">
            <Text style={{ fontSize: 24 }}>{item.flag}</Text>
          </View>

          {/* Currency details */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-display text-base text-ink">{item.code}</Text>
              <View className="bg-surface-alt border border-border/60 px-2 py-0.5 rounded-md">
                <Text className="font-body-semibold text-xs text-ink-muted">
                  {item.symbol}
                </Text>
              </View>
            </View>
            <Text className="font-body text-xs text-ink-muted mt-0.5" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </View>

        {/* Selected badge */}
        {isSelected && (
          <View className="flex-row items-center bg-primary px-3 py-1.5 rounded-full">
            <Check size={12} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 4 }} />
            <Text className="font-body-semibold text-xs text-white">Active</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-5 pt-3 pb-2">
          {/* Grabber bar for bottom-sheet feel */}
          <View className="w-10 h-1 bg-border rounded-full self-center mb-3" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="font-display text-xl text-ink">{title}</Text>
              <Text className="font-body text-xs text-ink-muted mt-0.5">
                {subtitle}
              </Text>
            </View>
            {onClose && (
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
              >
                <X size={18} color="#1C1F1D" />
              </Pressable>
            )}
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-3.5 py-2.5 mb-3.5">
            <Search size={18} color="#6B7370" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search currency (e.g. VND, GBP, AUD, USD)…"
              placeholderTextColor="#8A928E"
              className="flex-1 ml-2.5 font-body text-sm text-ink"
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={6}>
                <X size={16} color="#8A928E" />
              </Pressable>
            )}
          </View>

          {/* Currencies FlatList */}
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="font-body text-sm text-ink-muted">
                  No currencies found matching "{search}"
                </Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
