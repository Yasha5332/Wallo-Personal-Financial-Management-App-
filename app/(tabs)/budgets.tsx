import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AmountText } from '../../components/ui/AmountText';
import { Button } from '../../components/ui/Button';
import {
  PieChart,
  Pencil,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { ExpenseCategory } from '../../types/finance';

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍔',
  groceries: '🛒',
  entertainment: '🎬',
  transport: '🚇',
  bills: '💡',
  education: '📚',
};

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    transport: '#4A7A8C',
    food: '#8C6A4A',
    groceries: '#6A7A4A',
    entertainment: '#8C4A6E',
    bills: '#4A6E8C',
    education: '#7A6A8C',
  };
  return map[category] || '#64748B';
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function BudgetsScreen() {
  const {
    budgets,
    subscriptions,
    totalBudgetLimit,
    totalBudgetSpent,
    totalSubscriptionsCost,
    updateBudgetLimit,
  } = useFinance();
  const { formatCurrency, currency } = useCurrency();

  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editValue, setEditValue] = useState('');

  const overallProgress = totalBudgetLimit > 0 ? totalBudgetSpent / totalBudgetLimit : 0;
  const overallRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  const handleEditSave = () => {
    if (!editingCategory) return;
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0) {
      updateBudgetLimit({ category: editingCategory, limit_amount: val });
    }
    setEditingCategory(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Header */}
        <View className="flex-row items-center mb-5 mt-2">
          <PieChart size={22} color="#1E3D3C" strokeWidth={1.8} />
          <Text className="font-display text-2xl text-ink ml-2">Budgets</Text>
        </View>

        {/* Overall Budget Summary Card */}
        <Card className="mb-5">
          <Text className="font-body text-xs text-ink-muted mb-0.5">Monthly Overview</Text>
          <View className="flex-row items-baseline justify-between mb-3">
            <AmountText amount={overallRemaining} size="lg" />
            <Text className="font-body text-xs text-ink-muted">
              of {formatCurrency(totalBudgetLimit)} remaining
            </Text>
          </View>
          <ProgressBar progress={overallProgress} height={10} />
          <View className="flex-row justify-between mt-2.5">
            <Text className="font-body text-xs text-ink-muted">
              Spent: {formatCurrency(totalBudgetSpent)}
            </Text>
            {overallProgress >= 0.8 && (
              <View className="flex-row items-center">
                <AlertCircle size={12} color="#F59E0B" />
                <Text className="ml-1 font-body-semibold text-xs text-warning">
                  {overallProgress >= 1 ? 'Over budget!' : 'Approaching limit'}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Per-Category Budgets */}
        <Text className="font-display text-base text-ink mb-3">Category Budgets</Text>

        {budgets.map((budget) => {
          const progress = budget.limit_amount > 0 ? budget.spent_amount / budget.limit_amount : 0;
          const remaining = Math.max(0, budget.limit_amount - budget.spent_amount);
          const isWarning = progress >= 0.8 && progress < 1;
          const isOver = progress >= 1;

          return (
            <Card key={budget.category} className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-pill items-center justify-center mr-3"
                    style={{ backgroundColor: getCategoryColor(budget.category) + '18' }}
                  >
                    <Text style={{ fontSize: 18 }}>{CATEGORY_EMOJIS[budget.category] || '💰'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-body-semibold text-sm text-ink">{budget.name}</Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {formatCurrency(budget.spent_amount)} of {formatCurrency(budget.limit_amount)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  {isOver ? (
                    <View className="flex-row items-center mr-2 px-2.5 py-0.5 rounded-pill bg-danger/15">
                      <AlertCircle size={12} color="#EF4444" />
                      <Text className="ml-1 font-body-semibold text-xs text-danger">Over</Text>
                    </View>
                  ) : isWarning ? (
                    <View className="flex-row items-center mr-2 px-2.5 py-0.5 rounded-pill bg-warning/15">
                      <AlertCircle size={12} color="#F59E0B" />
                      <Text className="ml-1 font-body-semibold text-xs text-warning">
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center mr-2 px-2.5 py-0.5 rounded-pill bg-income/15">
                      <CheckCircle2 size={12} color="#12B76A" />
                      <Text className="ml-1 font-body-semibold text-xs text-income">On track</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      setEditingCategory(budget.category as ExpenseCategory);
                      setEditValue(budget.limit_amount.toString());
                    }}
                    className="p-1.5 rounded-lg active:bg-surface-alt"
                    hitSlop={8}
                  >
                    <Pencil size={15} color="#64748B" />
                  </Pressable>
                </View>
              </View>

              <ProgressBar progress={progress} height={8} />

              <Text className="font-body text-xs text-ink-muted mt-2">
                {formatCurrency(remaining)} remaining
              </Text>
            </Card>
          );
        })}

        {/* Subscriptions Panel */}
        <View className="mt-4 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <RefreshCcw size={16} color="#1E3D3C" />
              <Text className="font-display text-base text-ink ml-2">Active Subscriptions</Text>
            </View>
            <Text className="font-body-semibold text-sm text-expense">
              −{formatCurrency(totalSubscriptionsCost)}/mo
            </Text>
          </View>

          {subscriptions.map((sub) => {
            const today = new Date().getDate();
            const daysUntil =
              sub.renewal_day >= today
                ? sub.renewal_day - today
                : 30 - today + sub.renewal_day;
            const isDueSoon = daysUntil <= 3;

            return (
              <Card key={sub.id} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-9 h-9 rounded-pill items-center justify-center mr-3"
                      style={{ backgroundColor: getCategoryColor(sub.category) + '18' }}
                    >
                      <RefreshCcw size={15} color={getCategoryColor(sub.category)} />
                    </View>
                    <View>
                      <Text className="font-body-semibold text-sm text-ink">{sub.name}</Text>
                      <Text
                        className="font-body text-xs"
                        style={{ color: isDueSoon ? '#F59E0B' : '#64748B' }}
                      >
                        {isDueSoon
                          ? `Renews in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
                          : `Renews on the ${sub.renewal_day}${ordinal(sub.renewal_day)}`}
                      </Text>
                    </View>
                  </View>
                  <AmountText amount={sub.amount} type="expense" size="md" showSign />
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Edit Budget Limit Modal */}
      <Modal
        visible={editingCategory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCategory(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(28,31,29,0.3)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
            onPress={() => setEditingCategory(null)}
          >
            <Pressable style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-display text-base text-ink">
                  Edit {budgets.find((b) => b.category === editingCategory)?.name} Limit
                </Text>
                <Pressable onPress={() => setEditingCategory(null)} hitSlop={8}>
                  <X size={20} color="#667085" />
                </Pressable>
              </View>
              <Text className="font-body text-xs text-ink-muted mb-1">Monthly limit ({currency.symbol})</Text>
              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="decimal-pad"
                autoFocus
                placeholder={currency.decimals === 0 ? '0' : '0.00'}
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: '#E4E7EC',
                  borderRadius: 14,
                  height: 52,
                  paddingHorizontal: 14,
                  fontFamily: 'Inter_600SemiBold',
                  color: '#1C1F1D',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              />
              <View className="flex-row" style={{ gap: 12 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setEditingCategory(null)}
                  className="flex-1"
                />
                <Button label="Save" onPress={handleEditSave} className="flex-1" />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

