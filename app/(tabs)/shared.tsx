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
import { Card } from '../../components/ui/Card';
import { AmountText } from '../../components/ui/AmountText';
import { Button } from '../../components/ui/Button';
import { router } from 'expo-router';
import {
  Users,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  X,
  Divide,
  Receipt,
  Sparkles,
} from 'lucide-react-native';

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function SharedScreen() {
  const { roommates, sharedExpenses, debtBalances, addSharedExpense, settleDebt } = useFinance();

  const [showRentModal, setShowRentModal] = useState(false);
  const [rentAmount, setRentAmount] = useState('');
  const [paidById, setPaidById] = useState<string>('user_1');
  const [rentTitle, setRentTitle] = useState('Monthly Apartment Rent');
  const [error, setError] = useState('');

  // Sort expenses by date desc
  const sortedExpenses = [...sharedExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Debts where the current user owes or is owed
  const myDebts = debtBalances.filter((d) => d.fromId === 'user_1');
  const owedToMe = debtBalances.filter((d) => d.toId === 'user_1');
  const allMyBalances = [...myDebts, ...owedToMe];

  // Calculations for live split preview
  const parsedTotal = parseFloat(rentAmount) || 0;
  const splitCount = roommates.length;
  const perPersonShare = parsedTotal > 0 && splitCount > 0 ? parseFloat((parsedTotal / splitCount).toFixed(2)) : 0;
  const selectedPayer = roommates.find((r) => r.id === paidById) || roommates[0];

  const handleAddRent = () => {
    if (parsedTotal <= 0) {
      setError('Please enter a valid rent amount.');
      return;
    }
    if (!rentTitle.trim()) {
      setError('Please enter a description or month for the rent.');
      return;
    }

    addSharedExpense({
      title: rentTitle.trim(),
      amount: parsedTotal,
      paidById: selectedPayer.id,
      paidByName: selectedPayer.name,
      splitWithIds: ['user_1', 'user_2', 'user_3'],
      category: 'bills',
    });

    setRentAmount('');
    setRentTitle('Monthly Apartment Rent');
    setError('');
    setShowRentModal(false);
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
        <View className="flex-row items-center justify-between mb-5 mt-1">
          <View className="flex-row items-center flex-1 mr-3">
            <Pressable
              onPress={() => router.replace('/(tabs)/more')}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center mr-2.5 active:bg-surface-alt shadow-xs"
              accessibilityLabel="Back to Settings"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </Pressable>
            <View>
              <Text className="font-display text-2xl text-ink">Apartment</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setShowRentModal(true)}
            className="flex-row items-center bg-primary px-3.5 py-2 rounded-xl active:bg-primary-pressed shadow-sm"
          >
            <Plus size={16} color="#FFFFFF" />
            <Text className="font-body-semibold text-xs text-surface ml-1.5">Add Rent</Text>
          </Pressable>
        </View>

        {/* Apartment Roommates Card */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-display text-lg text-ink">Apartment 304</Text>
              <View className="flex-row items-center mt-1">
                <Users size={13} color="#64748B" strokeWidth={1.8} />
                <Text className="font-body-medium text-xs text-ink-muted ml-1.5">3 roommates</Text>
              </View>
            </View>

            {/* Overlapping minimalist roommate avatars */}
            <View className="flex-row items-center">
              {roommates.map((rm, idx) => (
                <View
                  key={rm.id}
                  className="w-7 h-7 rounded-full items-center justify-center border-2 border-surface shadow-xs"
                  style={{
                    backgroundColor: rm.avatarColor,
                    marginLeft: idx === 0 ? 0 : -8,
                    zIndex: roommates.length - idx,
                  }}
                >
                  <Text className="font-display-bold text-[10px] text-white">
                    {getInitials(rm.name)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Minimalist roommate tags */}
          <View className="flex-row items-center pt-3 mt-3 border-t border-border/60" style={{ gap: 8 }}>
            {roommates.map((rm) => (
              <View
                key={rm.id}
                className="flex-1 flex-row items-center bg-surface-alt/70 px-2.5 py-1.5 rounded-lg border border-border/40"
              >
                <View
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: rm.avatarColor }}
                />
                <Text className="font-body-medium text-xs text-ink truncate flex-1" numberOfLines={1}>
                  {rm.isCurrentUser ? 'You' : rm.name.split(' ')[0]}
                </Text>
                <Text className="font-body text-[11px] text-ink-muted">33%</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Quick Add Rent Banner */}
        <Pressable
          onPress={() => setShowRentModal(true)}
          className="bg-accent-light/60 border border-accent/20 rounded-xl p-4 mb-4 flex-row items-center justify-between active:bg-accent-light"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <Sparkles size={16} color="#B45309" />
              <Text className="font-display text-sm text-ink ml-1.5">One person pays total rent?</Text>
            </View>
            <Text className="font-body text-xs text-ink-muted">
              Enter total apartment rent. Wallo automatically splits it into 3 equal shares and tracks who owes whom.
            </Text>
          </View>
          <View className="bg-accent px-3.5 py-2 rounded-lg shadow-sm">
            <Text className="font-body-semibold text-xs text-white">Split Rent</Text>
          </View>
        </Pressable>

        {/* Rent Balances — Who owes whom */}
        <View className="mb-4">
          <Text className="font-display text-base text-ink mb-3">Rent Balances</Text>
          {allMyBalances.length > 0 ? (
            allMyBalances.map((debt) => {
              const iOwe = debt.fromId === 'user_1';
              const otherName = iOwe ? debt.toName : debt.fromName;
              const color = iOwe ? '#F04438' : '#12B76A';
              const prefix = iOwe ? 'You owe ' : '';
              const suffix = iOwe ? '' : ' owes you';

              return (
                <Card key={debt.id} className="mb-2.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{
                          backgroundColor:
                            (roommates.find((r) => r.name === otherName)?.avatarColor || '#64748B') + '22',
                        }}
                      >
                        <Text
                          className="font-display-bold text-xs"
                          style={{
                            color:
                              roommates.find((r) => r.name === otherName)?.avatarColor ||
                              '#64748B',
                          }}
                        >
                          {getInitials(otherName)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-body-medium text-sm text-ink">
                          {prefix}
                          <Text style={{ color, fontFamily: 'Inter_600SemiBold' }}>{otherName}</Text>
                          {suffix}
                        </Text>
                        <Text className="font-body text-xs text-ink-muted">
                          {iOwe ? 'Your 1/3 apartment rent share' : '1/3 apartment rent share'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <AmountText
                        amount={debt.amount}
                        type={iOwe ? 'expense' : 'income'}
                        size="md"
                        showSign
                      />
                      {iOwe ? (
                        <Pressable
                          onPress={() => router.push('/modal/settle-up')}
                          className="bg-primary px-3 py-1.5 rounded-lg active:bg-primary-pressed shadow-sm"
                        >
                          <Text className="font-body-semibold text-xs text-surface">Pay</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => settleDebt(debt.fromId, debt.toId, debt.amount)}
                          className="bg-surface-alt border border-border px-3 py-1.5 rounded-lg active:bg-border/60"
                        >
                          <Text className="font-body-semibold text-xs text-ink">Settled</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })
          ) : (
            <Card className="items-center py-6">
              <CheckCircle2 size={32} color="#12B76A" />
              <Text className="font-display text-sm text-ink mt-2 mb-1">All rent settled!</Text>
              <Text className="font-body text-xs text-ink-muted text-center">
                All 3 roommates are completely settled up with zero pending debt.
              </Text>
            </Card>
          )}
        </View>

        {/* Rent History */}
        <View className="mb-4">
          <Text className="font-display text-base text-ink mb-3">Rent History</Text>

          {sortedExpenses.length === 0 ? (
            <Card className="items-center py-8">
              <Building size={32} color="#667085" />
              <Text className="font-display text-sm text-ink mt-2 mb-1">No rent logged yet</Text>
              <Text className="font-body text-xs text-ink-muted text-center px-4">
                Tap "Add Rent" above to record the total apartment fee and split it 3 ways.
              </Text>
            </Card>
          ) : (
            sortedExpenses.map((expense) => {
              const dateObj = new Date(expense.date);
              const dateStr = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              const perPerson = expense.amount / expense.splitWithIds.length;
              const paidByYou = expense.paidById === 'user_1';

              return (
                <Card key={expense.id} className="mb-2.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: '#F59E0B18' }}
                      >
                        <Building size={18} color="#B45309" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-body-semibold text-sm text-ink" numberOfLines={1}>
                          {expense.title}
                        </Text>
                        <Text className="font-body text-xs text-ink-muted mt-0.5">
                          {dateStr} · Paid by {paidByYou ? 'You' : expense.paidByName} · 3 people
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-display-bold text-sm text-ink">
                        ${expense.amount.toFixed(2)}
                      </Text>
                      <Text className="font-body-semibold text-xs text-accent mt-0.5">
                        ${perPersonShare > 0 ? perPerson.toFixed(2) : perPerson.toFixed(2)} / person
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* Primary CTA */}
        <Button
          label="+ Split Total Apartment Rent"
          onPress={() => setShowRentModal(true)}
          className="mt-1"
        />
      </ScrollView>

      {/* Add Rent Modal */}
      <Modal
        visible={showRentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' }}
            onPress={() => setShowRentModal(false)}
          >
            <Pressable
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="font-display text-lg text-ink">Split Apartment Rent</Text>
                  <Text className="font-body text-xs text-ink-muted mt-0.5">
                    Split equally across the 3 roommates in Apt 304
                  </Text>
                </View>
                <Pressable onPress={() => setShowRentModal(false)} hitSlop={8}>
                  <X size={22} color="#64748B" />
                </Pressable>
              </View>

              {/* Total Rent Amount */}
              <Text className="font-body text-xs text-ink-muted mb-1">Total Apartment Rent ($)</Text>
              <TextInput
                value={rentAmount}
                onChangeText={(v) => {
                  setRentAmount(v);
                  setError('');
                }}
                keyboardType="decimal-pad"
                autoFocus
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F1F5F9',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  height: 56,
                  paddingHorizontal: 14,
                  fontSize: 26,
                  fontFamily: 'Sora_700Bold',
                  color: '#16202A',
                  marginBottom: 16,
                }}
              />

              {/* Who paid total rent? */}
              <Text className="font-body text-xs text-ink-muted mb-2">Who paid the total rent to the landlord?</Text>
              <View className="flex-row mb-4" style={{ gap: 8 }}>
                {roommates.map((rm) => {
                  const isSelected = paidById === rm.id;
                  return (
                    <Pressable
                      key={rm.id}
                      onPress={() => setPaidById(rm.id)}
                      className={`flex-1 py-2.5 rounded-xl items-center border ${
                        isSelected
                          ? 'bg-primary border-primary shadow-sm'
                          : 'bg-surface border-border active:bg-surface-alt'
                      }`}
                    >
                      <Text
                        className={`font-body-semibold text-xs ${
                          isSelected ? 'text-surface' : 'text-ink'
                        }`}
                      >
                        {rm.isCurrentUser ? 'You' : rm.name}
                      </Text>
                      <Text
                        className={`font-body text-[10px] mt-0.5 ${
                          isSelected ? 'text-surface/80' : 'text-ink-muted'
                        }`}
                      >
                        {isSelected ? 'Paid total' : 'Roommate'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Rent Month / Description */}
              <Text className="font-body text-xs text-ink-muted mb-1">Description / Month</Text>
              <TextInput
                value={rentTitle}
                onChangeText={(v) => {
                  setRentTitle(v);
                  setError('');
                }}
                placeholder="e.g. September Rent"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F1F5F9',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  height: 46,
                  paddingHorizontal: 12,
                  fontFamily: 'Inter_400Regular',
                  color: '#16202A',
                  fontSize: 14,
                  marginBottom: 16,
                }}
              />

              {/* Automatic 3-Way Split Preview */}
              <View className="bg-surface-alt border border-border rounded-xl p-3.5 mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Divide size={15} color="#B45309" />
                    <Text className="font-body-semibold text-xs text-ink ml-1.5">
                      Automatic {splitCount}-Way Split:
                    </Text>
                  </View>
                  <Text className="font-display-bold text-sm text-accent">
                    ${perPersonShare.toFixed(2)} / person
                  </Text>
                </View>

                <View className="pt-2 border-t border-border/60" style={{ gap: 4 }}>
                  {roommates.map((rm) => {
                    const isPayer = rm.id === paidById;
                    return (
                      <View key={rm.id} className="flex-row justify-between items-center">
                        <Text className="font-body text-xs text-ink">
                          • {rm.isCurrentUser ? 'You' : rm.name}:
                        </Text>
                        <Text
                          className={`font-body-semibold text-xs ${
                            isPayer ? 'text-income' : 'text-danger'
                          }`}
                        >
                          {isPayer
                            ? `Paid $${parsedTotal.toFixed(2)} (gets $${(perPersonShare * (roommates.length - 1)).toFixed(2)} back)`
                            : `Owes $${perPersonShare.toFixed(2)} to ${selectedPayer.isCurrentUser ? 'you' : selectedPayer.name}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {error ? (
                <Text className="font-body text-xs text-danger mb-3 text-center">{error}</Text>
              ) : null}

              {/* Action Buttons */}
              <View className="flex-row" style={{ gap: 12 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowRentModal(false)}
                  className="flex-1"
                />
                <Button
                  label={`Split Rent ${splitCount} Ways`}
                  onPress={handleAddRent}
                  className="flex-1"
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
