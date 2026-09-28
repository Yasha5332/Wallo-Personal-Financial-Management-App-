import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Button } from '../../components/ui/Button';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { X, Trash2 } from 'lucide-react-native';
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

export default function EditTransactionModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, updateTransaction, deleteTransaction } = useFinance();
  const { currency, formatCurrency } = useCurrency();

  const transaction = transactions.find((t) => t.id === id);

  const [tab, setTab] = useState<Tab>(transaction?.type || 'expense');
  const [amount, setAmount] = useState(transaction ? transaction.amount.toString() : '');
  const [title, setTitle] = useState(transaction?.title || '');
  const [note, setNote] = useState(transaction?.note || '');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>(
    transaction?.category || 'food',
  );
  const [transactedAt, setTransactedAt] = useState<string>(
    transaction?.transacted_at || new Date().toISOString(),
  );
  const [isRecurring, setIsRecurring] = useState(transaction?.is_recurring || false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state if transaction arrives
  useEffect(() => {
    if (transaction) {
      setTab(transaction.type);
      setAmount(transaction.amount.toString());
      setTitle(transaction.title);
      setNote(transaction.note || '');
      setSelectedCategory(transaction.category);
      setTransactedAt(transaction.transacted_at);
      setIsRecurring(transaction.is_recurring);
    }
  }, [transaction?.id]);

  const categories = tab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const isDismissing = useRef(false);
  const handleDismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/activity');
    }
  };

  const handleSave = async () => {
    if (!transaction) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a description.');
      return;
    }

    await updateTransaction({
      id: transaction.id,
      title: title.trim(),
      amount: amt,
      type: tab,
      category: selectedCategory,
      note: note.trim() || undefined,
      is_recurring: isRecurring,
      transacted_at: transactedAt,
    });

    handleDismiss();
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setIsDeleting(true);
    await deleteTransaction(transaction.id);
    handleDismiss();
  };

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FC' }}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-display text-lg text-ink mb-2">Transaction Not Found</Text>
          <Text className="font-body text-sm text-ink-muted text-center mb-6">
            This transaction may have been removed or does not exist.
          </Text>
          <Button label="Back to Activity" onPress={handleDismiss} />
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="font-display text-xl text-ink">Edit Transaction</Text>
              <Text className="font-body text-xs text-ink-muted mt-0.5">
                Update amount, category, note, or date
              </Text>
            </View>
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

          {/* Amount */}
          <Text className="font-body text-xs text-ink-muted mb-1">
            Amount ({currency.symbol})
          </Text>
          <TextInput
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              setError('');
            }}
            keyboardType="decimal-pad"
            placeholder={currency.decimals === 0 ? '0' : '0.00'}
            placeholderTextColor="#667085"
            style={{
              ...inputStyle,
              fontSize: 28,
              fontFamily: 'Sora_700Bold',
              color: tab === 'expense' ? '#F04438' : '#12B76A',
              marginBottom: 16,
              height: 60,
            }}
          />

          {/* Title */}
          <Text className="font-body text-xs text-ink-muted mb-1">Description</Text>
          <TextInput
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setError('');
            }}
            placeholder={tab === 'expense' ? 'e.g. Campus Lunch' : 'e.g. Tutoring Income'}
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

          {/* Custom Date Picker (Supports Backdating & Changing Date) */}
          <CustomDatePicker
            label="Transaction Date"
            value={transactedAt}
            onChange={setTransactedAt}
          />

          {/* Note */}
          <Text className="font-body text-xs text-ink-muted mb-1">Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Additional details, location..."
            placeholderTextColor="#667085"
            style={{ ...inputStyle, marginBottom: 16 }}
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

          {/* Save Button */}
          <Button label="Save Changes" onPress={handleSave} className="mb-3" />

          {/* Delete Section */}
          {showDeleteConfirm ? (
            <View className="bg-danger/10 border border-danger/30 rounded-xl p-4 mt-2">
              <Text className="font-body-semibold text-sm text-danger text-center mb-1">
                Delete this transaction?
              </Text>
              <Text className="font-body text-xs text-ink-muted text-center mb-3">
                This action cannot be undone.
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                />
                <Button
                  label="Delete"
                  variant="danger"
                  loading={isDeleting}
                  onPress={handleDelete}
                  className="flex-1"
                />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowDeleteConfirm(true)}
              className="flex-row items-center justify-center py-3 active:opacity-70 mt-1"
            >
              <Trash2 size={15} color="#C4432F" />
              <Text className="font-body-medium text-xs text-danger ml-1.5">
                Delete Transaction
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E2E4DF',
  borderRadius: 12,
  height: 48,
  paddingHorizontal: 12,
  fontFamily: 'Inter_400Regular',
  color: '#0F172A',
  fontSize: 15,
};
