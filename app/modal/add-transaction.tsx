import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { Button } from '../../components/ui/Button';
import { X, ChevronDown, Sparkles } from 'lucide-react-native';
import { TransactionType, ExpenseCategory, IncomeCategory, TransactionCategory } from '../../types/finance';

type Tab = 'expense' | 'income';

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; emoji: string }[] = [
  { id: 'food', label: 'Food & Dining', emoji: '🍔' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'transport', label: 'Transport', emoji: '🚇' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'bills', label: 'Bills & Utilities', emoji: '💡' },
  { id: 'education', label: 'Education', emoji: '📚' },
];

const INCOME_CATEGORIES: { id: IncomeCategory; label: string; emoji: string }[] = [
  { id: 'allowance', label: 'Allowance', emoji: '💸' },
  { id: 'part_time', label: 'Part-time Job', emoji: '💼' },
  { id: 'scholarship', label: 'Scholarship', emoji: '🎓' },
  { id: 'loan_aid', label: 'Loan / Aid', emoji: '🏦' },
  { id: 'other', label: 'Other', emoji: '📥' },
];

export default function AddTransactionModal() {
  const { addTransaction, dailyBudgetStats } = useFinance();

  const [tab, setTab] = useState<Tab>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('food');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');

  const parsedAmt = parseFloat(amount) || 0;
  const simulatedRemainingPot = dailyBudgetStats.remainingPot - parsedAmt;
  const simulatedDailyLimit =
    dailyBudgetStats.daysRemaining > 0 && simulatedRemainingPot > 0
      ? simulatedRemainingPot / dailyBudgetStats.daysRemaining
      : 0;

  const categories = tab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a description.');
      return;
    }
    addTransaction({
      title: title.trim(),
      amount: amt,
      type: tab as TransactionType,
      category: selectedCategory,
      note: note.trim() || undefined,
      isRecurring,
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FC' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {/* Handle + close */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="font-display text-xl text-ink">Add Transaction</Text>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
            >
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Type Toggle */}
          <View className="flex-row bg-surface-alt rounded-lg p-1 mb-6 border border-border">
            {(['expense', 'income'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  setTab(t);
                  setSelectedCategory(t === 'expense' ? 'food' : 'allowance');
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-md items-center ${
                  tab === t ? 'bg-primary' : ''
                }`}
              >
                <Text
                  className={`font-body-semibold text-sm ${
                    tab === t ? 'text-surface' : 'text-ink-muted'
                  }`}
                >
                  {t === 'expense' ? '− Expense' : '+ Income'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount */}
          <Text className="font-body text-xs text-ink-muted mb-1">Amount ($)</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => { setAmount(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#667085"
            style={{
              ...inputStyle,
              fontSize: 28,
              fontFamily: 'Sora_700Bold',
              color: tab === 'expense' ? '#F04438' : '#12B76A',
              marginBottom: 12,
              height: 60,
            }}
          />

          {/* Dynamic Daily Budget Impact Preview */}
          {tab === 'expense' && parsedAmt > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: simulatedRemainingPot < 0 ? '#FFF1F2' : '#FFF1ED',
                borderColor: simulatedRemainingPot < 0 ? '#FECDD3' : '#FFDDD4',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 16,
              }}
            >
              <Sparkles size={14} color={simulatedRemainingPot < 0 ? '#E11D48' : '#FF6B4A'} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_500Medium',
                  color: simulatedRemainingPot < 0 ? '#BE123C' : '#C84222',
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                {simulatedRemainingPot < 0
                  ? `Will exceed spendable pot by $${Math.abs(simulatedRemainingPot).toFixed(2)}`
                  : `New daily limit: $${simulatedDailyLimit.toFixed(2)}/day (${dailyBudgetStats.daysRemaining}d until payday)`}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text className="font-body text-xs text-ink-muted mb-1">Description</Text>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setError(''); }}
            placeholder="e.g. Campus Cafe Latte"
            placeholderTextColor="#667085"
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          {/* Category */}
          <Text className="font-body text-xs text-ink-muted mb-2">Category</Text>
          <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`flex-row items-center px-3.5 py-2 rounded-pill border ${
                  selectedCategory === cat.id
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border active:bg-surface-alt'
                }`}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text
                  className={`font-body-medium text-xs ml-1.5 ${
                    selectedCategory === cat.id ? 'text-surface' : 'text-ink'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Note */}
          <Text className="font-body text-xs text-ink-muted mb-1">Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a short note..."
            placeholderTextColor="#667085"
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          {/* Recurring Toggle */}
          <Pressable
            onPress={() => setIsRecurring((v) => !v)}
            className={`flex-row items-center justify-between px-4 py-3 rounded-lg border mb-6 ${
              isRecurring ? 'bg-accent/10 border-accent/30' : 'bg-surface border-border'
            }`}
          >
            <Text className="font-body-medium text-sm text-ink">Mark as recurring</Text>
            <View
              className={`w-12 h-6 rounded-pill items-center ${
                isRecurring ? 'bg-accent' : 'bg-surface-alt'
              }`}
              style={{ justifyContent: 'center', flexDirection: 'row' }}
            >
              <View
                className="w-5 h-5 rounded-full bg-surface"
                style={{
                  marginLeft: isRecurring ? 'auto' : 2,
                  marginRight: isRecurring ? 2 : 'auto',
                  shadowColor: '#00000022',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
            </View>
          </Pressable>

          {error ? (
            <Text className="font-body text-xs text-danger mb-3 text-center">{error}</Text>
          ) : null}

          <Button label="Save Transaction" onPress={handleSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E4E7EC',
  borderRadius: 12,
  height: 48,
  paddingHorizontal: 12,
  fontFamily: 'Inter_400Regular',
  color: '#151A2D',
  fontSize: 15,
};
