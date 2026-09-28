import React, { useState, useRef } from 'react';
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
import { useCurrency } from '../../context/CurrencyContext';
import { Button } from '../../components/ui/Button';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { X, ChevronDown, Sparkles, ArrowRightLeft } from 'lucide-react-native';
import { TransactionType, ExpenseCategory, IncomeCategory, TransactionCategory } from '../../types/finance';
import { getCurrencyConfig } from '../../lib/utils/currency';

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
  const {
    currency,
    baseCurrencyCode,
    convert,
    getExchangeRate,
    formatCurrency,
    popularCurrencies,
  } = useCurrency();

  const [tab, setTab] = useState<Tab>('expense');
  const [txCurrencyCode, setTxCurrencyCode] = useState<string>(currency.code);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('food');
  const [transactedAt, setTransactedAt] = useState<string>(new Date().toISOString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');

  const txCurrency = getCurrencyConfig(txCurrencyCode);
  const isForeign = txCurrencyCode !== baseCurrencyCode;

  const parsedAmt = parseFloat(amount) || 0;
  // Convert foreign amount to base currency for financial tracking
  const baseEquivalent = isForeign ? convert(parsedAmt, txCurrencyCode, baseCurrencyCode) : parsedAmt;

  const simulatedRemainingPot = (dailyBudgetStats?.remainingPot ?? 0) - baseEquivalent;
  const simulatedDailyLimit =
    (dailyBudgetStats?.daysRemaining ?? 0) > 0 && simulatedRemainingPot > 0
      ? simulatedRemainingPot / (dailyBudgetStats?.daysRemaining ?? 1)
      : 0;

  const categories = tab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const isDismissing = useRef(false);
  const handleDismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a description.');
      return;
    }

    const parsedInputAmount = parseFloat(amount);
    const finalAmountToStore =
      txCurrencyCode !== baseCurrencyCode
        ? convert(parsedInputAmount, txCurrencyCode, baseCurrencyCode)
        : parsedInputAmount;

    const combinedNote =
      txCurrencyCode !== baseCurrencyCode
        ? `${note.trim() ? `${note.trim()} · ` : ''}(Original: ${formatCurrency(parsedInputAmount, {
            fromCurrency: txCurrencyCode,
            toCurrency: txCurrencyCode,
            skipConversion: true,
          })})`
        : note;

    await addTransaction({
      title: title.trim(),
      amount: finalAmountToStore,
      type: tab as TransactionType,
      category: selectedCategory,
      note: combinedNote,
      is_recurring: isRecurring,
      transacted_at: transactedAt,
    });
    handleDismiss();
  };

  const rate = getExchangeRate(baseCurrencyCode, txCurrencyCode);
  const formattedRate =
    rate >= 100
      ? Math.round(rate).toLocaleString('en-US')
      : rate >= 1
      ? rate.toFixed(2)
      : rate.toFixed(4);

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
              onPress={handleDismiss}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
            >
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Type Toggle */}
          <View className="flex-row bg-surface-alt rounded-lg p-1 mb-4 border border-border">
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

          {/* Currency Switcher for Transaction */}
          <View className="mb-3">
            <Text className="font-body text-[11px] text-ink-muted mb-1.5 uppercase tracking-wider">
              Transaction Currency
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-1.5 -mx-1 px-1">
              {popularCurrencies.map((p) => {
                const isSelected = p.code === txCurrencyCode;
                return (
                  <Pressable
                    key={p.code}
                    onPress={() => setTxCurrencyCode(p.code)}
                    className={`flex-row items-center px-2.5 py-1 rounded-full border mr-1.5 ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border active:bg-surface-alt'
                    }`}
                  >
                    <Text className="text-xs mr-1">{p.flag}</Text>
                    <Text
                      className={`font-body-semibold text-xs ${
                        isSelected ? 'text-surface' : 'text-ink'
                      }`}
                    >
                      {p.code}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Amount */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-body text-xs text-ink-muted">
              Amount ({txCurrency.symbol})
            </Text>
            {isForeign && (
              <Text className="font-body text-[11px] text-primary">
                1 {baseCurrencyCode} ≈ {formattedRate} {txCurrency.code}
              </Text>
            )}
          </View>

          <TextInput
            value={amount}
            onChangeText={(v) => { setAmount(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder={txCurrency.decimals === 0 ? '0' : '0.00'}
            placeholderTextColor="#667085"
            style={{
              ...inputStyle,
              fontSize: 28,
              fontFamily: 'Sora_700Bold',
              color: tab === 'expense' ? '#F04438' : '#12B76A',
              marginBottom: isForeign && parsedAmt > 0 ? 8 : 12,
              height: 60,
            }}
          />

          {/* Live Foreign Exchange Conversion Banner */}
          {isForeign && parsedAmt > 0 && (
            <View className="flex-row items-center bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 mb-3">
              <ArrowRightLeft size={14} color="#1E3D3C" />
              <Text className="font-body-medium text-xs text-primary ml-2 flex-1">
                Converted: ≈ ${baseEquivalent.toFixed(2)} {baseCurrencyCode}
              </Text>
              <Text className="font-body text-[10px] text-ink-muted">
                Applied to budget
              </Text>
            </View>
          )}

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
                  ? `Will exceed spendable pot by ${formatCurrency(Math.abs(simulatedRemainingPot))}`
                  : `New daily limit: ${formatCurrency(simulatedDailyLimit)}/day (${dailyBudgetStats?.daysRemaining ?? 0}d until payday)`}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text className="font-body text-xs text-ink-muted mb-1">Description</Text>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setError(''); }}
            placeholder={tab === 'expense' ? 'e.g. Pho noodles, Campus coffee' : 'e.g. Monthly allowance, Tutoring'}
            placeholderTextColor="#667085"
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          {/* Category Picker */}
          <Text className="font-body text-xs text-ink-muted mb-2">Category</Text>
          <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`flex-row items-center px-3 py-2 rounded-lg border ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border active:bg-surface-alt'
                  }`}
                >
                  <Text className="text-base mr-1.5">{cat.emoji}</Text>
                  <Text
                    className={`font-body-medium text-xs ${
                      isSelected ? 'text-surface' : 'text-ink'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Note */}
          <Text className="font-body text-xs text-ink-muted mb-1">Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Additional details, location..."
            placeholderTextColor="#667085"
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          {/* Date Picker (Backdating support) */}
          <CustomDatePicker
            label="Transaction Date"
            value={transactedAt}
            onChange={setTransactedAt}
          />

          {/* Recurring toggle */}
          <Pressable
            onPress={() => setIsRecurring(!isRecurring)}
            className="flex-row items-center justify-between bg-surface border border-border rounded-lg p-3.5 mb-6 active:bg-surface-alt"
          >
            <View>
              <Text className="font-body-medium text-sm text-ink">Recurring transaction</Text>
              <Text className="font-body text-xs text-ink-muted">Repeats every pay period</Text>
            </View>
            <View
              className={`w-6 h-6 rounded-md border items-center justify-center ${
                isRecurring ? 'bg-primary border-primary' : 'border-border bg-surface'
              }`}
            >
              {isRecurring && <Text className="text-surface font-bold text-xs">✓</Text>}
            </View>
          </Pressable>

          {error ? (
            <Text className="font-body text-xs text-danger mb-4 text-center">{error}</Text>
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
  borderColor: '#E2E8F0',
  borderRadius: 12,
  height: 48,
  paddingHorizontal: 12,
  fontFamily: 'Inter_400Regular',
  color: '#0F172A',
  fontSize: 15,
};
