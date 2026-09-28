import React from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { AmountText } from '../../components/ui/AmountText';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TransactionRow } from '../../components/TransactionRow';
import { BrandLogo } from '../../components/ui/BrandLogo';

export default function DashboardScreen() {
  const [budgetView, setBudgetView] = React.useState<'daily' | 'total'>('daily');
  const { profile } = useAuth();
  const { formatCurrency } = useCurrency();
  const {
    balance,
    transactions,
    budgets,
    totalBudgetLimit,
    totalBudgetSpent,
    debtBalances,
    dailyBudgetStats,
  } = useFinance();

  const recentTransactions = transactions.slice(0, 4);
  const budgetProgress = totalBudgetLimit > 0 ? totalBudgetSpent / totalBudgetLimit : 0;
  const budgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' });
  const totalOwedToMe = debtBalances.filter((debt) => debt.toMemberId === 'user_1').reduce((total, debt) => total + debt.amount, 0);
  const totalIOwe = debtBalances.filter((debt) => debt.fromMemberId === 'user_1').reduce((total, debt) => total + debt.amount, 0);
  const dailyLimit = dailyBudgetStats?.dailyLimit ?? 0;
  const dailyRemaining = Math.max(0, dailyBudgetStats?.remainingPot ?? 0);
  const dailyProgress = dailyBudgetStats?.spendablePot ? 1 - dailyRemaining / dailyBudgetStats.spendablePot : 0;
  const heroProgress = budgetView === 'daily' ? dailyProgress : budgetProgress;
  const heroAmount = budgetView === 'daily' ? dailyLimit : budgetRemaining;
  const heroLabel = budgetView === 'daily' ? 'per day' : 'left this month';
  const avatar = profile?.name?.slice(0, 1).toUpperCase() ?? 'U';
  const userName = profile?.name ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Ambient Modern Atmosphere Glow */}
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -60,
            left: -40,
            right: -40,
            height: 340,
            opacity: 0.9,
          },
          Platform.OS === 'web'
            ? ({
                backgroundImage:
                  'radial-gradient(ellipse 65% 55% at 15% 20%, rgba(13, 148, 136, 0.16) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 85% 15%, rgba(227, 163, 53, 0.14) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 75%)',
              } as any)
            : {},
        ]}
      />

      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 124 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Minimal gradient header */}
        <LinearGradient
          colors={['#DDF6EC', '#C9EEE0', '#F8EBCB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginBottom: 24,
            paddingHorizontal: 17,
            paddingTop: 15,
            paddingBottom: 17,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.75)',
            shadowColor: '#0D9488',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 18,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <BrandLogo size={30} style={{ marginRight: 9 }} />
              <Text
                style={{
                  fontFamily: 'Sora_700Bold',
                  fontSize: 19,
                  letterSpacing: -0.5,
                  color: '#123B37',
                }}
              >
                Wallo
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/more')}
              hitSlop={8}
              accessibilityLabel="Open settings and profile"
              style={({ pressed }) => [
                {
                  alignItems: 'center',
                  borderRadius: 9999,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  backgroundColor: '#0D746B',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.8)',
                }}
              >
                <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 13, color: '#FFFFFF' }}>{avatar}</Text>
              </View>
            </Pressable>
          </View>

          <View className="mt-4">
            <Text className="font-body-semibold text-[10px] text-[#237B6E] tracking-[1.5px] uppercase">{monthLabel} overview</Text>
            <Text
              style={{
                fontFamily: 'Sora_600SemiBold',
                fontSize: 27,
                lineHeight: 34,
                letterSpacing: -0.8,
                color: '#123B37',
                marginTop: 5,
              }}
              numberOfLines={2}
            >
              Good to see you, <Text className="text-primary">{userName}</Text>
            </Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#0B1020', '#312E81', '#7C3AED', '#0F766E']}
          locations={[0, 0.36, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            marginBottom: 24,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
            shadowColor: '#312E81',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.24,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <View className="p-5">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row bg-white/10 rounded-md p-1">
              {(['daily', 'total'] as const).map((view) => (
                <Pressable
                  key={view}
                  onPress={() => setBudgetView(view)}
                  className={`px-3 py-1.5 rounded-sm ${budgetView === view ? 'bg-white/15' : ''}`}
                >
                  <Text className={`font-body-medium text-[11px] ${budgetView === view ? 'text-surface' : 'text-surface/60'}`}>
                    {view === 'daily' ? 'Daily view' : 'Monthly view'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => router.push(budgetView === 'daily' ? '/modal/edit-pay-period' : '/budgets')} className="flex-row items-center">
              <Text className="font-body-semibold text-[11px] text-surface mr-1">{budgetView === 'daily' ? 'Edit' : 'Open'}</Text>
              <ChevronRight size={13} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text className="font-body-medium text-xs text-surface/65 mb-1">Available to spend</Text>
          <View className="flex-row items-baseline mb-5">
            <Text className="font-display-bold text-4xl text-surface">{formatCurrency(heroAmount)}</Text>
            <Text className="font-body text-sm text-surface/65 ml-2">{heroLabel}</Text>
          </View>

          <View className="h-2 rounded-pill bg-white/15 overflow-hidden mb-3">
            <View className="h-full rounded-pill bg-secondary" style={{ width: `${Math.min(100, Math.max(0, heroProgress * 100))}%` }} />
          </View>
          <View className="flex-row justify-between">
            <Text className="font-body text-[11px] text-surface/65">
              {budgetView === 'daily' ? `${formatCurrency(dailyRemaining)} left today` : `${formatCurrency(totalBudgetSpent)} spent`}
            </Text>
            <Text className="font-body-medium text-[11px] text-surface/80">
              {budgetView === 'daily' ? `${dailyBudgetStats?.daysRemaining ?? 0} days to payday` : `${Math.round(Math.min(1, budgetProgress) * 100)}% used`}
            </Text>
          </View>
          </View>
        </LinearGradient>

        <View className="flex-row mb-7" style={{ gap: 12 }}>
          <Pressable onPress={() => router.push('/activity')} className="flex-1 bg-surface border border-border rounded-lg p-4 active:bg-surface-alt">
            <View className="flex-row items-center justify-between mb-4">
              <View className="w-9 h-9 rounded-md bg-expense/10 items-center justify-center">
                <TrendingUp size={17} color="#E2604F" />
              </View>
              <ArrowUpRight size={16} color="#6B7370" />
            </View>
            <Text className="font-body text-xs text-ink-muted">Spent this month</Text>
            <Text className="font-display text-xl text-ink mt-1">{formatCurrency(totalBudgetSpent)}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/more')} className="flex-1 bg-surface border border-border rounded-lg p-4 active:bg-surface-alt">
            <View className="flex-row items-center justify-between mb-4">
              <View className="w-9 h-9 rounded-md bg-secondary/15 items-center justify-center">
                <Target size={17} color="#A87317" />
              </View>
              <ArrowUpRight size={16} color="#6B7370" />
            </View>
            <Text className="font-body text-xs text-ink-muted">Current balance</Text>
            <Text className="font-display text-xl text-ink mt-1">{formatCurrency(balance)}</Text>
          </Pressable>
        </View>

        <View className="flex-row items-end justify-between mb-3">
          <View>
            <Text className="font-display text-lg text-ink">Monthly plan</Text>
            <Text className="font-body text-xs text-ink-muted mt-0.5">A quick read on your spending pace</Text>
          </View>
          <Pressable onPress={() => router.push('/budgets')} className="flex-row items-center">
            <Text className="font-body-semibold text-xs text-primary mr-1">Open plan</Text>
            <ChevronRight size={15} color="#1E3D3C" />
          </Pressable>
        </View>

        <View className="bg-surface border border-border rounded-lg p-4 mb-7">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-pill bg-income/10 items-center justify-center mr-2.5">
                <ShieldCheck size={16} color="#2F8F6B" />
              </View>
              <Text className="font-body-semibold text-sm text-ink">{budgetProgress >= 1 ? 'Plan needs attention' : 'You are on track'}</Text>
            </View>
            <Text className="font-body-semibold text-xs text-income">{Math.round(Math.min(budgetProgress, 1) * 100)}%</Text>
          </View>
          <ProgressBar progress={budgetProgress} height={8} />
          <View className="flex-row justify-between mt-3">
            <Text className="font-body text-xs text-ink-muted">{formatCurrency(totalBudgetSpent)} spent</Text>
            <Text className="font-body-medium text-xs text-ink-muted">{formatCurrency(budgetRemaining)} remaining</Text>
          </View>
          <View className="border-t border-border mt-4 pt-4" style={{ gap: 13 }}>
            {budgets.slice(0, 3).map((budget) => {
              const progress = budget.limit_amount > 0 ? budget.spent_amount / budget.limit_amount : 0;
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

        <Pressable onPress={() => router.push({ pathname: '/(tabs)/shared', params: { from: 'index' } })} className="mb-7 active:opacity-90">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-pill bg-secondary/15 items-center justify-center mr-2.5">
                <Users size={16} color="#A87317" />
              </View>
              <Text className="font-display text-lg text-ink">Friends & Debts</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="font-body-semibold text-xs text-primary mr-1">Manage</Text>
              <ChevronRight size={17} color="#6B7370" />
            </View>
          </View>
          <View className="flex-row bg-surface border border-border rounded-lg p-4">
            <View className="flex-1">
              <Text className="font-body text-xs text-ink-muted">Friends owe you</Text>
              <AmountText amount={totalOwedToMe} type="income" size="md" showSign className="mt-1" />
            </View>
            <View className="w-px bg-border my-1" />
            <View className="flex-1 pl-4 items-end">
              <Text className="font-body text-xs text-ink-muted">You owe friends</Text>
              <AmountText amount={totalIOwe} type="expense" size="md" showSign className="mt-1" />
            </View>
          </View>
        </Pressable>

        <View>
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="font-display text-lg text-ink">Recent activity</Text>
              <Text className="font-body text-xs text-ink-muted mt-0.5">Your latest money moves</Text>
            </View>
            <Pressable onPress={() => router.push('/activity')} className="flex-row items-center">
              <Text className="font-body-semibold text-xs text-primary mr-1">See all</Text>
              <ChevronRight size={15} color="#1E3D3C" />
            </Pressable>
          </View>
          <View className="bg-surface border border-border rounded-lg px-4">
            {recentTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onPress={(tx) =>
                  router.push({
                    pathname: '/modal/edit-transaction',
                    params: { id: tx.id },
                  })
                }
                className={index < recentTransactions.length - 1 ? 'border-b border-border' : ''}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
