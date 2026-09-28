import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, SafeAreaView, Alert, Platform, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import { TransactionRow } from '../../components/TransactionRow';
import { AmountText } from '../../components/ui/AmountText';
import { Search, Filter, X, Download, Share2, Check, Camera, Receipt, ChevronRight, Sparkles } from 'lucide-react-native';
import { exportTransactionsToCSV } from '../../lib/utils/csv-export';
import { ReceiptRepo } from '../../lib/repos/receipt.repo';
import type { ReceiptModel } from '../../lib/models/receipt.model';

const FILTER_TAGS = [
  { id: 'all', label: 'All' },
  { id: 'expense', label: 'Expenses' },
  { id: 'income', label: 'Income' },
  { id: 'food', label: 'Food' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'entertainment', label: 'Fun' },
  { id: 'transport', label: 'Transport' },
  { id: 'bills', label: 'Bills' },
  { id: 'education', label: 'Study' },
];

export default function ActivityScreen() {
  const { transactions, deleteTransaction } = useFinance();
  const { currency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [pendingReceipts, setPendingReceipts] = useState<ReceiptModel[]>([]);

  const refreshPendingReceipts = async () => {
    try {
      const pending = await ReceiptRepo.getPending();
      setPendingReceipts(pending);
    } catch {
      // ignore
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshPendingReceipts();
    }, [transactions])
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (activeFilter === 'expense' && transaction.type !== 'expense') return false;
      if (activeFilter === 'income' && transaction.type !== 'income') return false;
      if (
        activeFilter !== 'all' &&
        activeFilter !== 'expense' &&
        activeFilter !== 'income' &&
        transaction.category !== activeFilter
      ) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        transaction.title.toLowerCase().includes(query) ||
        transaction.note?.toLowerCase().includes(query) ||
        false
      );
    });
  }, [transactions, activeFilter, searchQuery]);

  const handleExportCSV = async () => {
    if (filteredTransactions.length === 0) {
      const msg = 'No transactions to export in the current view.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('No Records', msg);
      return;
    }

    try {
      setIsExporting(true);
      const tag = activeFilter !== 'all' ? `_${activeFilter}` : '';
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `wallo_activity${tag}_${dateStr}.csv`;

      const result = await exportTransactionsToCSV({
        transactions: filteredTransactions,
        currencyCode: currency.code,
        filename,
      });

      if (result.success) {
        setExported(true);
        setTimeout(() => setExported(false), 3000);
      } else {
        const errorMsg = result.error || 'Failed to export CSV.';
        if (Platform.OS === 'web') alert(errorMsg);
        else Alert.alert('Export Failed', errorMsg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error exporting CSV.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Export Error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const totalExpense = filteredTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalIncome = filteredTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="font-display text-2xl text-ink">Activity</Text>
            <Text className="font-body text-xs text-ink-muted mt-0.5">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/modal/scan-receipt')}
              hitSlop={8}
              className="flex-row items-center bg-primary px-3 py-1.5 rounded-full shadow-xs active:opacity-85"
              accessibilityLabel="Scan receipt"
            >
              <Camera size={14} color="#FFFFFF" />
              <Text className="font-body-semibold text-xs text-white ml-1.5">Scan</Text>
            </Pressable>

            <Pressable
              onPress={handleExportCSV}
              disabled={isExporting}
              hitSlop={8}
              className={`flex-row items-center px-3 py-1.5 rounded-full border shadow-xs active:opacity-80 ${
                exported
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-surface border-border active:bg-surface-alt'
              }`}
              accessibilityLabel="Export visible activity as CSV"
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : exported ? (
                <Check size={14} color="#059669" />
              ) : Platform.OS === 'web' ? (
                <Download size={14} color="#059669" />
              ) : (
                <Share2 size={14} color="#059669" />
              )}
              <Text className="font-body-semibold text-xs text-emerald-700 ml-1.5">
                {isExporting ? 'Exporting...' : exported ? 'Exported!' : 'Export CSV'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center bg-surface border border-border rounded-xl px-3.5 h-12 mb-3 shadow-sm">
          <Search size={18} color="#64748B" />
          <TextInput
            placeholder="Search your activity"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2.5 font-body text-sm text-ink p-0"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color="#64748B" />
            </Pressable>
          )}
        </View>

        {/* Pending Receipts Banner */}
        {pendingReceipts.length > 0 && (
          <Pressable
            onPress={() => router.push({ pathname: '/modal/scan-receipt', params: { step: 'review' } })}
            className="flex-row items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3 shadow-xs active:bg-amber-100/70"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-amber-100 items-center justify-center mr-2.5">
                <Receipt size={16} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="font-body-bold text-xs text-amber-900">
                  {pendingReceipts.length} Scanned {pendingReceipts.length === 1 ? 'Receipt' : 'Receipts'} Pending
                </Text>
                <Text className="font-body text-[11px] text-amber-800/80">
                  Tap to review and add to your activity
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#D97706" />
          </Pressable>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTER_TAGS.map((tag) => {
            const isActive = activeFilter === tag.id;
            return (
              <Pressable
                key={tag.id}
                onPress={() => setActiveFilter(tag.id)}
                className={`px-3.5 py-2 rounded-pill border ${isActive
                    ? 'bg-primary border-primary shadow-sm'
                    : 'bg-surface border-border active:bg-surface-alt'
                  }`}
              >
                <Text className={`font-body-medium text-xs ${isActive ? 'text-surface' : 'text-ink'}`}>
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="flex-row items-center border-b border-border/80 pb-4 mb-1">
          <View className="flex-1">
            <Text className="font-body text-xs text-ink-muted">Outflow</Text>
            <AmountText amount={totalExpense} type="expense" size="md" showSign className="mt-1" />
          </View>
          <View className="w-px h-8 bg-border" />
          <View className="flex-1 items-end">
            <Text className="font-body text-xs text-ink-muted">Inflow</Text>
            <AmountText amount={totalIncome} type="income" size="md" showSign className="mt-1" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <Text className="font-display text-base text-ink mt-4 mb-1">Your transactions</Text>
        {filteredTransactions.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Filter size={30} color="#64748B" />
            <Text className="font-display text-sm text-ink mt-3 mb-1">Nothing matched</Text>
            <Text className="font-body text-xs text-ink-muted text-center px-8">
              Try another search or clear the current filter.
            </Text>
          </View>
        ) : (
          <View className="bg-surface border border-border/80 rounded-xl px-4 shadow-sm">
            {filteredTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onPress={(tx) =>
                  router.push({
                    pathname: '/modal/edit-transaction',
                    params: { id: tx.id },
                  })
                }
                onDelete={deleteTransaction}
                className={index < filteredTransactions.length - 1 ? 'border-b border-border' : ''}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
