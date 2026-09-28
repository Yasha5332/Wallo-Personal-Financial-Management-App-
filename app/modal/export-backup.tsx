import React, { useState, useMemo } from 'react';
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
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  X,
  FileSpreadsheet,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Copy,
} from 'lucide-react-native';
import {
  generateTransactionsCSV,
  exportTransactionsToCSV,
} from '../../lib/utils/csv-export';

type ScopeOption = 'all' | 'month' | 'pay_period';

export default function ExportBackupModal() {
  const { transactions, payPeriod } = useFinance();
  const { currency, formatCurrency } = useCurrency();

  const [selectedScope, setSelectedScope] = useState<ScopeOption>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Filter transactions based on selected scope
  const targetTransactions = useMemo(() => {
    if (selectedScope === 'all') {
      return transactions;
    }

    const now = new Date();

    if (selectedScope === 'month') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      return transactions.filter((t) => {
        const rawDate = (t as any).date || (t as any).transacted_at || (t as any).created_at;
        if (!rawDate) return false;
        const d = new Date(rawDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    }

    if (selectedScope === 'pay_period' && payPeriod) {
      const startMs = new Date(payPeriod.start_date).getTime();
      const endMs = new Date(payPeriod.end_date).getTime();
      return transactions.filter((t) => {
        const rawDate = (t as any).date || (t as any).transacted_at || (t as any).created_at;
        if (!rawDate) return false;
        const dMs = new Date(rawDate).getTime();
        return dMs >= startMs && dMs <= endMs;
      });
    }

    return transactions;
  }, [transactions, selectedScope, payPeriod]);

  // Aggregate metrics
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    targetTransactions.forEach((t) => {
      const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
      }
    });
    return {
      count: targetTransactions.length,
      income,
      expense,
      net: income - expense,
    };
  }, [targetTransactions]);

  // Generate preview of CSV
  const csvPreview = useMemo(() => {
    return generateTransactionsCSV(targetTransactions.slice(0, 5), currency.code);
  }, [targetTransactions, currency.code]);

  const handleExport = async () => {
    if (targetTransactions.length === 0) {
      const msg = 'No transactions available to export in this selected range.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('No Records', msg);
      }
      return;
    }

    try {
      setIsExporting(true);
      setExportFeedback(null);

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `wallo_backup_${selectedScope}_${dateStr}.csv`;

      const result = await exportTransactionsToCSV({
        transactions: targetTransactions,
        currencyCode: currency.code,
        filename,
      });

      if (result.success) {
        const successMessage =
          Platform.OS === 'web'
            ? `Downloaded ${result.filename} (${result.count} entries)`
            : `Shared ${result.count} transactions in CSV format`;
        setExportFeedback(successMessage);

        if (Platform.OS === 'web') {
          setTimeout(() => {
            setExportFeedback(null);
          }, 5000);
        }
      } else {
        const errMessage = result.error || 'Failed to export CSV file.';
        if (Platform.OS === 'web') {
          alert(`Export failed: ${errMessage}`);
        } else {
          Alert.alert('Export Failed', errMessage);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during export.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPreview = () => {
    const fullCSV = generateTransactionsCSV(targetTransactions, currency.code);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullCSV).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-border bg-surface">
        <View>
          <Text className="font-display text-xl text-ink">Export & Backup</Text>
          <Text className="font-body text-xs text-ink-muted mt-0.5">
            Real CSV export for spreadsheets & backup
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-alt items-center justify-center active:bg-border/60"
          hitSlop={8}
          accessibilityLabel="Close export modal"
        >
          <X size={18} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Banner */}
        {exportFeedback && (
          <View className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex-row items-center">
            <CheckCircle2 size={18} color="#059669" />
            <Text className="font-body-medium text-xs text-emerald-800 ml-2.5 flex-1">
              {exportFeedback}
            </Text>
          </View>
        )}

        {/* Scope Selector */}
        <View className="mb-5">
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-2.5">
            Export Scope
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedScope('all')}
              className={`flex-1 p-3 rounded-2xl border ${
                selectedScope === 'all'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface border-border active:bg-surface-alt'
              }`}
            >
              <Layers
                size={16}
                color={selectedScope === 'all' ? '#1E3D3C' : '#64748B'}
              />
              <Text
                className={`font-body-bold text-xs mt-1.5 ${
                  selectedScope === 'all' ? 'text-primary' : 'text-ink'
                }`}
              >
                All Time
              </Text>
              <Text className="font-body text-[11px] text-ink-muted mt-0.5">
                {transactions.length} entries
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedScope('month')}
              className={`flex-1 p-3 rounded-2xl border ${
                selectedScope === 'month'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface border-border active:bg-surface-alt'
              }`}
            >
              <Calendar
                size={16}
                color={selectedScope === 'month' ? '#1E3D3C' : '#64748B'}
              />
              <Text
                className={`font-body-bold text-xs mt-1.5 ${
                  selectedScope === 'month' ? 'text-primary' : 'text-ink'
                }`}
              >
                This Month
              </Text>
              <Text className="font-body text-[11px] text-ink-muted mt-0.5">
                {new Date().toLocaleString('default', { month: 'short' })}
              </Text>
            </Pressable>

            {payPeriod && (
              <Pressable
                onPress={() => setSelectedScope('pay_period')}
                className={`flex-1 p-3 rounded-2xl border ${
                  selectedScope === 'pay_period'
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface border-border active:bg-surface-alt'
                }`}
              >
                <FileSpreadsheet
                  size={16}
                  color={selectedScope === 'pay_period' ? '#1E3D3C' : '#64748B'}
                />
                <Text
                  className={`font-body-bold text-xs mt-1.5 ${
                    selectedScope === 'pay_period' ? 'text-primary' : 'text-ink'
                  }`}
                  numberOfLines={1}
                >
                  Pay Period
                </Text>
                <Text className="font-body text-[11px] text-ink-muted mt-0.5" numberOfLines={1}>
                  Current cycle
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Selected Data Summary Card */}
        <Card className="mb-5">
          <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-border">
            <View>
              <Text className="font-body-bold text-sm text-ink">Selected Export Summary</Text>
              <Text className="font-body text-xs text-ink-muted">
                {stats.count} transactions ready for CSV export
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-full bg-surface-alt border border-border">
              <Text className="font-body-bold text-xs text-primary">{currency.code}</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-surface-alt rounded-xl p-2.5">
              <View className="flex-row items-center mb-1">
                <ArrowDownLeft size={13} color="#059669" />
                <Text className="font-body text-[10px] text-ink-muted ml-1">Income</Text>
              </View>
              <Text className="font-body-bold text-xs text-emerald-600">
                {formatCurrency(stats.income)}
              </Text>
            </View>

            <View className="flex-1 bg-surface-alt rounded-xl p-2.5">
              <View className="flex-row items-center mb-1">
                <ArrowUpRight size={13} color="#E11D48" />
                <Text className="font-body text-[10px] text-ink-muted ml-1">Expenses</Text>
              </View>
              <Text className="font-body-bold text-xs text-rose-600">
                {formatCurrency(stats.expense)}
              </Text>
            </View>

            <View className="flex-1 bg-surface-alt rounded-xl p-2.5">
              <Text className="font-body text-[10px] text-ink-muted mb-1">Net Flow</Text>
              <Text
                className={`font-body-bold text-xs ${
                  stats.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatCurrency(stats.net)}
              </Text>
            </View>
          </View>
        </Card>

        {/* CSV Format Schema Info */}
        <Card className="mb-5">
          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center mr-3 mt-0.5">
              <Info size={16} color="#0D9488" />
            </View>
            <View className="flex-1">
              <Text className="font-body-bold text-xs text-ink mb-1">
                Formatted CSV Schema
              </Text>
              <Text className="font-body text-[11px] text-ink-muted leading-4">
                Exports standard 7-column header formatted for Excel, Google Sheets, and Numbers:
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mt-2">
                {['Date', 'Title', 'Category', 'Type', 'Amount', 'Currency', 'Note'].map((col) => (
                  <View key={col} className="bg-surface-alt px-2 py-0.5 rounded-md border border-border">
                    <Text className="font-body-medium text-[10px] text-ink">{col}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* CSV Data Preview */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted">
              CSV Preview ({Math.min(5, targetTransactions.length)} of {targetTransactions.length} rows)
            </Text>
            {Platform.OS === 'web' && (
              <Pressable
                onPress={handleCopyPreview}
                className="flex-row items-center active:opacity-70"
                hitSlop={6}
              >
                <Copy size={12} color={copied ? '#059669' : '#64748B'} />
                <Text className="font-body text-[11px] text-ink-muted ml-1">
                  {copied ? 'Copied full CSV!' : 'Copy full CSV'}
                </Text>
              </Pressable>
            )}
          </View>
          <View className="bg-slate-900 rounded-2xl p-3.5 shadow-sm">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text
                className="text-[11px] text-emerald-400 font-mono leading-5"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
              >
                {csvPreview || 'No rows to display'}
              </Text>
            </ScrollView>
          </View>
        </View>

        {/* Main Action Button */}
        <Button
          title={
            isExporting
              ? 'Generating CSV...'
              : Platform.OS === 'web'
              ? `Download CSV (${stats.count} items)`
              : `Share / Save CSV (${stats.count} items)`
          }
          icon={
            isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : Platform.OS === 'web' ? (
              <Download size={18} color="#FFFFFF" />
            ) : (
              <Share2 size={18} color="#FFFFFF" />
            )
          }
          onPress={handleExport}
          disabled={isExporting || stats.count === 0}
          size="lg"
          className="w-full"
        />

        <Text className="font-body text-[11px] text-ink-muted text-center mt-3">
          {Platform.OS === 'web'
            ? 'Direct blob download starts immediately in your browser.'
            : 'Opens native share sheet for AirDrop, Save to Files, or messaging.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
