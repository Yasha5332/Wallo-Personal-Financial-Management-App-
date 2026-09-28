import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../../components/ui/Card';
import {
  Users,
  ChevronRight,
  Calendar,
  PiggyBank,
  Download,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
  LogOut,
  Mail,
  Sparkles,
  Globe,
  Share2,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react-native';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { CurrencyCard } from '../../components/currency/CurrencyCard';
import { exportTransactionsToCSV } from '../../lib/utils/csv-export';

const LAST_BACKUP_STORAGE_KEY = '@wallo:last_csv_backup';

export default function MoreScreen() {
  const { profile, user, isDemoMode, signOut } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  const {
    balance,
    debtBalances,
    members,
    transactions,
    resetPayPeriod,
    payPeriod,
    dailyBudgetStats,
  } = useFinance();

  const [exported, setExported] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // Load last backup timestamp from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(LAST_BACKUP_STORAGE_KEY)
      .then((val) => {
        if (val) setLastBackupDate(val);
      })
      .catch(() => {});
  }, []);

  const totalOwedToMe = debtBalances
    .filter((debt) => debt.toMemberId === 'user_1')
    .reduce((total, debt) => total + debt.amount, 0);
  const totalIOwe = debtBalances
    .filter((debt) => debt.fromMemberId === 'user_1')
    .reduce((total, debt) => total + debt.amount, 0);

  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      const msg = 'No transactions recorded yet to export.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('No Transactions', msg);
      }
      return;
    }

    try {
      setIsExporting(true);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `wallo_transactions_${dateStr}.csv`;

      const result = await exportTransactionsToCSV({
        transactions,
        currencyCode: currency.code,
        filename,
      });

      if (result.success) {
        setExported(true);
        const timestamp = new Date().toISOString();
        setLastBackupDate(timestamp);
        await AsyncStorage.setItem(LAST_BACKUP_STORAGE_KEY, timestamp);

        const successMessage =
          Platform.OS === 'web'
            ? `Exported ${result.count} transactions to ${result.filename}.`
            : `Shared ${result.count} transactions in CSV format.`;

        if (Platform.OS === 'web') {
          // Subtle notification on web since browser download bar activates
        } else {
          // On mobile expo-sharing opens native share sheet
        }

        setTimeout(() => setExported(false), 4000);
      } else {
        const errorMsg = result.error || 'Failed to generate CSV export.';
        if (Platform.OS === 'web') {
          alert(errorMsg);
        } else {
          Alert.alert('Export Error', errorMsg);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during CSV export.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Export Error', msg);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetPlan = () => {
    const confirmMessage = 'Reset your current pay period and daily budget calculation to default?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        resetPayPeriod();
      }
    } else {
      Alert.alert('Reset Pay Period', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetPayPeriod() },
      ]);
    }
  };

  const handleSignOut = () => {
    const confirmSignOut = async () => {
      await signOut();
      router.replace('/(auth)/sign-in');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        confirmSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of Wallo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: confirmSignOut },
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="font-display text-2xl text-ink">Settings</Text>
          <Text className="font-body text-xs text-ink-muted mt-0.5">Preferences, currency, shared living, and data</Text>
        </View>

        {/* Profile Snapshot Card */}
        <Card className="mb-6">
          <View className="flex-row items-center">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{
                backgroundColor: '#1E3D3C',
                shadowColor: '#16202A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="font-display-bold text-xl text-white">
                {profile?.name?.slice(0, 1)?.toUpperCase() ?? user?.email?.slice(0, 1)?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center flex-wrap gap-2">
                <Text className="font-display text-lg text-ink">
                  {profile?.name || user?.user_metadata?.name || 'Wallo User'}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${isDemoMode ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  <Text className={`font-body-semibold text-[10px] ${isDemoMode ? 'text-amber-800' : 'text-emerald-800'}`}>
                    {isDemoMode ? 'Demo Mode' : 'Supabase Cloud'}
                  </Text>
                </View>
              </View>
              <Text className="font-body text-xs text-ink-muted mt-0.5">
                {user?.email ?? 'Offline demo session'}
              </Text>
              <Text className="font-body text-[11px] text-ink-muted/80 mt-1">
                Balance: {formatCurrency(balance)} · {payPeriod?.name ?? 'Pay Period'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Currency & Regional Formatting */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted">
              Display Currency
            </Text>
            <Text className="font-body text-xs text-ink-muted">
              App-wide conversion
            </Text>
          </View>
          <CurrencyCard onPress={() => router.push('/modal/currency-picker')} />
        </View>

        {/* Shared Expenses & members */}
        <View className="mb-6">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Friends & Shared Balances
          </Text>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/shared', params: { from: 'more' } })} className="active:opacity-85">
            <Card>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-secondary/15 items-center justify-center mr-3">
                    <Users size={20} color="#A87317" />
                  </View>
                  <View>
                    <Text className="font-body-bold text-sm text-ink">Friends & Debts</Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {Math.max(0, members.length - 1)} connected friends · who owes whom
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </View>

              {/* Debt Status Summary */}
              <View className="flex-row bg-surface-alt rounded-2xl p-3 mt-1">
                <View className="flex-1">
                  <Text className="font-body text-[11px] text-ink-muted">Friends owe you</Text>
                  <Text className="font-body-bold text-sm text-emerald-600 mt-0.5">
                    {formatCurrency(totalOwedToMe)}
                  </Text>
                </View>
                <View className="w-px bg-border my-0.5 mx-2" />
                <View className="flex-1 items-end">
                  <Text className="font-body text-[11px] text-ink-muted">You owe friends</Text>
                  <Text className="font-body-bold text-sm text-rose-600 mt-0.5">
                    {formatCurrency(totalIOwe)}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Planning & Pay Period */}
        <View className="mb-6">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Budgeting & Goals
          </Text>
          <Card className="p-2">
            <Pressable
              onPress={() => router.push('/modal/edit-pay-period')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-xl bg-secondary/15 items-center justify-center mr-3">
                    <Calendar size={18} color="#A87317" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-ink">Pay Period & Daily Limit</Text>
                  <Text className="font-body text-xs text-ink-muted">
                    {formatCurrency(dailyBudgetStats?.dailyLimit ?? 0)}/day · {dailyBudgetStats?.daysRemaining ?? 0} days left
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View className="h-px bg-border mx-3" />

            <Pressable
              onPress={() => router.push('/goals')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3">
                    <PiggyBank size={18} color="#1E3D3C" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-ink">Savings Goals & Vaults</Text>
                  <Text className="font-body text-xs text-ink-muted">Target savings for this period</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>
          </Card>
        </View>

        {/* Data & Actions */}
        <View className="mb-6">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Data & Management
          </Text>
          <Card className="p-2">
            {/* Quick 1-Tap CSV Export */}
            <Pressable
              onPress={handleExportCSV}
              disabled={isExporting}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mr-3">
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : exported ? (
                    <CheckCircle2 size={18} color="#059669" />
                  ) : (
                    <FileSpreadsheet size={18} color="#059669" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-body-medium text-sm text-ink">Export Transactions (CSV)</Text>
                    {exported && (
                      <View className="ml-2 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        <Text className="font-body-semibold text-[10px] text-emerald-800">Done!</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-body text-xs text-ink-muted">
                    {isExporting
                      ? 'Generating CSV file...'
                      : exported
                      ? Platform.OS === 'web'
                        ? 'Download started in browser'
                        : 'Share sheet opened'
                      : lastBackupDate
                      ? `Last backup: ${new Date(lastBackupDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })} · ${transactions.length} entries`
                      : `${transactions.length} entries ready to export`}
                  </Text>
                </View>
              </View>
              {Platform.OS === 'web' ? (
                <Download size={16} color="#059669" />
              ) : (
                <Share2 size={16} color="#059669" />
              )}
            </Pressable>

            <View className="h-px bg-border mx-3" />

            {/* Detailed Export & Scope Options */}
            <Pressable
              onPress={() => router.push('/modal/export-backup')}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-teal-50 items-center justify-center mr-3">
                  <SlidersHorizontal size={18} color="#0D9488" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-ink">Backup & Scope Options</Text>
                  <Text className="font-body text-xs text-ink-muted">Filter by date, preview schema & copy</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>

            <View className="h-px bg-border mx-3" />

            <Pressable
              onPress={handleResetPlan}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-surface-alt"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center mr-3">
                  <RotateCcw size={18} color="#E11D48" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-rose-600">Reset Pay Period</Text>
                  <Text className="font-body text-xs text-ink-muted">Reset income and fixed cost baseline</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>
          </Card>
        </View>

        {/* Account & Session */}
        <View className="mb-6">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Account & Session
          </Text>
          <Card>
            <Pressable
              onPress={handleSignOut}
              className="flex-row items-center justify-between p-3 rounded-2xl active:bg-rose-50"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center mr-3">
                  <LogOut size={18} color="#E11D48" />
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-rose-600">Sign Out</Text>
                  <Text className="font-body text-xs text-ink-muted">
                    {isDemoMode ? 'Exit demo mode' : `Signed in as ${user?.email ?? 'User'}`}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </Pressable>
          </Card>
        </View>

        {/* App Info */}
        <View className="items-center mt-3 mb-6">
          <BrandLogo size={44} style={{ marginBottom: 10 }} />
          <View className="flex-row items-center mb-1">
            <ShieldCheck size={14} color="#E3A335" />
            <Text className="font-body-semibold text-xs text-ink-muted ml-1.5">Wallo Finance v1.0</Text>
          </View>
          <Text className="font-body text-[11px] text-ink-muted/70">
            Offline-first student budgeting & expense split
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

