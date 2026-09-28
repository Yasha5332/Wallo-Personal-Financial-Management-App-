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
import { Button } from '../../components/ui/Button';
import {
  X,
  Sparkles,
  Calendar,
  DollarSign,
  Lock,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useCurrency } from '../../context/CurrencyContext';

export default function EditPayPeriodModal() {
  const { payPeriod, updatePayPeriod, dailyBudgetStats } = useFinance();
  const { currency, formatCurrency } = useCurrency();

  const [income, setIncome] = useState((payPeriod?.income_amount ?? 0).toString());
  const [fixedCosts, setFixedCosts] = useState((payPeriod?.fixed_costs_amount ?? 0).toString());
  const [savingsTarget, setSavingsTarget] = useState((payPeriod?.savings_target_amount ?? 0).toString());
  const [daysRemaining, setDaysRemaining] = useState((dailyBudgetStats?.daysRemaining ?? 30).toString());
  const [error, setError] = useState('');

  const numIncome = parseFloat(income) || 0;
  const numFixed = parseFloat(fixedCosts) || 0;
  const numSavings = parseFloat(savingsTarget) || 0;
  const numDays = Math.max(1, parseInt(daysRemaining, 10) || 1);

  // Live preview computations
  const previewSpendablePot = Math.max(0, numIncome - numFixed - numSavings);
  const previewRemainingPot = previewSpendablePot - (dailyBudgetStats?.totalExpenses ?? 0);
  const previewDailyLimit =
    numDays > 0 && previewRemainingPot > 0 ? previewRemainingPot / numDays : 0;
  const isNegativePot = numIncome < numFixed + numSavings;

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

  const handleSave = () => {
    if (numIncome <= 0) {
      setError('Please enter a valid expected income.');
      return;
    }

    const now = new Date();
    const newEndDate = new Date(now.getTime() + numDays * 24 * 60 * 60 * 1000).toISOString();

    updatePayPeriod({
      income_amount: numIncome,
      fixed_costs_amount: numFixed,
      savings_target_amount: numSavings,
      end_date: newEndDate.slice(0, 10),
    });

    handleDismiss();
  };

  const handleClose = handleDismiss;

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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="font-display text-xl text-ink">Plan Pay Period</Text>
              <Text className="font-body text-xs text-ink-muted mt-0.5">
                Set budget until your next payday
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center active:bg-surface-alt"
            >
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Live Dynamic Calculation Preview Card */}
          <View
            className="rounded-2xl mb-6 overflow-hidden"
            style={{
              shadowColor: '#16202A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#111827', '#1A242F', '#24303F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 18,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Ambient decorative blurred glowing glass circles */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 180,
                  height: 180,
                  ...(Platform.OS === 'web'
                    ? ({ filter: 'blur(30px)', WebkitFilter: 'blur(30px)' } as any)
                    : {}),
                }}
              >
                <Svg width="100%" height="100%" viewBox="0 0 180 180">
                  <Defs>
                    <RadialGradient id="modalCircleBlur1" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                      <Stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.7" />
                      <Stop offset="30%" stopColor="#FF6B4A" stopOpacity="0.4" />
                      <Stop offset="60%" stopColor="#FF6B4A" stopOpacity="0.15" />
                      <Stop offset="85%" stopColor="#FF6B4A" stopOpacity="0.04" />
                      <Stop offset="100%" stopColor="#FF6B4A" stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx="90" cy="90" r="90" fill="url(#modalCircleBlur1)" />
                </Svg>
              </View>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  bottom: -45,
                  left: 10,
                  width: 150,
                  height: 150,
                  ...(Platform.OS === 'web'
                    ? ({ filter: 'blur(30px)', WebkitFilter: 'blur(30px)' } as any)
                    : {}),
                }}
              >
                <Svg width="100%" height="100%" viewBox="0 0 150 150">
                  <Defs>
                    <RadialGradient id="modalCircleBlur2" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                      <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
                      <Stop offset="30%" stopColor="#F59E0B" stopOpacity="0.32" />
                      <Stop offset="60%" stopColor="#F59E0B" stopOpacity="0.12" />
                      <Stop offset="85%" stopColor="#F59E0B" stopOpacity="0.03" />
                      <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx="75" cy="75" r="75" fill="url(#modalCircleBlur2)" />
                </Svg>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Sparkles size={14} color="#FF6B4A" />
                  <Text className="font-body-medium text-xs text-slate-200 ml-1.5">
                    Live Daily Budget Preview
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: isNegativePot ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isNegativePot ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Text
                    className={`font-body-semibold text-[10px] ${
                      isNegativePot ? 'text-rose-300' : 'text-emerald-300'
                    }`}
                  >
                    {isNegativePot ? 'Over Allocated' : 'Balanced Plan'}
                  </Text>
                </View>
              </View>

              <Text className="font-display-bold text-3xl text-white my-1">
                {formatCurrency(previewDailyLimit)}
                <Text className="font-body text-sm text-slate-300 font-normal"> / day</Text>
              </Text>

              <Text className="font-body text-xs text-slate-300/80 mb-3">
                Calculated over {numDays} days until your next payday
              </Text>

              <View className="flex-row border-t border-white/15 pt-3 mt-1" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="font-body text-[10px] text-slate-400">Spendable pot</Text>
                  <Text className="font-body-semibold text-xs text-white mt-0.5">
                    {formatCurrency(previewSpendablePot)}
                  </Text>
                </View>
                <View className="w-px bg-white/15" />
                <View className="flex-1">
                  <Text className="font-body text-[10px] text-slate-400">Spent so far</Text>
                  <Text className="font-body-semibold text-xs text-rose-300 mt-0.5">
                    {formatCurrency(dailyBudgetStats?.totalExpenses ?? 0)}
                  </Text>
                </View>
                <View className="w-px bg-white/15" />
                <View className="flex-1">
                  <Text className="font-body text-[10px] text-slate-400">Pot remaining</Text>
                  <Text className="font-body-semibold text-xs text-emerald-300 mt-0.5">
                    {formatCurrency(Math.max(0, previewRemainingPot))}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {isNegativePot && (
            <View className="flex-row items-center bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-5">
              <AlertTriangle size={18} color="#E11D48" />
              <Text className="font-body text-xs text-rose-700 ml-2.5 flex-1">
                Fixed costs & savings ({formatCurrency(numFixed + numSavings)}) exceed your income (
                {formatCurrency(numIncome)}). Adjust them to ensure a positive daily budget.
              </Text>
            </View>
          )}

          {error ? (
            <View className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
              <Text className="font-body text-xs text-rose-600">{error}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View className="bg-surface border border-border rounded-2xl p-4 mb-6" style={{ gap: 16 }}>
            {/* Expected Income */}
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="font-body-medium text-xs text-ink">Expected Income / Allowance</Text>
                <Text className="font-body text-[11px] text-ink-muted">Total for period</Text>
              </View>
              <View className="flex-row items-center bg-surface-alt border border-border rounded-xl px-3 h-12">
                <Text className="font-display-bold text-sm text-primary">{currency.symbol}</Text>
                <TextInput
                  value={income}
                  onChangeText={(val) => {
                    setIncome(val);
                    setError('');
                  }}
                  placeholder={currency.decimals === 0 ? '0' : '0.00'}
                  keyboardType="numeric"
                  className="flex-1 ml-2 font-display text-base text-ink"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Fixed Costs */}
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="font-body-medium text-xs text-ink">Fixed Costs</Text>
                <Text className="font-body text-[11px] text-ink-muted">Rent, utilities, subscriptions</Text>
              </View>
              <View className="flex-row items-center bg-surface-alt border border-border rounded-xl px-3 h-12">
                <Lock size={16} color="#64748B" />
                <TextInput
                  value={fixedCosts}
                  onChangeText={(val) => {
                    setFixedCosts(val);
                    setError('');
                  }}
                  placeholder={currency.decimals === 0 ? '0' : '0.00'}
                  keyboardType="numeric"
                  className="flex-1 ml-2 font-display text-base text-ink"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Savings Target */}
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="font-body-medium text-xs text-ink">Savings Target</Text>
                <Text className="font-body text-[11px] text-ink-muted">Reserved in vault</Text>
              </View>
              <View className="flex-row items-center bg-surface-alt border border-border rounded-xl px-3 h-12">
                <PiggyBank size={16} color="#64748B" />
                <TextInput
                  value={savingsTarget}
                  onChangeText={(val) => {
                    setSavingsTarget(val);
                    setError('');
                  }}
                  placeholder={currency.decimals === 0 ? '0' : '0.00'}
                  keyboardType="numeric"
                  className="flex-1 ml-2 font-display text-base text-ink"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Days Until Payday */}
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="font-body-medium text-xs text-ink">Days Until Payday</Text>
                <Text className="font-body text-[11px] text-ink-muted">Pacing duration</Text>
              </View>
              <View className="flex-row items-center bg-surface-alt border border-border rounded-xl px-3 h-12">
                <Calendar size={16} color="#64748B" />
                <TextInput
                  value={daysRemaining}
                  onChangeText={(val) => {
                    setDaysRemaining(val);
                    setError('');
                  }}
                  placeholder="e.g. 14"
                  keyboardType="number-pad"
                  className="flex-1 ml-2 font-display text-base text-ink"
                  placeholderTextColor="#94A3B8"
                />
                <Text className="font-body text-xs text-ink-muted">days left</Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Button
            title="Save & Start Plan"
            onPress={handleSave}
            variant="primary"
            size="lg"
            className="w-full"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
