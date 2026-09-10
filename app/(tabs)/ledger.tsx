import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../../components/ui/Card';
import { AmountText } from '../../components/ui/AmountText';
import { BookOpen, ChevronDown, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react-native';

// Mock Chart of Accounts — in a real app this comes from Supabase
const ACCOUNTS = [
  { id: 'cash', name: 'Cash on Hand', type: 'asset', subType: 'cash', color: '#12B76A', icon: '💵' },
  { id: 'bank', name: 'Bank Account', type: 'asset', subType: 'bank', color: '#4A7A8C', icon: '🏦' },
  { id: 'ewallet', name: 'E-Wallet', type: 'asset', subType: 'e_wallet', color: '#7A6A8C', icon: '📱' },
  { id: 'food_exp', name: 'Food & Dining', type: 'expense', subType: 'food', color: '#8C6A4A', icon: '🍔' },
  { id: 'groceries_exp', name: 'Groceries', type: 'expense', subType: 'groceries', color: '#6A7A4A', icon: '🛒' },
  { id: 'transport_exp', name: 'Transport', type: 'expense', subType: 'transport', color: '#4A7A8C', icon: '🚇' },
  { id: 'entertainment_exp', name: 'Entertainment', type: 'expense', subType: 'entertainment', color: '#8C4A6E', icon: '🎬' },
  { id: 'bills_exp', name: 'Bills & Utilities', type: 'expense', subType: 'bills', color: '#4A6E8C', icon: '💡' },
  { id: 'education_exp', name: 'Education', type: 'expense', subType: 'education', color: '#7A6A8C', icon: '📚' },
];

// Map transaction categories to account IDs
function categoryToAccountId(category: string, type: 'expense' | 'income'): string {
  if (type === 'income') return 'bank';
  const map: Record<string, string> = {
    food: 'food_exp',
    groceries: 'groceries_exp',
    transport: 'transport_exp',
    entertainment: 'entertainment_exp',
    bills: 'bills_exp',
    education: 'education_exp',
  };
  return map[category] || 'cash';
}

// Build mock GL lines from transactions
function buildGLLines(transactions: any[]) {
  const lines: {
    id: string;
    jeId: string;
    date: string;
    memo: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    type: 'expense' | 'income';
  }[] = [];

  transactions.forEach((tx) => {
    if (tx.is_void) return;
    const expenseAccountId = categoryToAccountId(tx.category, tx.type);
    const cashAccountId = 'bank'; // default payment account

    lines.push({
      id: `line-${tx.id}`,
      jeId: `JE-${tx.id.slice(-4).toUpperCase()}`,
      date: tx.date,
      memo: tx.title,
      debitAccountId: tx.type === 'expense' ? expenseAccountId : cashAccountId,
      creditAccountId: tx.type === 'expense' ? cashAccountId : expenseAccountId,
      amount: tx.amount,
      type: tx.type,
    });
  });

  return lines;
}

export default function LedgerScreen() {
  const { transactions } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState('bank');
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const glLines = useMemo(() => buildGLLines(transactions), [transactions]);

  const selectedAccount = ACCOUNTS.find((a) => a.id === selectedAccountId)!;

  // Filter lines for selected account
  const accountLines = useMemo(() => {
    return glLines
      .filter(
        (l) => l.debitAccountId === selectedAccountId || l.creditAccountId === selectedAccountId
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [glLines, selectedAccountId]);

  // Running balance per account (simplified: sum income - expense)
  const runningBalance = useMemo(() => {
    let balance = 0;
    accountLines.forEach((l) => {
      const isDebit = l.debitAccountId === selectedAccountId;
      const isAsset = selectedAccount.type === 'asset';
      // For assets: debits increase, credits decrease
      // For expenses: debits increase (normal side), credits decrease
      if (isAsset || selectedAccount.type === 'expense') {
        balance += isDebit ? l.amount : -l.amount;
      }
    });
    return balance;
  }, [accountLines, selectedAccountId, selectedAccount]);

  const totalDebits = accountLines
    .filter((l) => l.debitAccountId === selectedAccountId)
    .reduce((acc, l) => acc + l.amount, 0);
  const totalCredits = accountLines
    .filter((l) => l.creditAccountId === selectedAccountId)
    .reduce((acc, l) => acc + l.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <View className="flex-1" style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-4 pt-3 pb-3">
          <View className="flex-row items-center mb-4 mt-2">
            <BookOpen size={22} color="#FF6B4A" strokeWidth={1.8} />
            <Text className="font-display text-2xl text-ink ml-2">Ledger</Text>
          </View>

          {/* Account Picker */}
          <Pressable
            onPress={() => setShowAccountPicker((v) => !v)}
            className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 mb-3 active:bg-surface-alt shadow-sm"
          >
            <View className="flex-row items-center">
              <Text style={{ fontSize: 20, marginRight: 10 }}>{selectedAccount.icon}</Text>
              <View>
                <Text className="font-body-semibold text-sm text-ink">{selectedAccount.name}</Text>
                <Text className="font-body text-xs text-ink-muted capitalize">{selectedAccount.type}</Text>
              </View>
            </View>
            <ChevronDown
              size={18}
              color="#64748B"
              style={{ transform: [{ rotate: showAccountPicker ? '180deg' : '0deg' }] }}
            />
          </Pressable>

          {/* Account list dropdown */}
          {showAccountPicker && (
            <Card className="mb-3 p-2 shadow-md">
              <Text className="font-body text-xs text-ink-muted px-2 py-1 mb-1">Assets</Text>
              {ACCOUNTS.filter((a) => a.type === 'asset').map((acc) => (
                <Pressable
                  key={acc.id}
                  onPress={() => { setSelectedAccountId(acc.id); setShowAccountPicker(false); }}
                  className={`flex-row items-center px-2 py-2.5 rounded-lg ${selectedAccountId === acc.id ? 'bg-primary/10' : 'active:bg-surface-alt'}`}
                >
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{acc.icon}</Text>
                  <Text className={`font-body-medium text-sm ${selectedAccountId === acc.id ? 'text-primary' : 'text-ink'}`}>{acc.name}</Text>
                </Pressable>
              ))}
              <View className="h-px bg-border my-2 mx-2" />
              <Text className="font-body text-xs text-ink-muted px-2 py-1 mb-1">Expense Accounts</Text>
              {ACCOUNTS.filter((a) => a.type === 'expense').map((acc) => (
                <Pressable
                  key={acc.id}
                  onPress={() => { setSelectedAccountId(acc.id); setShowAccountPicker(false); }}
                  className={`flex-row items-center px-2 py-2.5 rounded-lg ${selectedAccountId === acc.id ? 'bg-primary/10' : 'active:bg-surface-alt'}`}
                >
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{acc.icon}</Text>
                  <Text className={`font-body-medium text-sm ${selectedAccountId === acc.id ? 'text-primary' : 'text-ink'}`}>{acc.name}</Text>
                </Pressable>
              ))}
            </Card>
          )}

          {/* Balance Summary Row */}
          <Card className="flex-row justify-between items-center py-3 mb-2">
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-0.5">
                <TrendingDown size={12} color="#F04438" />
                <Text className="font-body text-xs text-ink-muted ml-1">Credits</Text>
              </View>
              <AmountText amount={totalCredits} type="expense" size="md" showSign />
            </View>
            <View className="w-px h-8 bg-border" />
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-0.5">
                <TrendingUp size={12} color="#12B76A" />
                <Text className="font-body text-xs text-ink-muted ml-1">Debits</Text>
              </View>
              <AmountText amount={totalDebits} type="income" size="md" showSign />
            </View>
            <View className="w-px h-8 bg-border" />
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-0.5">
                <ArrowRightLeft size={12} color="#FF6B4A" />
                <Text className="font-body text-xs text-ink-muted ml-1">Balance</Text>
              </View>
              <AmountText
                amount={Math.abs(runningBalance)}
                type={runningBalance >= 0 ? 'income' : 'expense'}
                size="md"
              />
            </View>
          </Card>
        </View>

        {/* GL Lines */}
        <ScrollView
          className="flex-1"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Column header */}
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="font-body text-xs text-ink-muted">JE Ref</Text>
            <Text className="font-body text-xs text-ink-muted flex-1 ml-3">Description</Text>
            <Text className="font-body text-xs text-ink-muted mr-6">DR</Text>
            <Text className="font-body text-xs text-ink-muted">CR</Text>
          </View>

          {accountLines.length === 0 ? (
            <View className="items-center py-16">
              <BookOpen size={36} color="#667085" strokeWidth={1.5} />
              <Text className="font-display text-sm text-ink mt-3 mb-1">No entries yet</Text>
              <Text className="font-body text-xs text-ink-muted text-center px-8">
                Add a transaction and it will post here as a journal entry line.
              </Text>
            </View>
          ) : (
            accountLines.map((line, idx) => {
              const isDebit = line.debitAccountId === selectedAccountId;
              const dateObj = new Date(line.date);
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const counterpartAccount = ACCOUNTS.find((a) =>
                a.id === (isDebit ? line.creditAccountId : line.debitAccountId)
              );

              return (
                <View
                  key={line.id}
                  className={`bg-surface border border-border/70 rounded-lg px-3 py-3 mb-2 ${idx === 0 ? '' : ''}`}
                >
                  <View className="flex-row items-start justify-between">
                    {/* JE ref + date */}
                    <View style={{ width: 56 }}>
                      <Text className="font-body-semibold text-xs text-primary">{line.jeId}</Text>
                      <Text className="font-body text-xs text-ink-muted mt-0.5">{dateStr}</Text>
                    </View>

                    {/* Description + counterpart */}
                    <View className="flex-1 mx-3">
                      <Text className="font-body-medium text-sm text-ink" numberOfLines={1}>
                        {line.memo}
                      </Text>
                      <Text className="font-body text-xs text-ink-muted mt-0.5">
                        {isDebit ? 'Cr: ' : 'Dr: '}{counterpartAccount?.name ?? 'Unknown'}
                      </Text>
                    </View>

                    {/* DR / CR amounts */}
                    <View className="flex-row" style={{ gap: 12, minWidth: 120 }}>
                      <View style={{ minWidth: 56, alignItems: 'flex-end' }}>
                        {isDebit ? (
                          <Text className="font-body-semibold text-sm text-income">
                            ${line.amount.toFixed(2)}
                          </Text>
                        ) : (
                          <Text className="font-body text-sm text-ink-muted">—</Text>
                        )}
                      </View>
                      <View style={{ minWidth: 56, alignItems: 'flex-end' }}>
                        {!isDebit ? (
                          <Text className="font-body-semibold text-sm text-expense">
                            ${line.amount.toFixed(2)}
                          </Text>
                        ) : (
                          <Text className="font-body text-sm text-ink-muted">—</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

    </SafeAreaView>
  );
}
