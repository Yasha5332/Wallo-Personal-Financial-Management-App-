import React, { useState, useRef } from 'react';
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
import { useCurrency } from '../../context/CurrencyContext';
import { Button } from '../../components/ui/Button';
import { AmountText } from '../../components/ui/AmountText';
import { X, CheckCircle2, ArrowRight, HandCoins, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function SettleUpModal() {
  const { debtBalances, members, settleDebt } = useFinance();
  const { formatCurrency, currency } = useCurrency();

  // Debts where user owes someone vs someone owes user
  const myDebts = debtBalances.filter((d) => d.fromMemberId === 'user_1');
  const owedToMe = debtBalances.filter((d) => d.toMemberId === 'user_1');

  const [activeTab, setActiveTab] = useState<'i_pay' | 'they_pay'>(
    myDebts.length > 0 ? 'i_pay' : 'they_pay'
  );

  const currentList = activeTab === 'i_pay' ? myDebts : owedToMe;
  const [selectedDebt, setSelectedDebt] = useState(currentList[0]?.id || '');
  const [customAmount, setCustomAmount] = useState('');
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState('');

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

  const debt = currentList.find((d) => d.id === selectedDebt) || currentList[0];

  const handleSettle = () => {
    if (!debt) {
      setError('Please select a debt to settle.');
      return;
    }
    const amt = customAmount.trim() ? parseFloat(customAmount) : debt.amount;
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid settlement amount.');
      return;
    }
    if (amt > debt.amount + 0.001) {
      setError(`Cannot exceed outstanding amount (${formatCurrency(debt.amount)}).`);
      return;
    }
    settleDebt({
      group_id: 'grp_demo',
      from_member_id: debt.fromMemberId,
      to_member_id: debt.toMemberId,
      amount: amt,
    });
    setSettled(true);
  };

  if (settled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F5F4' }}>
        <View
          style={[
            { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
            Platform.OS === 'web' && { maxWidth: 520, width: '100%', marginHorizontal: 'auto' },
          ]}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              backgroundColor: '#2F8F6B18',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={36} color="#2F8F6B" />
          </View>
          <Text className="font-display text-2xl text-ink mb-2 text-center">Settled up!</Text>
          <Text className="font-body text-sm text-ink-muted text-center mb-8 px-4">
            Payment has been successfully recorded and your shared balances are updated.
          </Text>
          <Button label="Done" onPress={handleDismiss} className="w-full" />
        </View>
      </SafeAreaView>
    );
  }

  if (myDebts.length === 0 && owedToMe.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F5F4' }}>
        <View
          style={[
            { flex: 1, padding: 20 },
            Platform.OS === 'web' && { maxWidth: 520, width: '100%', marginHorizontal: 'auto' },
          ]}
        >
          <View className="flex-row items-center justify-between pt-3 mb-6">
            <Text className="font-display text-2xl text-ink">Settle Up</Text>
            <Pressable
              onPress={handleDismiss}
              hitSlop={8}
              className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center active:bg-surface-alt"
            >
              <X size={18} color="#1C1F1D" />
            </Pressable>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-4">
              <CheckCircle2 size={36} color="#2F8F6B" />
            </View>
            <Text className="font-display text-xl text-ink mb-2">You're all settled!</Text>
            <Text className="font-body text-sm text-ink-muted text-center leading-5 px-4 mb-6">
              You don't have any outstanding debts with your circle right now.
            </Text>
            <Button label="Close" onPress={handleDismiss} className="w-full" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F5F4' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 60,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View
            style={[
              { width: '100%' },
              Platform.OS === 'web' && { maxWidth: 540, marginHorizontal: 'auto' },
            ]}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-secondary/15 items-center justify-center mr-3 border border-secondary/30">
                  <HandCoins size={20} color="#A87317" />
                </View>
                <View>
                  <Text className="font-display text-2xl text-ink">Settle Up</Text>
                  <Text className="font-body text-xs text-ink-muted">
                    Clear balances with roommates & friends
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleDismiss}
                hitSlop={8}
                className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center active:bg-surface-alt"
              >
                <X size={18} color="#1C1F1D" />
              </Pressable>
            </View>

            {/* Mode Selector Tab */}
            {(myDebts.length > 0 || owedToMe.length > 0) && (
              <View className="flex-row bg-surface-alt p-1 rounded-xl mb-4 border border-border">
                <Pressable
                  onPress={() => {
                    setActiveTab('i_pay');
                    setSelectedDebt(myDebts[0]?.id || '');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg items-center flex-row justify-center ${
                    activeTab === 'i_pay' ? 'bg-surface shadow-xs border border-border/80' : ''
                  }`}
                >
                  <ArrowUpRight
                    size={14}
                    color={activeTab === 'i_pay' ? '#E2604F' : '#6B7370'}
                    strokeWidth={2.4}
                  />
                  <Text
                    className={`text-xs ml-1.5 ${
                      activeTab === 'i_pay'
                        ? 'font-body-semibold text-expense'
                        : 'font-body-medium text-ink-muted'
                    }`}
                  >
                    I'm Paying ({myDebts.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setActiveTab('they_pay');
                    setSelectedDebt(owedToMe[0]?.id || '');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg items-center flex-row justify-center ${
                    activeTab === 'they_pay' ? 'bg-surface shadow-xs border border-border/80' : ''
                  }`}
                >
                  <ArrowDownLeft
                    size={14}
                    color={activeTab === 'they_pay' ? '#2F8F6B' : '#6B7370'}
                    strokeWidth={2.4}
                  />
                  <Text
                    className={`text-xs ml-1.5 ${
                      activeTab === 'they_pay'
                        ? 'font-body-semibold text-income'
                        : 'font-body-medium text-ink-muted'
                    }`}
                  >
                    Friend Paid Me ({owedToMe.length})
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Debt Selector Chips if multiple */}
            {currentList.length > 1 && (
              <>
                <Text className="font-body text-xs text-ink-muted mb-2">
                  {activeTab === 'i_pay' ? 'Select friend to pay:' : 'Select friend who paid you:'}
                </Text>
                <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
                  {currentList.map((d) => {
                    const friendName = activeTab === 'i_pay' ? d.toName : d.fromName;
                    const isSelected = (selectedDebt === d.id || (!selectedDebt && debt?.id === d.id));
                    return (
                      <Pressable
                        key={d.id}
                        onPress={() => {
                          setSelectedDebt(d.id);
                          setError('');
                        }}
                        className={`px-3.5 py-2 rounded-xl border ${
                          isSelected
                            ? 'bg-primary border-primary shadow-xs'
                            : 'bg-surface border-border active:bg-surface-alt'
                        }`}
                      >
                        <Text
                          className={`font-body-semibold text-xs ${
                            isSelected ? 'text-surface' : 'text-ink'
                          }`}
                        >
                          {friendName} ({formatCurrency(d.amount)})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Transfer Diagram Card */}
            {debt ? (
              <View className="bg-surface rounded-2xl p-4 mb-4 border border-border/80 shadow-xs">
                <Text className="font-body text-xs text-ink-muted mb-3 text-center">
                  {activeTab === 'i_pay'
                    ? `You are paying ${debt.toName}`
                    : `${debt.fromName} paid you`}
                </Text>

                <View className="flex-row items-center justify-between px-2">
                  {/* From Party */}
                  <View className="items-center flex-1">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mb-1 shadow-xs"
                      style={{
                        backgroundColor:
                          members.find((r) => r.id === debt.fromMemberId)?.avatar_color || '#1E3D3C',
                      }}
                    >
                      <Text className="font-display-bold text-sm text-white">
                        {debt.fromMemberId === 'user_1' ? 'YOU' : getInitials(debt.fromName)}
                      </Text>
                    </View>
                    <Text className="font-body-semibold text-xs text-ink" numberOfLines={1}>
                      {debt.fromMemberId === 'user_1' ? 'You' : debt.fromName}
                    </Text>
                    <Text className="font-body text-[10px] text-ink-muted">Payer</Text>
                  </View>

                  {/* Transfer Indicator */}
                  <View className="items-center px-3">
                    <AmountText
                      amount={debt.amount}
                      type={activeTab === 'i_pay' ? 'expense' : 'income'}
                      size="md"
                      showSign
                    />
                    <View className="flex-row items-center mt-1">
                      <View className="h-0.5 w-8 bg-border" />
                      <ArrowRight size={14} color="#1E3D3C" />
                    </View>
                  </View>

                  {/* To Party */}
                  <View className="items-center flex-1">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mb-1 shadow-xs"
                      style={{
                        backgroundColor:
                          members.find((r) => r.id === debt.toMemberId)?.avatar_color || '#1E3D3C',
                      }}
                    >
                      <Text className="font-display-bold text-sm text-white">
                        {debt.toMemberId === 'user_1' ? 'YOU' : getInitials(debt.toName)}
                      </Text>
                    </View>
                    <Text className="font-body-semibold text-xs text-ink" numberOfLines={1}>
                      {debt.toMemberId === 'user_1' ? 'You' : debt.toName}
                    </Text>
                    <Text className="font-body text-[10px] text-ink-muted">Recipient</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="p-4 bg-surface rounded-2xl border border-border mb-4 items-center">
                <Text className="font-body text-xs text-ink-muted">
                  {activeTab === 'i_pay'
                    ? 'You do not owe anyone right now.'
                    : 'No friends currently owe you.'}
                </Text>
              </View>
            )}

            {debt && (
              <>
                {/* Preset Chips */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-body text-xs text-ink-muted">Settlement amount</Text>
                  <Text className="font-body-semibold text-xs text-ink">
                    Total: {formatCurrency(debt.amount)}
                  </Text>
                </View>

                <View className="flex-row gap-2 mb-3">
                  <Pressable
                    onPress={() => {
                      setCustomAmount(debt.amount.toString());
                      setError('');
                    }}
                    className="flex-1 py-2 rounded-xl bg-primary/10 border border-primary/30 items-center active:bg-primary/20"
                  >
                    <Text className="font-body-semibold text-xs text-primary">
                      Full ({formatCurrency(debt.amount)})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      const half = parseFloat((debt.amount / 2).toFixed(2));
                      setCustomAmount(half.toString());
                      setError('');
                    }}
                    className="flex-1 py-2 rounded-xl bg-surface-alt border border-border items-center active:bg-border/60"
                  >
                    <Text className="font-body-semibold text-xs text-ink">
                      Half ({formatCurrency(debt.amount / 2)})
                    </Text>
                  </Pressable>
                </View>

                {/* Custom Amount Input */}
                <View className="bg-surface border border-border rounded-xl p-3.5 mb-3 shadow-xs">
                  <Text className="font-body text-xs text-ink-muted mb-1">
                    Custom Amount ({currency.code})
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="font-display-bold text-xl text-ink mr-2">
                      {currency.symbol}
                    </Text>
                    <TextInput
                      value={customAmount}
                      onChangeText={(v) => {
                        setCustomAmount(v);
                        setError('');
                      }}
                      keyboardType="decimal-pad"
                      placeholder={debt.amount.toString()}
                      placeholderTextColor="#8A928E"
                      className="flex-1 font-display-bold text-2xl text-ink"
                    />
                  </View>
                </View>

                {error ? (
                  <Text className="font-body text-xs text-danger mb-3 text-center">{error}</Text>
                ) : null}

                <Button
                  label={activeTab === 'i_pay' ? 'Confirm Payment' : 'Record Received Payment'}
                  onPress={handleSettle}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
