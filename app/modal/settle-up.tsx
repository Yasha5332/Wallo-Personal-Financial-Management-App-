import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { Button } from '../../components/ui/Button';
import { AmountText } from '../../components/ui/AmountText';
import { X, CheckCircle2, ArrowRight } from 'lucide-react-native';

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function SettleUpModal() {
  const { debtBalances, roommates, settleDebt } = useFinance();

  // Only show debts where the current user owes someone
  const myDebts = debtBalances.filter((d) => d.fromId === 'user_1');

  const [selectedDebt, setSelectedDebt] = useState(myDebts[0]?.id || '');
  const [customAmount, setCustomAmount] = useState('');
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState('');

  const debt = myDebts.find((d) => d.id === selectedDebt);

  const handleSettle = () => {
    if (!debt) {
      setError('Please select a debt to settle.');
      return;
    }
    const amt = customAmount.trim()
      ? parseFloat(customAmount)
      : debt.amount;
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (amt > debt.amount + 0.001) {
      setError(`Can't pay more than the owed amount ($${debt.amount.toFixed(2)}).`);
      return;
    }
    settleDebt(debt.fromId, debt.toId, amt);
    setSettled(true);
  };

  if (settled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              backgroundColor: '#10B98118',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={36} color="#10B981" />
          </View>
          <Text className="font-display text-xl text-ink mb-2 text-center">All settled!</Text>
          <Text className="font-body text-sm text-ink-muted text-center mb-8">
            Your payment has been recorded and the balance updated.
          </Text>
          <Button label="Done" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (myDebts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View className="flex-row items-center justify-between px-5 pt-5 mb-6">
          <Text className="font-display text-xl text-ink">Settle Up</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}
            className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center">
            <X size={18} color="#0F172A" />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <CheckCircle2 size={48} color="#10B981" />
          <Text className="font-display text-lg text-ink mt-4 mb-2">You're all clear!</Text>
          <Text className="font-body text-sm text-ink-muted text-center">
            You don't owe any of your roommates right now.
          </Text>
          <Button label="Close" onPress={() => router.back()} className="mt-8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
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
            <Text className="font-display text-xl text-ink">Settle Up</Text>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
            >
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Debt selector (if multiple debts) */}
          {myDebts.length > 1 && (
            <>
              <Text className="font-body text-xs text-ink-muted mb-2">Who are you paying?</Text>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
                {myDebts.map((d) => (
                  <Pressable
                    key={d.id}
                    onPress={() => { setSelectedDebt(d.id); setError(''); }}
                    className={`px-3 py-2 rounded-pill border ${
                      selectedDebt === d.id
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    }`}
                  >
                    <Text className={`font-body-medium text-sm ${selectedDebt === d.id ? 'text-surface' : 'text-ink'}`}>
                      {d.toName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Debt Summary Card */}
          {debt && (
            <View
              className="bg-surface rounded-xl px-4 py-4 mb-5 border border-border/70"
              style={{
                shadowColor: 'rgba(15,23,42,0.06)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="font-body text-xs text-ink-muted mb-3">You owe</Text>
              <View className="flex-row items-center justify-between">
                {/* From (You) */}
                <View className="items-center">
                  <View
                    className="w-12 h-12 rounded-pill items-center justify-center mb-1"
                    style={{ backgroundColor: '#0F172A' }}
                  >
                    <Text className="font-display-bold text-surface text-sm">YO</Text>
                  </View>
                  <Text className="font-body text-xs text-ink-muted">You</Text>
                </View>

                <View className="flex-1 items-center">
                  <AmountText amount={debt.amount} type="expense" size="lg" showSign />
                  <View className="flex-row items-center mt-1">
                    <View className="h-0.5 w-8 bg-border" />
                    <ArrowRight size={14} color="#64748B" />
                  </View>
                </View>

                {/* To */}
                <View className="items-center">
                  <View
                    className="w-12 h-12 rounded-pill items-center justify-center mb-1"
                    style={{
                      backgroundColor:
                        roommates.find((r) => r.id === debt.toId)?.avatarColor || '#64748B',
                    }}
                  >
                    <Text className="font-display-bold text-surface text-sm">
                      {getInitials(debt.toName)}
                    </Text>
                  </View>
                  <Text className="font-body text-xs text-ink-muted">{debt.toName}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Custom Amount */}
          <Text className="font-body text-xs text-ink-muted mb-1">
            Amount to pay (leave blank to pay full amount)
          </Text>
          <TextInput
            value={customAmount}
            onChangeText={(v) => { setCustomAmount(v); setError(''); }}
            keyboardType="decimal-pad"
            placeholder={debt ? `$${debt.amount.toFixed(2)} (full amount)` : '0.00'}
            placeholderTextColor="#94A3B8"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 12,
              height: 52,
              paddingHorizontal: 12,
              fontFamily: 'Inter_400Regular',
              color: '#0F172A',
              fontSize: 18,
              marginBottom: 16,
            }}
          />

          {error ? (
            <Text className="font-body text-xs text-danger mb-3 text-center">{error}</Text>
          ) : null}

          <Button label="Confirm Payment" onPress={handleSettle} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
