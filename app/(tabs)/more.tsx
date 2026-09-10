import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../../components/ui/Card';
import {
  Users,
  ChevronRight,
  Calendar,
  PiggyBank,
  Download,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react-native';

export default function MoreScreen() {
  const {
    profile,
    balance,
    debtBalances,
    roommates,
    transactions,
    resetPayPeriod,
    payPeriod,
    dailyBudgetStats,
  } = useFinance();

  const [exported, setExported] = useState(false);

  const totalOwedToMe = debtBalances
    .filter((debt) => debt.toId === 'user_1')
    .reduce((total, debt) => total + debt.amount, 0);
  const totalIOwe = debtBalances
    .filter((debt) => debt.fromId === 'user_1')
    .reduce((total, debt) => total + debt.amount, 0);

  const handleExportCSV = () => {
    setExported(true);
    const message = `Exported ${transactions.length} transactions in CSV format.`;
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Data Export Ready', message);
    }
    setTimeout(() => setExported(false), 3000);
  };

  const handleResetPlan = () => {
    const confirmMessage = 'Reset your current pay period and daily budget calculation to default?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        resetPayPeriod();
      }
    } else {
      Alert.alert('Reset Pay Period', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetPayPeriod() },
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="font-display text-2xl text-ink">More</Text>
          <Text className="font-body text-xs text-ink-muted mt-0.5">Settings, shared house, and data</Text>
        </View>

        {/* Profile Snapshot Card */}
        <Card className="mb-6">
          <View className="flex-row items-center">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{
                backgroundColor: '#16202A',
                shadowColor: '#16202A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="font-display-bold text-xl text-white">{profile.name.slice(0, 1)}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-display text-lg text-ink mr-2">{profile.name}</Text>
                <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                  <Text className="font-body-semibold text-[10px] text-primary">Student Plan</Text>
                </View>
              </View>
              <Text className="font-body text-xs text-ink-muted mt-0.5">
                Balance: ${balance.toFixed(2)} · {payPeriod.name}
              </Text>
            </View>
          </View>
        </Card>

        {/* Shared Expenses & Roommates */}
        <View className="mb-6">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Shared Living & Roommates
          </Text>
          <Pressable onPress={() => router.push('/shared')} className="active:opacity-85">
            <Card>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-secondary/15 items-center justify-center mr-3">
                    <Users size={20} color="#FF6B4A" />
                  </View>
                  <View>
                    <Text className="font-body-bold text-sm text-ink">Shared Expenses & Rent</Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {roommates.length} roommates in Apartment 304
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </View>

              {/* Debt Status Summary */}
              <View className="flex-row bg-surface-alt rounded-2xl p-3 mt-1">
                <View className="flex-1">
                  <Text className="font-body text-[11px] text-ink-muted">Owed to you</Text>
                  <Text className="font-body-bold text-sm text-emerald-600 mt-0.5">
                    ${totalOwedToMe.toFixed(2)}
                  </Text>
                </View>
                <View className="w-px bg-border my-0.5 mx-2" />
                <View className="flex-1 items-end">
                  <Text className="font-body text-[11px] text-ink-muted">You owe</Text>
                  <Text className="font-body-bold text-sm text-rose-600 mt-0.5">
                    ${totalIOwe.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Planning & Pay Period */}
        <View className="mb-6">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Budgeting & Goals
          </Text>
          <Card className="p-2">
            <Pressable
              onPress={() => router.push('/modal/edit-pay-period')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center mr-3">
                  <Calendar size={18} color="#D97706" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-ink">Pay Period & Daily Limit</Text>
                  <Text className="font-body text-xs text-ink-muted">
                    ${dailyBudgetStats.dailyLimit.toFixed(2)}/day · {dailyBudgetStats.daysRemaining} days left
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View className="h-px bg-border mx-3" />

            <Pressable
              onPress={() => router.push('/goals')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center mr-3">
                  <PiggyBank size={18} color="#9333EA" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-ink">Savings Goals & Vaults</Text>
                  <Text className="font-body text-xs text-ink-muted">Target savings for this period</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>
          </Card>
        </View>

        {/* Data & Actions */}
        <View className="mb-6">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Data & Management
          </Text>
          <Card className="p-2">
            <Pressable
              onPress={handleExportCSV}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mr-3">
                  <FileSpreadsheet size={18} color="#059669" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-ink">Export Transactions (CSV)</Text>
                  <Text className="font-body text-xs text-ink-muted">
                    {exported ? 'Export generated!' : `${transactions.length} entries available`}
                  </Text>
                </View>
              </View>
              <Download size={16} color="#94A3B8" />
            </Pressable>

            <View className="h-px bg-border mx-3" />

            <Pressable
              onPress={handleResetPlan}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center mr-3">
                  <RotateCcw size={18} color="#E11D48" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-rose-600">Reset Pay Period</Text>
                  <Text className="font-body text-xs text-ink-muted">Reset income and fixed cost baseline</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>
          </Card>
        </View>

        {/* App Info */}
        <View className="items-center mt-2 mb-4">
          <View className="flex-row items-center mb-1">
            <ShieldCheck size={14} color="#FF6B4A" />
            <Text className="font-body-semibold text-xs text-ink-muted ml-1.5">Wallo Finance v1.0</Text>
          </View>
          <Text className="font-body text-[11px] text-ink-muted/70">
            Offline-first student budgeting & expense split
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
