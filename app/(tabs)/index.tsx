import React from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, Platform } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinance } from '../../context/FinanceContext';
import { AmountText } from '../../components/ui/AmountText';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TransactionRow } from '../../components/TransactionRow';
import { router } from 'expo-router';
import {
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react-native';

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

export default function DashboardScreen() {
  const [budgetView, setBudgetView] = React.useState<'daily' | 'total'>('daily');
  const {
    balance,
    profile,
    transactions,
    budgets,
    totalBudgetLimit,
    totalBudgetSpent,
    debtBalances,
    payPeriod,
    dailyBudgetStats,
  } = useFinance();

  const recentTransactions = transactions.slice(0, 4);
  const budgetProgress = totalBudgetLimit > 0 ? totalBudgetSpent / totalBudgetLimit : 0;
  const budgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const topBudgets = budgets.slice(0, 3);
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' });

  const totalOwedToMe = debtBalances
    .filter((debt) => debt.toId === 'user_1')
    .reduce((total, debt) => total + debt.amount, 0);
  const totalIOwe = debtBalances
    .filter((debt) => debt.fromId === 'user_1')
    .reduce((total, debt) => total + debt.amount, 0);

  // Pot progress calculation
  const potSpent = Math.max(0, dailyBudgetStats.spendablePot - Math.max(0, dailyBudgetStats.remainingPot));
  const potProgress = dailyBudgetStats.spendablePot > 0 ? Math.min(1, potSpent / dailyBudgetStats.spendablePot) : 0;

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header greeting */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <View className="flex-row items-center">
              <Sparkles size={13} color="#FF6B4A" />
              <Text className="font-body-medium text-xs text-ink-muted ml-1.5">{monthLabel} overview</Text>
            </View>
            <Text className="font-display text-2xl text-ink mt-1">Good to see you, {profile.name}</Text>
          </View>
          <View
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{
              backgroundColor: '#16202A',
              shadowColor: '#16202A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="font-display-bold text-sm text-white">{profile.name.slice(0, 1)}</Text>
          </View>
        </View>

        {/* Daily Budget Until Payday - Hero Card with Modern Slate Ink Gradient */}
        <View
          className="rounded-3xl mb-6 overflow-hidden"
          style={{
            shadowColor: '#16202A',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 22,
            elevation: 10,
          }}
        >
          <LinearGradient
            colors={['#111827', '#1A242F', '#24303F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 24,
              paddingHorizontal: 22,
              borderRadius: 24,
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
                top: -60,
                right: -60,
                width: 220,
                height: 220,
                ...(Platform.OS === 'web'
                  ? ({ filter: 'blur(35px)', WebkitFilter: 'blur(35px)' } as any)
                  : {}),
              }}
            >
              <Svg width="100%" height="100%" viewBox="0 0 220 220">
                <Defs>
                  <RadialGradient id="circleBlur1" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                    <Stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.75" />
                    <Stop offset="30%" stopColor="#FF6B4A" stopOpacity="0.45" />
                    <Stop offset="60%" stopColor="#FF6B4A" stopOpacity="0.18" />
                    <Stop offset="85%" stopColor="#FF6B4A" stopOpacity="0.04" />
                    <Stop offset="100%" stopColor="#FF6B4A" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="110" cy="110" r="110" fill="url(#circleBlur1)" />
              </Svg>
            </View>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: -55,
                left: 10,
                width: 200,
                height: 200,
                ...(Platform.OS === 'web'
                  ? ({ filter: 'blur(35px)', WebkitFilter: 'blur(35px)' } as any)
                  : {}),
              }}
            >
              <Svg width="100%" height="100%" viewBox="0 0 200 200">
                <Defs>
                  <RadialGradient id="circleBlur2" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                    <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
                    <Stop offset="30%" stopColor="#F59E0B" stopOpacity="0.35" />
                    <Stop offset="60%" stopColor="#F59E0B" stopOpacity="0.12" />
                    <Stop offset="85%" stopColor="#F59E0B" stopOpacity="0.03" />
                    <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="100" cy="100" r="100" fill="url(#circleBlur2)" />
              </Svg>
            </View>

            {/* Top row: View Switcher (Daily vs Total) & Action */}
            <View className="flex-row items-center justify-between mb-5">
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 14,
                  padding: 3,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                <Pressable
                  onPress={() => setBudgetView('daily')}
                  style={{
                    backgroundColor: budgetView === 'daily' ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
                    paddingHorizontal: 12,
                    paddingVertical: 5.5,
                    borderRadius: 10,
                  }}
                  className="active:opacity-80"
                >
                  <Text
                    className={`text-[11px] ${
                      budgetView === 'daily' ? 'font-body-semibold text-white' : 'font-body text-slate-300/80'
                    }`}
                  >
                    Daily {formatCurrency(dailyBudgetStats.dailyLimit)}/d
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setBudgetView('total')}
                  style={{
                    backgroundColor: budgetView === 'total' ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
                    paddingHorizontal: 12,
                    paddingVertical: 5.5,
                    borderRadius: 10,
                  }}
                  className="active:opacity-80"
                >
                  <Text
                    className={`text-[11px] ${
                      budgetView === 'total' ? 'font-body-semibold text-white' : 'font-body text-slate-300/80'
                    }`}
                  >
                    Total {formatCurrency(totalBudgetLimit)}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push(budgetView === 'daily' ? '/modal/edit-pay-period' : '/budgets')}
                className="flex-row items-center active:opacity-75"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderColor: 'rgba(255, 255, 255, 0.18)',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 11,
                  paddingVertical: 5.5,
                }}
              >
                <Text className="font-body-medium text-[11px] text-white mr-1">
                  {budgetView === 'daily' ? 'Edit' : 'Budgets'}
                </Text>
                <ChevronRight size={11} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Main Metric */}
            <View className="flex-row items-baseline mb-5">
              <Text className="font-display-bold text-4xl text-white tracking-tight">
                {budgetView === 'daily'
                  ? formatCurrency(dailyBudgetStats.dailyLimit)
                  : formatCurrency(totalBudgetLimit)}
              </Text>
              <Text className="font-body text-sm text-slate-300/80 ml-2 font-normal">
                {budgetView === 'daily' ? '/ day' : 'total budget'}
              </Text>
            </View>

            {/* Alert banner only if over budget */}
            {budgetView === 'daily' && dailyBudgetStats.isOverBudget && (
              <View className="bg-rose-500/25 border border-rose-400/30 rounded-2xl p-3.5 mb-4">
                <Text className="font-body-medium text-xs text-rose-200">
                  Over budget by {formatCurrency(dailyBudgetStats.overspendAmount)}
                </Text>
              </View>
            )}

            {budgetView === 'total' && budgetProgress > 1 && (
              <View className="bg-rose-500/25 border border-rose-400/30 rounded-2xl p-3.5 mb-4">
                <Text className="font-body-medium text-xs text-rose-200">
                  Monthly budget exceeded by {formatCurrency(totalBudgetSpent - totalBudgetLimit)}
                </Text>
              </View>
            )}

            {/* Slim progress bar */}
            <View className="w-full h-2 rounded-full bg-white/15 overflow-hidden mb-3.5">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(
                    (budgetView === 'daily' ? potProgress : Math.min(1, budgetProgress)) * 100
                  )}%`,
                  backgroundColor:
                    budgetView === 'daily'
                      ? dailyBudgetStats.status === 'over_budget'
                        ? '#F43F5E'
                        : dailyBudgetStats.status === 'warning'
                        ? '#F59E0B'
                        : '#10B981'
                      : budgetProgress > 1
                      ? '#F43F5E'
                      : budgetProgress > 0.8
                      ? '#F59E0B'
                      : '#10B981',
                }}
              />
            </View>

            {/* Clean minimal footer */}
            <View className="flex-row justify-between items-center pt-0.5">
              <Text className="font-body text-[11px] text-slate-300/80">
                {budgetView === 'daily'
                  ? `${formatCurrency(Math.max(0, dailyBudgetStats.remainingPot))} left of ${formatCurrency(totalBudgetLimit)}`
                  : `${formatCurrency(budgetRemaining)} remaining`}
              </Text>
              <Text className="font-body-medium text-[11px] text-slate-100">
                {budgetView === 'daily'
                  ? `${dailyBudgetStats.daysRemaining}d to payday`
                  : `${formatCurrency(totalBudgetSpent)} spent`}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stat Cards with Soft Gradient & Vibrant Accents */}
        <View className="flex-row mb-7" style={{ gap: 14 }}>
          <Pressable
            onPress={() => router.push('/activity')}
            className="flex-1 active:scale-[0.98] transition-transform"
            style={{
              shadowColor: '#E11D48',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FFF5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: '#FFE4E6',
              }}
            >
              <View className="flex-row items-center justify-between mb-3.5">
                <LinearGradient
                  colors={['#FB7185', '#E11D48']}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#E11D48',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <TrendingUp size={17} color="#FFFFFF" strokeWidth={2.4} />
                </LinearGradient>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#FFF1F2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowUpRight size={14} color="#E11D48" />
                </View>
              </View>
              <Text className="font-body text-xs text-ink-muted">Spent this month</Text>
              <Text className="font-display text-xl text-ink mt-1">{formatCurrency(totalBudgetSpent)}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push('/budgets')}
            className="flex-1 active:scale-[0.98] transition-transform"
            style={{
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F0FDF4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: '#DCFCE7',
              }}
            >
              <View className="flex-row items-center justify-between mb-3.5">
                <LinearGradient
                  colors={['#34D399', '#059669']}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#059669',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <Target size={17} color="#FFFFFF" strokeWidth={2.4} />
                </LinearGradient>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#ECFDF5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowUpRight size={14} color="#059669" />
                </View>
              </View>
              <Text className="font-body text-xs text-ink-muted">Left in plan</Text>
              <Text className="font-display text-xl text-ink mt-1">{formatCurrency(budgetRemaining)}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Monthly Plan Section Header */}
        <View className="flex-row items-end justify-between mb-3.5">
          <View>
            <Text className="font-display text-lg text-ink">Monthly plan</Text>
            <Text className="font-body text-xs text-ink-muted mt-0.5">
              {formatCurrency(totalBudgetSpent)} of {formatCurrency(totalBudgetLimit)} used
            </Text>
          </View>
          <Pressable onPress={() => router.push('/budgets')} className="flex-row items-center active:opacity-70">
            <Text className="font-body-semibold text-xs text-primary mr-1">Open plan</Text>
            <ChevronRight size={15} color="#FF6B4A" />
          </Pressable>
        </View>

        {/* Plan Status Card with Sleek Elevation & Generous Padding */}
        <View
          className="bg-surface rounded-3xl p-5 mb-7"
          style={{
            borderWidth: 1,
            borderColor: '#E2E4DF',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                paddingHorizontal: 10,
                paddingVertical: 4.5,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#A7F3D0',
              }}
            >
              <ShieldCheck size={16} color="#059669" />
              <Text className="font-body-semibold text-xs text-emerald-800 ml-1.5">You are on track</Text>
            </View>
            <Text className="font-body-semibold text-xs text-income">{Math.round(Math.min(budgetProgress, 1) * 100)}%</Text>
          </View>
          <ProgressBar progress={budgetProgress} height={8} />
          <View className="flex-row justify-between mt-3">
            <Text className="font-body text-xs text-ink-muted">Monthly spending</Text>
            <Text className="font-body-medium text-xs text-ink-muted">{formatCurrency(budgetRemaining)} remaining</Text>
          </View>

          <View className="border-t border-border mt-5 pt-4" style={{ gap: 14 }}>
            {topBudgets.map((budget) => {
              const progress = budget.limit > 0 ? budget.spent / budget.limit : 0;
              return (
                <View key={budget.category}>
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-body-medium text-xs text-ink">{budget.name}</Text>
                    <Text className="font-body text-xs text-ink-muted">{Math.round(progress * 100)}%</Text>
                  </View>
                  <ProgressBar progress={progress} height={5} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Shared Expenses Section */}
        {(totalOwedToMe > 0 || totalIOwe > 0) && (
          <Pressable onPress={() => router.push('/shared')} className="mb-7 active:opacity-85">
            <View className="flex-row items-center justify-between mb-3.5">
              <View className="flex-row items-center">
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#FFF1ED',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}
                >
                  <Users size={15} color="#FF6B4A" />
                </View>
                <Text className="font-display text-lg text-ink">Shared expenses</Text>
              </View>
              <ChevronRight size={17} color="#667085" />
            </View>
            <View
              className="flex-row bg-surface rounded-3xl p-5"
              style={{
                borderWidth: 1,
                borderColor: '#E2E4DF',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <View className="flex-1 pr-3">
                <Text className="font-body text-xs text-ink-muted">Coming back to you</Text>
                <AmountText amount={totalOwedToMe} type="income" size="md" showSign className="mt-1" />
              </View>
              <View className="w-px bg-border my-1" />
              <View className="flex-1 pl-3 items-end">
                <Text className="font-body text-xs text-ink-muted">You owe</Text>
                <AmountText amount={totalIOwe} type="expense" size="md" showSign className="mt-1" />
              </View>
            </View>
          </Pressable>
        )}

        <View>
          <View className="flex-row items-center justify-between mb-3.5">
            <View>
              <Text className="font-display text-lg text-ink">Recent activity</Text>
              <Text className="font-body text-xs text-ink-muted mt-0.5">Your latest money moves</Text>
            </View>
            <Pressable onPress={() => router.push('/activity')} className="flex-row items-center active:opacity-70">
              <Text className="font-body-semibold text-xs text-primary mr-1">See all</Text>
              <ChevronRight size={15} color="#FF6B4A" />
            </Pressable>
          </View>
          <View className="bg-surface border border-border rounded-3xl px-4 py-1.5">
            {recentTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                className={index < recentTransactions.length - 1 ? 'border-b border-border' : ''}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
