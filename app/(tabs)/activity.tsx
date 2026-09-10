import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { TransactionRow } from '../../components/TransactionRow';
import { AmountText } from '../../components/ui/AmountText';
import { Search, Filter, X } from 'lucide-react-native';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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

  const totalExpense = filteredTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalIncome = filteredTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <View className="px-5 pt-4">
        <View className="flex-row items-end justify-between mb-4">
          <View>
            <Text className="font-display text-2xl text-ink">Activity</Text>
            <Text className="font-body text-xs text-ink-muted mt-1">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
          <Text className="font-body-medium text-xs text-primary">All time</Text>
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
