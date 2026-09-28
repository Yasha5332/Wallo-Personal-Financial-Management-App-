import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import { getCurrencyConfig } from '../../lib/utils/currency';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Users,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Building,
  X,
  Divide,
  Receipt,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Utensils,
  Coffee,
  Car,
  Zap,
  Check,
  Search,
  ArrowRight,
  HandCoins,
  Sparkles,
  Trash2,
  Wifi,
  Flame,
  Home,
  SlidersHorizontal,
} from 'lucide-react-native';
import type { ExpenseCategory } from '../../lib/models/transaction.model';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const FRIEND_PALETTE = [
  '#1E3D3C', // Deep ink-teal
  '#2F8F6B', // Emerald
  '#E3A335', // Warm Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#E2604F', // Coral
  '#0D9488', // Teal
  '#EC4899', // Pink
];

const SPLIT_PRESETS: { title: string; category: ExpenseCategory; emoji: string }[] = [
  { title: 'Dinner & Food', category: 'food', emoji: '🍔' },
  { title: 'Drinks & Coffee', category: 'food', emoji: '☕' },
  { title: 'Groceries', category: 'groceries', emoji: '🛒' },
  { title: 'Taxi & Rides', category: 'transport', emoji: '🚗' },
  { title: 'Movie & Fun', category: 'entertainment', emoji: '🎬' },
  { title: 'General Bill', category: 'bills', emoji: '🧾' },
];

export default function SharedScreen() {
  const { user } = useAuth();
  const {
    members,
    sharedExpenses,
    debtBalances,
    addSharedExpense,
    settleDebt,
    addMember,
    removeMember,
  } = useFinance();
  const { formatCurrency, currency, currencyCode, baseCurrencyCode, convert } = useCurrency();

  // Find current user's member representation
  const currentMember = useMemo(() => {
    return (
      members.find((m) => user && m.user_id === user.id) ||
      members.find((m) => m.id === 'user_1') ||
      members[0]
    );
  }, [members, user]);
  const currentMemberId = currentMember?.id || 'user_1';

  // Navigation origin
  const { from } = useLocalSearchParams<{ from?: string }>();

  const handleBack = useCallback(() => {
    if (from === 'more') {
      router.replace('/(tabs)/more');
    } else if (from === 'index') {
      router.replace('/(tabs)');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  }, [from]);

  // Active view tab: 'friends' | 'rent'
  const [activeTab, setActiveTab] = useState<'friends' | 'rent'>('friends');

  // Search & Filter
  const [friendSearch, setFriendSearch] = useState('');

  // Modals state
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [settleTargetFriendId, setSettleTargetFriendId] = useState<string | null>(null);

  // Settle Modal State
  const [settleAmountInput, setSettleAmountInput] = useState('');
  const [settleError, setSettleError] = useState('');

  // Add Friend state
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendColor, setNewFriendColor] = useState(FRIEND_PALETTE[0]);
  const [addFriendError, setAddFriendError] = useState('');

  // Helper to parse localized numeric input back to a float/int number
  const parseInputNumber = useCallback(
    (value: string, targetCode: string = currencyCode): number => {
      if (!value) return 0;
      const targetConfig = getCurrencyConfig(targetCode);
      let clean = value.trim();
      if (targetConfig.decimalSeparator === ',') {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
      clean = clean.replace(/[^0-9.-]/g, '');
      const n = parseFloat(clean);
      return isNaN(n) ? 0 : n;
    },
    [currencyCode]
  );

  // Helper to format a base currency (USD) amount as input string for current currencyCode with thousand grouping
  const formatForInput = useCallback(
    (amountInBase: number, targetCode: string = currencyCode): string => {
      const converted = convert(amountInBase, baseCurrencyCode, targetCode);
      const targetConfig = getCurrencyConfig(targetCode);
      if (targetConfig.decimals === 0) {
        const rounded = Math.round(converted);
        return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, targetConfig.thousandsSeparator);
      }
      const [intPart, decPart] = converted.toFixed(targetConfig.decimals).split('.');
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, targetConfig.thousandsSeparator);
      return decPart ? `${formattedInt}${targetConfig.decimalSeparator}${decPart}` : formattedInt;
    },
    [convert, baseCurrencyCode, currencyCode]
  );

  // Helper to format numeric input strings live as the user types
  const handleNumberInputChange = useCallback(
    (text: string, setter: (val: string) => void) => {
      const targetConfig = getCurrencyConfig(currencyCode);
      if (targetConfig.decimals === 0) {
        const digitsOnly = text.replace(/\D/g, '');
        if (!digitsOnly) {
          setter('');
          return;
        }
        const formatted = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, targetConfig.thousandsSeparator);
        setter(formatted);
      } else {
        const clean = text.replace(/[^0-9.]/g, '');
        setter(clean);
      }
    },
    [currencyCode]
  );

  // Canonical base rent amounts in USD (the platform's canonical base currency)
  const [baseRentUSD, setBaseRentUSD] = useState<number>(1260);
  const [utilitiesUSD, setUtilitiesUSD] = useState<number>(180);
  const [internetUSD, setInternetUSD] = useState<number>(60);
  const [totalRentUSD, setTotalRentUSD] = useState<number>(1500);

  // Universal Split Expense state
  const [expenseTitle, setExpenseTitle] = useState('Dinner & Food');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('food');
  const [expenseAmountUSD, setExpenseAmountUSD] = useState<number>(60);
  const [expenseAmount, setExpenseAmount] = useState(() => formatForInput(60, currencyCode));
  const [payerId, setPayerId] = useState<string>(currentMemberId);
  const [selectedSplitMemberIds, setSelectedSplitMemberIds] = useState<string[]>(
    members.map((m) => m.id)
  );
  const [splitError, setSplitError] = useState('');

  // Rent Modal state in current active currency
  const [calcMode, setCalcMode] = useState<'total' | 'itemized'>('itemized');
  const [rentAmount, setRentAmount] = useState(() => formatForInput(1500, currencyCode));
  const [baseRent, setBaseRent] = useState(() => formatForInput(1260, currencyCode));
  const [utilities, setUtilities] = useState(() => formatForInput(180, currencyCode));
  const [internet, setInternet] = useState(() => formatForInput(60, currencyCode));
  const [paidById, setPaidById] = useState<string>(currentMemberId);
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });
  const [rentTitle, setRentTitle] = useState(`${currentMonthName} Apartment Rent`);
  const [rentError, setRentError] = useState('');

  // Automatically sync modal text inputs when the active currency changes
  useEffect(() => {
    setBaseRent(formatForInput(baseRentUSD, currencyCode));
    setUtilities(formatForInput(utilitiesUSD, currencyCode));
    setInternet(formatForInput(internetUSD, currencyCode));
    setRentAmount(formatForInput(totalRentUSD, currencyCode));
    setExpenseAmount(formatForInput(expenseAmountUSD, currencyCode));
  }, [currencyCode, baseRentUSD, utilitiesUSD, internetUSD, totalRentUSD, expenseAmountUSD, formatForInput]);

  // Toast / feedback message
  const [successMsg, setSuccessMsg] = useState('');

  // Filter friends (everyone except logged-in user)
  const friends = useMemo(() => members.filter((m) => m.id !== currentMemberId), [members, currentMemberId]);

  // Compute friend-by-friend balances with currentMemberId
  const friendBalances = useMemo(() => {
    return friends.map((friend) => {
      const owedToMe = debtBalances
        .filter((d) => d.fromMemberId === friend.id && d.toMemberId === currentMemberId)
        .reduce((sum, d) => sum + d.amount, 0);

      const iOwe = debtBalances
        .filter((d) => d.fromMemberId === currentMemberId && d.toMemberId === friend.id)
        .reduce((sum, d) => sum + d.amount, 0);

      const net = owedToMe - iOwe;

      return {
        friend,
        owedToMe,
        iOwe,
        net,
        isSettled: Math.abs(net) < 0.01,
      };
    });
  }, [friends, debtBalances, currentMemberId]);

  // Overall totals
  const totalFriendsOweMe = useMemo(() => {
    return debtBalances
      .filter((d) => d.toMemberId === currentMemberId)
      .reduce((sum, d) => sum + d.amount, 0);
  }, [debtBalances, currentMemberId]);

  const totalIOweFriends = useMemo(() => {
    return debtBalances
      .filter((d) => d.fromMemberId === currentMemberId)
      .reduce((sum, d) => sum + d.amount, 0);
  }, [debtBalances, currentMemberId]);

  const overallNet = totalFriendsOweMe - totalIOweFriends;

  // Filtered friends by search
  const filteredFriendBalances = useMemo(() => {
    if (!friendSearch.trim()) return friendBalances;
    const q = friendSearch.toLowerCase().trim();
    return friendBalances.filter((fb) => fb.friend.display_name.toLowerCase().includes(q));
  }, [friendBalances, friendSearch]);

  // Sorted shared expenses
  const sortedExpenses = useMemo(() => {
    return [...sharedExpenses].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [sharedExpenses]);

  // Rent-specific shared expenses
  const rentExpenses = useMemo(() => {
    return sortedExpenses.filter((exp) => exp.category === 'bills');
  }, [sortedExpenses]);

  // Live calculation for Universal Split Modal
  const parsedExpenseAmount = parseFloat(expenseAmount) || 0;
  const splitMembersCount = selectedSplitMemberIds.length || 1;
  const perPersonExpenseShare =
    parsedExpenseAmount > 0 ? parseFloat((parsedExpenseAmount / splitMembersCount).toFixed(2)) : 0;

  // Canonical base total in USD (for main screen cards)
  const currentTotalRentUSD = useMemo(() => {
    if (calcMode === 'itemized') {
      return baseRentUSD + utilitiesUSD + internetUSD;
    }
    return totalRentUSD;
  }, [calcMode, baseRentUSD, utilitiesUSD, internetUSD, totalRentUSD]);

  const rentSplitCount = members.length || 3;
  const perPersonRentShareUSD =
    currentTotalRentUSD > 0 ? currentTotalRentUSD / rentSplitCount : 0;

  // In-modal live calculated amounts in current active currency
  const modalRentTotalInCurrency = useMemo(() => {
    if (calcMode === 'itemized') {
      const b = parseInputNumber(baseRent, currencyCode);
      const u = parseInputNumber(utilities, currencyCode);
      const i = parseInputNumber(internet, currencyCode);
      return b + u + i;
    }
    return parseInputNumber(rentAmount, currencyCode);
  }, [calcMode, baseRent, utilities, internet, rentAmount, parseInputNumber, currencyCode]);

  const modalPerPersonShareInCurrency =
    modalRentTotalInCurrency > 0 ? modalRentTotalInCurrency / rentSplitCount : 0;

  // Target friend for Settle Modal
  const settleTarget = useMemo(() => {
    if (!settleTargetFriendId) return null;
    return friendBalances.find((fb) => fb.friend.id === settleTargetFriendId) || null;
  }, [settleTargetFriendId, friendBalances]);

  // Handlers
  const handleAddFriend = async () => {
    const trimmed = newFriendName.trim();
    if (!trimmed) {
      setAddFriendError('Please enter friend’s name');
      return;
    }
    if (members.some((m) => m.display_name.toLowerCase() === trimmed.toLowerCase())) {
      setAddFriendError('A friend with this name already exists');
      return;
    }

    const created = await addMember(trimmed, newFriendColor);
    setSuccessMsg(`Added ${created.display_name} to your friends circle!`);
    setNewFriendName('');
    setAddFriendError('');
    setShowAddFriendModal(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenSplitModalForFriend = (friendId?: string) => {
    if (friendId) {
      setSelectedSplitMemberIds([currentMemberId, friendId]);
    } else {
      setSelectedSplitMemberIds(members.map((m) => m.id));
    }
    setPayerId(currentMemberId);
    setSplitError('');
    setShowSplitModal(true);
  };

  const handleToggleSplitMember = (memberId: string) => {
    setSelectedSplitMemberIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleAddSplitExpense = () => {
    if (parsedExpenseAmount <= 0) {
      setSplitError('Please enter a valid amount.');
      return;
    }
    if (!expenseTitle.trim()) {
      setSplitError('Please enter a description for the expense.');
      return;
    }
    if (selectedSplitMemberIds.length === 0) {
      setSplitError('Select at least one person to split with.');
      return;
    }

    const amountInBaseCurrency =
      currencyCode !== baseCurrencyCode
        ? convert(parsedExpenseAmount, currencyCode, baseCurrencyCode)
        : parsedExpenseAmount;

    setExpenseAmountUSD(amountInBaseCurrency);

    addSharedExpense({
      group_id: currentMember?.group_id || 'grp_demo',
      title: expenseTitle.trim(),
      amount: amountInBaseCurrency,
      paid_by_member_id: payerId,
      split_member_ids: selectedSplitMemberIds,
      category: expenseCategory,
      is_settlement: false,
    });

    const payerName = payerId === currentMemberId ? 'You' : members.find((m) => m.id === payerId)?.display_name ?? 'Friend';
    setSuccessMsg(
      `Recorded "${expenseTitle.trim()}" (${formatCurrency(amountInBaseCurrency)}). Split ${selectedSplitMemberIds.length} ways (${formatCurrency(amountInBaseCurrency / selectedSplitMemberIds.length)} each). Paid by ${payerName}.`
    );
    setSplitError('');
    setShowSplitModal(false);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleOpenSettleForFriend = (friendId: string) => {
    const fb = friendBalances.find((item) => item.friend.id === friendId);
    if (!fb) return;
    const absNet = Math.abs(fb.net);
    setSettleTargetFriendId(friendId);
    setSettleAmountInput(absNet > 0 ? formatForInput(absNet, currencyCode) : '');
    setSettleError('');
  };

  const handleConfirmSettle = () => {
    if (!settleTarget) return;
    const amountInCurrency = parseFloat(settleAmountInput) || 0;
    if (amountInCurrency <= 0) {
      setSettleError('Please enter a valid settlement amount.');
      return;
    }

    const amountInBase =
      currencyCode !== baseCurrencyCode
        ? convert(amountInCurrency, currencyCode, baseCurrencyCode)
        : amountInCurrency;

    const absBalanceUSD = Math.abs(settleTarget.net);
    if (amountInBase > absBalanceUSD + 0.05) {
      setSettleError(`Amount exceeds outstanding balance (${formatCurrency(absBalanceUSD)}).`);
      return;
    }

    if (settleTarget.net > 0) {
      settleDebt({
        group_id: currentMember?.group_id || 'grp_demo',
        from_member_id: settleTarget.friend.id,
        to_member_id: currentMemberId,
        amount: amountInBase,
      });
      setSuccessMsg(`Recorded: ${settleTarget.friend.display_name} paid you ${formatCurrency(amountInBase)}!`);
    } else {
      settleDebt({
        group_id: currentMember?.group_id || 'grp_demo',
        from_member_id: currentMemberId,
        to_member_id: settleTarget.friend.id,
        amount: amountInBase,
      });
      setSuccessMsg(`Recorded: You paid ${settleTarget.friend.display_name} ${formatCurrency(amountInBase)}!`);
    }

    setSettleTargetFriendId(null);
    setSettleAmountInput('');
    setSettleError('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleAddRent = () => {
    if (modalRentTotalInCurrency <= 0) {
      setRentError('Please enter a valid rent amount.');
      return;
    }
    if (!rentTitle.trim()) {
      setRentError('Please enter a description for the rent.');
      return;
    }

    const amountInBaseCurrency =
      currencyCode !== baseCurrencyCode
        ? convert(modalRentTotalInCurrency, currencyCode, baseCurrencyCode)
        : modalRentTotalInCurrency;

    const bUSD =
      currencyCode !== baseCurrencyCode
        ? convert(parseInputNumber(baseRent, currencyCode), currencyCode, baseCurrencyCode)
        : parseInputNumber(baseRent, currencyCode);

    const uUSD =
      currencyCode !== baseCurrencyCode
        ? convert(parseInputNumber(utilities, currencyCode), currencyCode, baseCurrencyCode)
        : parseInputNumber(utilities, currencyCode);

    const iUSD =
      currencyCode !== baseCurrencyCode
        ? convert(parseInputNumber(internet, currencyCode), currencyCode, baseCurrencyCode)
        : parseInputNumber(internet, currencyCode);

    setBaseRentUSD(bUSD);
    setUtilitiesUSD(uUSD);
    setInternetUSD(iUSD);
    setTotalRentUSD(amountInBaseCurrency);

    const selectedPayer = members.find((r) => r.id === paidById) || members[0];

    addSharedExpense({
      group_id: currentMember?.group_id || 'grp_demo',
      title: rentTitle.trim(),
      amount: amountInBaseCurrency,
      paid_by_member_id: selectedPayer.id,
      split_member_ids: members.map((m) => m.id),
      category: 'bills',
      is_settlement: false,
    });

    const payerName = selectedPayer.id === currentMemberId ? 'You' : selectedPayer.display_name;
    setSuccessMsg(
      `Added! ${formatCurrency(amountInBaseCurrency)} split ${members.length} ways (${formatCurrency(amountInBaseCurrency / members.length)} / person). Paid by ${payerName}.`
    );
    setRentError('');
    setShowRentModal(false);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    const confirmMsg = `Remove ${friendName} from your circle? This friend has no outstanding balance.`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await removeMember(friendId);
        setSuccessMsg(`Removed ${friendName}`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } else {
      await removeMember(friendId);
      setSuccessMsg(`Removed ${friendName}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 175,
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Centered responsive container */}
        <View
          style={[
            { width: '100%' },
            Platform.OS === 'web' && { maxWidth: 620, marginHorizontal: 'auto' },
          ]}
        >
          {/* ── UNCLUTTERED HEADER BAR ────────────────────────────────────────── */}
          <View className="mb-4 mt-1">
            {/* Top Navigation & Action Row */}
            <View className="flex-row items-center justify-between mb-2.5">
              <Pressable
                onPress={handleBack}
                hitSlop={10}
                className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center active:bg-surface-alt shadow-xs"
                accessibilityLabel="Back"
              >
                <ArrowLeft size={19} color="#1C1F1D" />
              </Pressable>

              {/* Contextual top action button based on active tab */}
              {activeTab === 'friends' && (
                <Pressable
                  onPress={() => {
                    setAddFriendError('');
                    setNewFriendName('');
                    setShowAddFriendModal(true);
                  }}
                  className="flex-row items-center bg-surface border border-border px-3.5 py-2 rounded-xl active:bg-surface-alt shadow-xs"
                  accessibilityLabel="Add friend"
                >
                  <UserPlus size={15} color="#1C1F1D" />
                  <Text className="font-body-semibold text-xs text-ink ml-1.5">+ Friend</Text>
                </Pressable>
              )}

              {activeTab === 'rent' && (
                <Pressable
                  onPress={() => setShowRentModal(true)}
                  className="flex-row items-center bg-surface border border-border px-3.5 py-2 rounded-xl active:bg-surface-alt shadow-xs"
                  accessibilityLabel="Edit rent"
                >
                  <SlidersHorizontal size={14} color="#1C1F1D" />
                  <Text className="font-body-semibold text-xs text-ink ml-1.5">Edit Rent</Text>
                </Pressable>
              )}
            </View>

            {/* Clear, Full-Width Title and Subtitle */}
            <View>
              <Text className="font-display text-2xl text-ink">
                {activeTab === 'friends'
                  ? 'Friends & Debts'
                  : 'Rent & Household Bills'}
              </Text>
              <Text className="font-body text-xs text-ink-muted mt-0.5">
                {activeTab === 'friends'
                  ? 'Track pairwise balances, dining & casual expenses'
                  : 'Monthly apartment rent, utilities & roommate shares'}
              </Text>
            </View>
          </View>

          {/* Success Toast Banner */}
          {successMsg ? (
            <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-4 flex-row items-center shadow-xs">
              <CheckCircle2 size={18} color="#2F8F6B" />
              <Text className="font-body-medium text-xs text-emerald-900 ml-2.5 flex-1">
                {successMsg}
              </Text>
              <Pressable onPress={() => setSuccessMsg('')} hitSlop={8}>
                <X size={16} color="#2F8F6B" />
              </Pressable>
            </View>
          ) : null}

          {/* ── SEGMENTED CATEGORY TABS (2 Clean Tabs: Friends & Debts | Rent & Bills) ── */}
          <View className="flex-row bg-[#ECEEEC] p-1 rounded-2xl mb-4 border border-border/60">
            <Pressable
              onPress={() => setActiveTab('friends')}
              className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
                activeTab === 'friends' ? 'bg-surface shadow-xs border border-border/80' : 'active:bg-surface/50'
              }`}
            >
              <Users size={15} color={activeTab === 'friends' ? '#1E3D3C' : '#6B7370'} />
              <Text
                className={`text-xs ml-1.5 ${
                  activeTab === 'friends' ? 'font-body-bold text-primary' : 'font-body-medium text-ink-muted'
                }`}
              >
                Friends & Debts
              </Text>
              <View
                className={`ml-2 px-2 py-0.5 rounded-full ${
                  activeTab === 'friends' ? 'bg-primary/10' : 'bg-border'
                }`}
              >
                <Text
                  className={`text-[10px] font-body-semibold ${
                    activeTab === 'friends' ? 'text-primary' : 'text-ink-muted'
                  }`}
                >
                  {friends.length}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('rent')}
              className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
                activeTab === 'rent' ? 'bg-surface shadow-xs border border-border/80' : 'active:bg-surface/50'
              }`}
            >
              <Building size={15} color={activeTab === 'rent' ? '#1E3D3C' : '#6B7370'} />
              <Text
                className={`text-xs ml-1.5 ${
                  activeTab === 'rent' ? 'font-body-bold text-primary' : 'font-body-medium text-ink-muted'
                }`}
              >
                Rent & Household Bills
              </Text>
            </Pressable>
          </View>

          {/* ════════ CATEGORY 1: FRIENDS & DEBTS ══════════════════════════════ */}
          {activeTab === 'friends' && (
            <View>
              {/* Friends Hero Balance Card */}
              <Card className="mb-4 bg-surface border border-border/80 rounded-2xl p-5 shadow-xs">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-body-medium text-xs text-ink-muted uppercase tracking-wider">
                    Friend Balances
                  </Text>
                  <View className="w-8 h-8 rounded-full bg-secondary/15 items-center justify-center">
                    <Users size={16} color="#A87317" />
                  </View>
                </View>

                {/* Big Net Amount */}
                <View className="flex-row items-baseline mb-1">
                  <Text
                    className={`font-display-bold text-3xl ${
                      overallNet > 0.01
                        ? 'text-income'
                        : overallNet < -0.01
                        ? 'text-expense'
                        : 'text-ink'
                    }`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {overallNet > 0.01 ? '+' : ''}
                    {formatCurrency(overallNet)}
                  </Text>
                </View>

                <Text className="font-body text-xs text-ink-muted mb-4">
                  {overallNet > 0.01
                    ? `Friends owe you ${formatCurrency(overallNet)} in total`
                    : overallNet < -0.01
                    ? `You owe friends ${formatCurrency(Math.abs(overallNet))} in total`
                    : 'All friend debts are currently settled up'}
                </Text>

                {/* Breakdown Dual Metric Cards */}
                <View className="flex-row gap-2.5 mb-4">
                  <View className="flex-1 bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/60">
                    <View className="flex-row items-center mb-1">
                      <View className="w-4 h-4 rounded-full bg-emerald-200/80 items-center justify-center mr-1.5">
                        <ArrowDownLeft size={11} color="#15803D" strokeWidth={2.5} />
                      </View>
                      <Text className="font-body-medium text-[11px] text-emerald-900">Friends owe you</Text>
                    </View>
                    <Text
                      className="font-display-bold text-base text-income"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {formatCurrency(totalFriendsOweMe)}
                    </Text>
                  </View>

                  <View className="flex-1 bg-rose-50/70 rounded-xl p-3 border border-rose-200/60">
                    <View className="flex-row items-center mb-1">
                      <View className="w-4 h-4 rounded-full bg-rose-200/80 items-center justify-center mr-1.5">
                        <ArrowUpRight size={11} color="#BE123C" strokeWidth={2.5} />
                      </View>
                      <Text className="font-body-medium text-[11px] text-rose-900">You owe friends</Text>
                    </View>
                    <Text
                      className="font-display-bold text-base text-expense"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {formatCurrency(totalIOweFriends)}
                    </Text>
                  </View>
                </View>

                {/* Quick Action Buttons */}
                <View className="flex-row gap-2 pt-1">
                  <Pressable
                    onPress={() => handleOpenSplitModalForFriend()}
                    className="flex-1 flex-row items-center justify-center bg-primary py-2.5 px-3 rounded-xl active:bg-primary-pressed"
                  >
                    <Plus size={15} color="#FFFFFF" strokeWidth={2.2} />
                    <Text className="font-body-semibold text-xs text-surface ml-1.5">Split a Bill</Text>
                  </Pressable>

                  {debtBalances.length > 0 && (
                    <Pressable
                      onPress={() => router.push('/modal/settle-up')}
                      className="flex-1 flex-row items-center justify-center bg-secondary/15 border border-secondary/30 py-2.5 px-3 rounded-xl active:bg-secondary/25"
                    >
                      <HandCoins size={15} color="#A87317" />
                      <Text className="font-body-semibold text-xs text-secondary-dark ml-1.5">Settle Up</Text>
                    </Pressable>
                  )}
                </View>
              </Card>

              {/* Search Bar (if friends > 2) */}
              {friends.length > 2 && (
                <View className="flex-row items-center bg-surface border border-border rounded-xl px-3 h-10 mb-3">
                  <Search size={16} color="#6B7370" />
                  <TextInput
                    value={friendSearch}
                    onChangeText={setFriendSearch}
                    placeholder="Search friends by name..."
                    placeholderTextColor="#8A928E"
                    className="flex-1 ml-2 font-body text-xs text-ink"
                  />
                  {friendSearch.length > 0 && (
                    <Pressable onPress={() => setFriendSearch('')} hitSlop={8}>
                      <X size={14} color="#6B7370" />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Friends List Header */}
              <View className="flex-row items-center justify-between mb-3 px-0.5">
                <Text className="font-display text-base text-ink">
                  Connected Friends ({filteredFriendBalances.length})
                </Text>
                <Pressable
                  onPress={() => {
                    setAddFriendError('');
                    setNewFriendName('');
                    setShowAddFriendModal(true);
                  }}
                  className="flex-row items-center"
                >
                  <Plus size={14} color="#1E3D3C" />
                  <Text className="font-body-semibold text-xs text-primary ml-0.5">Add friend</Text>
                </Pressable>
              </View>

              {/* Friends List */}
              {filteredFriendBalances.length === 0 ? (
                <Card className="items-center py-8 bg-surface border border-border rounded-2xl">
                  <View className="w-14 h-14 rounded-full bg-surface-alt items-center justify-center mb-3">
                    <Users size={26} color="#6B7370" />
                  </View>
                  <Text className="font-display text-base text-ink mb-1">
                    {friendSearch ? 'No friends found' : 'No friends connected yet'}
                  </Text>
                  <Text className="font-body text-xs text-ink-muted text-center px-6 mb-4 leading-5">
                    {friendSearch
                      ? `No friend matches "${friendSearch}". Clear your search to see all.`
                      : 'Add friends to track who owes whom for dinners, drinks, groceries, and casual expenses.'}
                  </Text>
                  {!friendSearch && (
                    <Button
                      label="+ Add Your First Friend"
                      onPress={() => setShowAddFriendModal(true)}
                    />
                  )}
                </Card>
              ) : (
                filteredFriendBalances.map(({ friend, net, isSettled }) => {
                  const theyOweMe = net > 0.01;
                  const iOweThem = net < -0.01;

                  return (
                    <Card
                      key={friend.id}
                      className="mb-2.5 bg-surface border border-border/80 rounded-2xl p-4 shadow-xs"
                    >
                      <View className="flex-row items-center justify-between">
                        {/* Avatar & Name Info */}
                        <View className="flex-row items-center flex-1 mr-3 min-w-0">
                          <View
                            className="w-12 h-12 rounded-full items-center justify-center mr-3 flex-shrink-0 border-2 border-white shadow-xs"
                            style={{ backgroundColor: friend.avatar_color }}
                          >
                            <Text className="font-display-bold text-sm text-white">
                              {getInitials(friend.display_name)}
                            </Text>
                          </View>

                          <View className="flex-1 min-w-0">
                            <Text
                              className="font-body-bold text-sm text-ink truncate"
                              numberOfLines={1}
                            >
                              {friend.display_name}
                            </Text>

                            <View className="flex-row items-center mt-1">
                              {theyOweMe ? (
                                <View className="flex-row items-center bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  <ArrowDownLeft size={11} color="#2F8F6B" strokeWidth={2.5} />
                                  <Text className="font-body-semibold text-[11px] text-emerald-800 ml-1">
                                    Owes you
                                  </Text>
                                </View>
                              ) : iOweThem ? (
                                <View className="flex-row items-center bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                  <ArrowUpRight size={11} color="#E2604F" strokeWidth={2.5} />
                                  <Text className="font-body-semibold text-[11px] text-rose-800 ml-1">
                                    You owe
                                  </Text>
                                </View>
                              ) : (
                                <View className="flex-row items-center bg-surface-alt border border-border px-2 py-0.5 rounded-md">
                                  <CheckCircle2 size={11} color="#6B7370" />
                                  <Text className="font-body-medium text-[11px] text-ink-muted ml-1">
                                    Settled up
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Balance Amount & Action Buttons */}
                        <View className="items-end flex-shrink-0">
                          <Text
                            className={`font-display-bold text-base mb-2 ${
                              theyOweMe
                                ? 'text-income'
                                : iOweThem
                                ? 'text-expense'
                                : 'text-ink-muted'
                            }`}
                            style={{ fontVariant: ['tabular-nums'] }}
                          >
                            {theyOweMe
                              ? `+${formatCurrency(net)}`
                              : iOweThem
                              ? `-${formatCurrency(Math.abs(net))}`
                              : formatCurrency(0)}
                          </Text>

                          <View className="flex-row items-center" style={{ gap: 6 }}>
                            {theyOweMe && (
                              <Pressable
                                onPress={() => handleOpenSettleForFriend(friend.id)}
                                className="bg-income px-3 py-1.5 rounded-lg active:opacity-90 shadow-xs flex-row items-center"
                              >
                                <HandCoins size={12} color="#FFFFFF" />
                                <Text className="font-body-semibold text-xs text-white ml-1">
                                  Collect
                                </Text>
                              </Pressable>
                            )}

                            {iOweThem && (
                              <Pressable
                                onPress={() => handleOpenSettleForFriend(friend.id)}
                                className="bg-primary px-3 py-1.5 rounded-lg active:bg-primary-pressed shadow-xs flex-row items-center"
                              >
                                <HandCoins size={12} color="#FFFFFF" />
                                <Text className="font-body-semibold text-xs text-surface ml-1">
                                  Pay
                                </Text>
                              </Pressable>
                            )}

                            <Pressable
                              onPress={() => handleOpenSplitModalForFriend(friend.id)}
                              className="bg-surface-alt border border-border px-2.5 py-1.5 rounded-lg active:bg-border/60"
                            >
                              <Text className="font-body-medium text-xs text-ink">Split</Text>
                            </Pressable>

                            {isSettled && (
                              <Pressable
                                onPress={() => handleRemoveFriend(friend.id, friend.display_name)}
                                hitSlop={6}
                                className="w-8 h-8 rounded-lg bg-surface-alt border border-border items-center justify-center active:bg-rose-50"
                                accessibilityLabel="Remove friend"
                              >
                                <Trash2 size={13} color="#6B7370" />
                              </Pressable>
                            )}
                          </View>
                        </View>
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          )}

          {/* ════════ CATEGORY 2: RENT & HOUSEHOLD BILLS ═══════════════════════ */}
          {activeTab === 'rent' && (
            <View>
              {/* Rent Hub Hero Card */}
              <Card className="mb-4 bg-surface border border-border/80 rounded-2xl p-5 shadow-xs">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1 mr-2 min-w-0">
                    <View className="w-9 h-9 rounded-xl bg-secondary/15 items-center justify-center mr-2.5 flex-shrink-0 border border-secondary/20">
                      <Building size={17} color="#A87317" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="font-body-bold text-xs text-ink uppercase tracking-wider truncate" numberOfLines={1}>
                        Apartment Rent & Living Hub
                      </Text>
                    </View>
                  </View>
                  <View className="bg-secondary/15 px-2.5 py-1 rounded-full border border-secondary/30 flex-shrink-0">
                    <Text className="font-body-semibold text-[11px] text-secondary-dark">
                      {members.length} Roommates
                    </Text>
                  </View>
                </View>

                {/* Big Total Rent Amount */}
                <View className="my-2.5">
                  <Text className="font-body text-xs text-ink-muted mb-0.5">Total Monthly Rent</Text>
                  <Text
                    className="font-display-bold text-3xl text-ink"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatCurrency(currentTotalRentUSD)}
                  </Text>
                  <View className="flex-row items-center bg-[#F3F6F4] self-start px-2.5 py-1.5 rounded-xl border border-border/70 mt-2.5">
                    <Users size={13} color="#1E3D3C" />
                    <Text className="font-body text-xs text-ink-muted ml-1.5">
                      Divided {members.length} ways ·{' '}
                      <Text className="font-body-bold text-primary">
                        {formatCurrency(perPersonRentShareUSD)}
                      </Text>{' '}
                      per roommate
                    </Text>
                  </View>
                </View>

                {/* Primary Button to Split or Recalculate */}
                <Pressable
                  onPress={() => setShowRentModal(true)}
                  className="flex-row items-center justify-center bg-primary py-3 px-4 rounded-xl active:bg-primary-pressed shadow-xs mt-2"
                >
                  <SlidersHorizontal size={15} color="#FFFFFF" />
                  <Text className="font-body-semibold text-xs text-surface ml-2">
                    Recalculate & Split Rent
                  </Text>
                </Pressable>
              </Card>

              {/* Itemized Household Bills Breakdown Card */}
              <Card className="mb-4 bg-surface border border-border/80 rounded-2xl p-4 shadow-xs">
                <View className="flex-row items-center justify-between mb-3.5">
                  <View>
                    <Text className="font-display text-base text-ink">Itemized Living Costs</Text>
                    <Text className="font-body text-xs text-ink-muted mt-0.5">Fixed and monthly shared expenses</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setCalcMode('itemized');
                      setShowRentModal(true);
                    }}
                    hitSlop={8}
                    className="px-2.5 py-1 rounded-lg bg-surface-alt border border-border active:bg-border/60"
                  >
                    <Text className="font-body-semibold text-[11px] text-ink">Edit</Text>
                  </Pressable>
                </View>

                <View style={{ gap: 11 }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2 min-w-0">
                      <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mr-2.5 flex-shrink-0">
                        <Home size={15} color="#1E3D3C" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="font-body-medium text-xs text-ink truncate" numberOfLines={1}>
                          Base Apartment Rent
                        </Text>
                        <Text className="font-body text-[11px] text-ink-muted">Monthly lease rate</Text>
                      </View>
                    </View>
                    <Text className="font-body-bold text-xs text-ink flex-shrink-0" style={{ fontVariant: ['tabular-nums'] }}>
                      {formatCurrency(baseRentUSD)}
                    </Text>
                  </View>

                  <View className="h-px bg-border/50" />

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2 min-w-0">
                      <View className="w-8 h-8 rounded-xl bg-secondary/15 items-center justify-center mr-2.5 flex-shrink-0">
                        <Flame size={15} color="#A87317" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="font-body-medium text-xs text-ink truncate" numberOfLines={1}>
                          Utilities (Power, Water, Gas)
                        </Text>
                        <Text className="font-body text-[11px] text-ink-muted">Shared building meters</Text>
                      </View>
                    </View>
                    <Text className="font-body-bold text-xs text-ink flex-shrink-0" style={{ fontVariant: ['tabular-nums'] }}>
                      {formatCurrency(utilitiesUSD)}
                    </Text>
                  </View>

                  <View className="h-px bg-border/50" />

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2 min-w-0">
                      <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center mr-2.5 flex-shrink-0 border border-blue-100">
                        <Wifi size={15} color="#2563EB" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="font-body-medium text-xs text-ink truncate" numberOfLines={1}>
                          High-Speed Internet & WiFi
                        </Text>
                        <Text className="font-body text-[11px] text-ink-muted">Monthly broadband fiber plan</Text>
                      </View>
                    </View>
                    <Text className="font-body-bold text-xs text-ink flex-shrink-0" style={{ fontVariant: ['tabular-nums'] }}>
                      {formatCurrency(internetUSD)}
                    </Text>
                  </View>
                </View>

                <View className="mt-3.5 pt-3 border-t border-border/80 flex-row items-center justify-between">
                  <Text className="font-body-semibold text-xs text-ink-muted">Total Monthly Outlay</Text>
                  <Text className="font-display-bold text-base text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(currentTotalRentUSD)}
                  </Text>
                </View>
              </Card>

              {/* Roommate Shares Distribution */}
              <View className="mb-4">
                <Text className="font-display text-base text-ink mb-3 px-0.5">
                  Roommate Shares ({members.length})
                </Text>

                <View style={{ gap: 8 }}>
                  {members.map((m) => {
                    const isPayer = m.id === paidById;
                    return (
                      <Card
                        key={m.id}
                        className={`p-3.5 rounded-2xl border ${
                          isPayer
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-surface border-border/80'
                        } shadow-xs`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1 mr-3 min-w-0">
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center mr-3 flex-shrink-0 shadow-xs"
                              style={{ backgroundColor: m.avatar_color }}
                            >
                              <Text className="font-display-bold text-xs text-white">
                                {getInitials(m.display_name)}
                              </Text>
                            </View>

                            <View className="flex-1 min-w-0">
                              <View className="flex-row items-center gap-1.5">
                                <Text
                                  className="font-body-bold text-sm text-ink truncate"
                                  numberOfLines={1}
                                >
                                  {m.id === 'user_1' ? 'You' : m.display_name}
                                </Text>
                                {isPayer && (
                                  <View className="bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                    <Text className="font-body-semibold text-[10px] text-primary">
                                      Payer
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text className="font-body text-xs text-ink-muted mt-0.5">
                                1/{members.length} household share
                              </Text>
                            </View>
                          </View>

                          <View className="items-end flex-shrink-0">
                            <Text
                              className="font-display-bold text-sm text-ink"
                              style={{ fontVariant: ['tabular-nums'] }}
                            >
                              {formatCurrency(perPersonRentShareUSD)}
                            </Text>
                            <Text
                              className={`font-body-semibold text-[10px] mt-0.5 ${
                                isPayer ? 'text-income' : 'text-expense'
                              }`}
                            >
                              {isPayer ? 'Paid full rent' : 'Owed share'}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              </View>

              {/* Past Rent Activity */}
              {rentExpenses.length > 0 && (
                <View className="mb-4">
                  <Text className="font-display text-base text-ink mb-3 px-0.5">
                    Past Rent Records ({rentExpenses.length})
                  </Text>
                  {rentExpenses.map((expense) => {
                    const dateObj = new Date(expense.created_at);
                    const dateStr = dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    const payer = members.find((m) => m.id === expense.paid_by_member_id);
                    const payerName = expense.paid_by_member_id === 'user_1' ? 'You' : payer?.display_name ?? 'Roommate';

                    return (
                      <Card
                        key={expense.id}
                        className="mb-2 bg-surface border border-border/80 rounded-2xl p-3.5 shadow-xs"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1 mr-3 min-w-0">
                            <View className="w-9 h-9 rounded-xl bg-secondary/15 items-center justify-center mr-3 flex-shrink-0 border border-secondary/20">
                              <Building size={16} color="#A87317" />
                            </View>
                            <View className="flex-1 min-w-0">
                              <Text className="font-body-semibold text-xs text-ink truncate" numberOfLines={1}>
                                {expense.title}
                              </Text>
                              <Text className="font-body text-[11px] text-ink-muted mt-0.5">
                                {dateStr} · Paid by {payerName} · {expense.split_member_ids.length} roommates
                              </Text>
                            </View>
                          </View>
                          <Text className="font-display-bold text-sm text-ink flex-shrink-0" style={{ fontVariant: ['tabular-nums'] }}>
                            {formatCurrency(expense.amount)}
                          </Text>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── MODAL 1: QUICK SETTLE SHEET ───────────────────────────────────────── */}
      <Modal
        visible={!!settleTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setSettleTargetFriendId(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(28,31,29,0.55)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setSettleTargetFriendId(null)}
          >
            <Pressable
              style={[
                {
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                  width: '100%',
                },
                Platform.OS === 'web' && { maxWidth: 540, marginHorizontal: 'auto' },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="w-10 h-1 bg-border rounded-full self-center mb-3.5" />

              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-10 h-10 rounded-2xl bg-secondary/15 items-center justify-center mr-3 border border-secondary/30">
                    <HandCoins size={20} color="#A87317" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display text-lg text-ink">
                      {settleTarget?.net && settleTarget.net > 0 ? 'Record Received Payment' : 'Settle Debt'}
                    </Text>
                    <Text className="font-body text-xs text-ink-muted">
                      {settleTarget?.friend.display_name}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setSettleTargetFriendId(null)}
                  hitSlop={8}
                  className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
                >
                  <X size={18} color="#1C1F1D" />
                </Pressable>
              </View>

              {settleTarget && (
                <>
                  <View className="bg-[#F8FAF9] border border-border/80 rounded-2xl p-4 mb-4">
                    <Text className="font-body-medium text-xs text-ink-muted mb-3 text-center">
                      {settleTarget.net > 0
                        ? `${settleTarget.friend.display_name} is paying you`
                        : `You are paying ${settleTarget.friend.display_name}`}
                    </Text>

                    <View className="flex-row items-center justify-between px-2">
                      <View className="items-center flex-1">
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mb-1 shadow-xs"
                          style={{
                            backgroundColor:
                              settleTarget.net > 0 ? settleTarget.friend.avatar_color : '#1E3D3C',
                          }}
                        >
                          <Text className="font-display-bold text-sm text-white">
                            {settleTarget.net > 0
                              ? getInitials(settleTarget.friend.display_name)
                              : 'YOU'}
                          </Text>
                        </View>
                        <Text className="font-body-semibold text-xs text-ink" numberOfLines={1}>
                          {settleTarget.net > 0 ? settleTarget.friend.display_name : 'You'}
                        </Text>
                        <Text className="font-body text-[10px] text-ink-muted">Payer</Text>
                      </View>

                      <View className="items-center px-3">
                        <View className="h-0.5 w-10 bg-border mb-1" />
                        <ArrowRight size={18} color="#1E3D3C" />
                      </View>

                      <View className="items-center flex-1">
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mb-1 shadow-xs"
                          style={{
                            backgroundColor:
                              settleTarget.net > 0 ? '#1E3D3C' : settleTarget.friend.avatar_color,
                          }}
                        >
                          <Text className="font-display-bold text-sm text-white">
                            {settleTarget.net > 0
                              ? 'YOU'
                              : getInitials(settleTarget.friend.display_name)}
                          </Text>
                        </View>
                        <Text className="font-body-semibold text-xs text-ink" numberOfLines={1}>
                          {settleTarget.net > 0 ? 'You' : settleTarget.friend.display_name}
                        </Text>
                        <Text className="font-body text-[10px] text-ink-muted">Recipient</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-body text-xs text-ink-muted">Choose amount</Text>
                    <Text className="font-body-semibold text-xs text-ink">
                      Balance: {formatCurrency(Math.abs(settleTarget.net))}
                    </Text>
                  </View>

                  <View className="flex-row gap-2 mb-3">
                    <Pressable
                      onPress={() => {
                        setSettleAmountInput(formatForInput(Math.abs(settleTarget.net), currencyCode));
                        setSettleError('');
                      }}
                      className="flex-1 py-2 rounded-xl bg-primary/10 border border-primary/30 items-center active:bg-primary/20"
                    >
                      <Text className="font-body-semibold text-xs text-primary">
                        Full ({formatCurrency(Math.abs(settleTarget.net))})
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setSettleAmountInput(formatForInput(Math.abs(settleTarget.net) / 2, currencyCode));
                        setSettleError('');
                      }}
                      className="flex-1 py-2 rounded-xl bg-surface-alt border border-border items-center active:bg-border/60"
                    >
                      <Text className="font-body-semibold text-xs text-ink">
                        Half ({formatCurrency(Math.abs(settleTarget.net) / 2)})
                      </Text>
                    </Pressable>
                  </View>

                  <View className="bg-surface-alt/80 border border-border rounded-xl p-3 mb-3">
                    <Text className="font-body text-xs text-ink-muted mb-1">
                      Custom Amount ({currency.code})
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="font-display-bold text-xl text-ink mr-2">
                        {currency.symbol}
                      </Text>
                      <TextInput
                        value={settleAmountInput}
                        onChangeText={(v) => {
                          setSettleAmountInput(v);
                          setSettleError('');
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#8A928E"
                        className="flex-1 font-display-bold text-2xl text-ink"
                      />
                    </View>
                  </View>

                  {settleError ? (
                    <Text className="font-body text-xs text-danger mb-3 text-center">
                      {settleError}
                    </Text>
                  ) : null}

                  <View className="flex-row gap-3 pt-1">
                    <Button
                      label="Cancel"
                      variant="secondary"
                      onPress={() => setSettleTargetFriendId(null)}
                      className="flex-1"
                    />
                    <Button
                      label={
                        settleTarget.net > 0
                          ? `Record Received`
                          : `Confirm Payment`
                      }
                      onPress={handleConfirmSettle}
                      className="flex-1"
                    />
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 2: ADD FRIEND ──────────────────────────────────────────────── */}
      <Modal
        visible={showAddFriendModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(28,31,29,0.55)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowAddFriendModal(false)}
          >
            <Pressable
              style={[
                {
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                  width: '100%',
                },
                Platform.OS === 'web' && { maxWidth: 540, marginHorizontal: 'auto' },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="w-10 h-1 bg-border rounded-full self-center mb-3.5" />

              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center mr-3 border border-primary/20">
                    <UserPlus size={20} color="#1E3D3C" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display text-lg text-ink">Add Friend</Text>
                    <Text className="font-body text-xs text-ink-muted">
                      Connect friend to track debts & split expenses
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowAddFriendModal(false)}
                  hitSlop={8}
                  className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
                >
                  <X size={18} color="#1C1F1D" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="font-body text-xs text-ink-muted mb-1.5">Friend's Name</Text>
                <TextInput
                  value={newFriendName}
                  onChangeText={(v) => {
                    setNewFriendName(v);
                    setAddFriendError('');
                  }}
                  placeholder="e.g. Jordan, Jessica, Alex"
                  placeholderTextColor="#8A928E"
                  autoFocus
                  style={{
                    backgroundColor: '#F8FAF9',
                    borderWidth: 1,
                    borderColor: '#E2E4DF',
                    borderRadius: 12,
                    height: 48,
                    paddingHorizontal: 14,
                    fontFamily: 'Inter_500Medium',
                    fontSize: 15,
                    color: '#1C1F1D',
                  }}
                />
              </View>

              <View className="mb-5">
                <Text className="font-body text-xs text-ink-muted mb-2">Avatar Color</Text>
                <View className="flex-row justify-between">
                  {FRIEND_PALETTE.map((color) => {
                    const isSelected = newFriendColor === color;
                    return (
                      <Pressable
                        key={color}
                        onPress={() => setNewFriendColor(color)}
                        className="w-10 h-10 rounded-full items-center justify-center shadow-xs"
                        style={{
                          backgroundColor: color,
                          transform: [{ scale: isSelected ? 1.15 : 1 }],
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: '#FFFFFF',
                        }}
                      >
                        {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {addFriendError ? (
                <Text className="font-body text-xs text-danger mb-3 text-center">
                  {addFriendError}
                </Text>
              ) : null}

              <View className="flex-row gap-3">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowAddFriendModal(false)}
                  className="flex-1"
                />
                <Button
                  label="Connect Friend"
                  onPress={handleAddFriend}
                  className="flex-1"
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 3: UNIVERSAL SPLIT EXPENSE ──────────────────────────────────── */}
      <Modal
        visible={showSplitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSplitModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(28,31,29,0.55)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowSplitModal(false)}
          >
            <Pressable
              style={[
                {
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  maxHeight: '92%',
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                  width: '100%',
                },
                Platform.OS === 'web' && { maxWidth: 580, marginHorizontal: 'auto' },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="w-10 h-1 bg-border rounded-full self-center mb-3.5" />

              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center mr-3 border border-primary/20">
                      <Divide size={20} color="#1E3D3C" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-display text-lg text-ink">Split an Expense</Text>
                      <Text className="font-body text-xs text-ink-muted">
                        Divide bill and record pairwise debts
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setShowSplitModal(false)}
                    hitSlop={8}
                    className="w-9 h-9 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
                  >
                    <X size={18} color="#1C1F1D" />
                  </Pressable>
                </View>

                {/* Category Preset Chips */}
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {SPLIT_PRESETS.map((p) => {
                    const isSelected = expenseTitle === p.title;
                    return (
                      <Pressable
                        key={p.title}
                        onPress={() => {
                          setExpenseTitle(p.title);
                          setExpenseCategory(p.category);
                          setSplitError('');
                        }}
                        className={`flex-row items-center px-2.5 py-1.5 rounded-lg border ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'bg-surface-alt border-border'
                        }`}
                      >
                        <Text className="text-xs mr-1">{p.emoji}</Text>
                        <Text
                          className={`text-xs ${
                            isSelected ? 'font-body-semibold text-primary' : 'font-body-medium text-ink-muted'
                          }`}
                        >
                          {p.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Expense Title Input */}
                <View className="mb-3">
                  <Text className="font-body text-xs text-ink-muted mb-1">Expense Title</Text>
                  <TextInput
                    value={expenseTitle}
                    onChangeText={(v) => {
                      setExpenseTitle(v);
                      setSplitError('');
                    }}
                    placeholder="e.g. Sushi Dinner, Taxi to Airport"
                    placeholderTextColor="#8A928E"
                    style={{
                      backgroundColor: '#F8FAF9',
                      borderWidth: 1,
                      borderColor: '#E2E4DF',
                      borderRadius: 12,
                      height: 44,
                      paddingHorizontal: 12,
                      fontFamily: 'Inter_500Medium',
                      fontSize: 14,
                      color: '#1C1F1D',
                    }}
                  />
                </View>

                {/* Total Amount Input */}
                <View className="bg-surface-alt/80 border border-border rounded-2xl p-4 mb-4">
                  <Text className="font-body text-xs text-ink-muted mb-1.5">
                    Total Amount ({currency.code})
                  </Text>
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-surface border border-border items-center justify-center mr-3 flex-shrink-0">
                      <Text className="font-display-bold text-lg text-ink">
                        {currency.symbol}
                      </Text>
                    </View>
                    <TextInput
                      value={expenseAmount}
                      onChangeText={(v) => {
                        setExpenseAmount(v);
                        setSplitError('');
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#8A928E"
                      className="flex-1 font-display-bold text-2xl text-ink"
                    />
                  </View>
                </View>

                {/* Who Paid? */}
                <View className="mb-4">
                  <Text className="font-body text-xs text-ink-muted mb-2">Who Paid?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
                    {members.map((m) => {
                      const isSelected = payerId === m.id;
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => setPayerId(m.id)}
                          className={`flex-row items-center px-3.5 py-2 rounded-xl border mr-2 ${
                            isSelected
                              ? 'bg-primary border-primary shadow-xs'
                              : 'bg-surface border-border active:bg-surface-alt'
                          }`}
                        >
                          <View
                            className="w-5 h-5 rounded-full items-center justify-center mr-2"
                            style={{ backgroundColor: m.avatar_color }}
                          >
                            <Text className="font-display-bold text-[9px] text-white">
                              {getInitials(m.display_name)}
                            </Text>
                          </View>
                          <Text
                            className={`font-body-semibold text-xs ${
                              isSelected ? 'text-surface' : 'text-ink'
                            }`}
                          >
                            {m.id === 'user_1' ? 'You' : m.display_name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Split With Whom? */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-body text-xs text-ink-muted">
                      Split Between ({selectedSplitMemberIds.length} of {members.length})
                    </Text>
                    <Pressable
                      onPress={() => setSelectedSplitMemberIds(members.map((m) => m.id))}
                      hitSlop={8}
                    >
                      <Text className="font-body-semibold text-xs text-primary">Select All</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    {members.map((m) => {
                      const isIncluded = selectedSplitMemberIds.includes(m.id);
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => handleToggleSplitMember(m.id)}
                          className={`flex-row items-center px-3 py-2 rounded-xl border ${
                            isIncluded
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-surface-alt/60 border-border opacity-60'
                          }`}
                        >
                          <View
                            className="w-4 h-4 rounded-full items-center justify-center mr-1.5"
                            style={{
                              backgroundColor: isIncluded ? '#2F8F6B' : '#8A928E',
                            }}
                          >
                            {isIncluded && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                          <Text
                            className={`font-body-medium text-xs ${
                              isIncluded ? 'text-emerald-950 font-body-semibold' : 'text-ink-muted'
                            }`}
                          >
                            {m.id === 'user_1' ? 'You' : m.display_name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Live Split Calculation & Outcome Preview */}
                <View className="bg-surface-alt border border-border rounded-2xl p-4 mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-body-bold text-xs text-ink uppercase tracking-wider">
                      Split Calculation
                    </Text>
                    <View className="bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      <Text
                        className="font-body-bold text-xs text-primary"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {formatCurrency(perPersonExpenseShare, { skipConversion: true })} each
                      </Text>
                    </View>
                  </View>

                  <Text className="font-body text-xs text-ink leading-5">
                    {payerId === 'user_1' ? (
                      selectedSplitMemberIds.includes('user_1') ? (
                        <>
                          <Text className="font-body-bold text-income">✓ You paid. </Text>
                          Other {splitMembersCount - 1} friend(s) will each owe you{' '}
                          <Text className="font-body-bold text-income">
                            {formatCurrency(perPersonExpenseShare, { skipConversion: true })}
                          </Text>
                          .
                        </>
                      ) : (
                        <>
                          <Text className="font-body-bold text-income">✓ You paid for others. </Text>
                          They will each owe you{' '}
                          <Text className="font-body-bold text-income">
                            {formatCurrency(perPersonExpenseShare, { skipConversion: true })}
                          </Text>
                          .
                        </>
                      )
                    ) : (
                      <>
                        <Text className="font-body-bold text-expense">
                          ✓ {members.find((m) => m.id === payerId)?.display_name ?? 'Friend'} paid.{' '}
                        </Text>
                        {selectedSplitMemberIds.includes('user_1') ? (
                          <>
                            You will owe them{' '}
                            <Text className="font-body-bold text-expense">
                              {formatCurrency(perPersonExpenseShare, { skipConversion: true })}
                            </Text>{' '}
                            for your share.
                          </>
                        ) : (
                          'You are not included in this split.'
                        )}
                      </>
                    )}
                  </Text>
                </View>

                {splitError ? (
                  <Text className="font-body text-xs text-danger mb-3 text-center">
                    {splitError}
                  </Text>
                ) : null}

                <View className="flex-row gap-3 pt-1">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => setShowSplitModal(false)}
                    className="flex-1"
                  />
                  <Button
                    label={`Split · ${formatCurrency(perPersonExpenseShare, { skipConversion: true })} each`}
                    onPress={handleAddSplitExpense}
                    className="flex-1"
                  />
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 4: SPLIT APARTMENT RENT ────────────────────────────────────── */}
      <Modal
        visible={showRentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(28, 31, 29, 0.65)',
              justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
              alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
              padding: Platform.OS === 'web' ? 16 : 0,
            }}
            onPress={() => setShowRentModal(false)}
          >
            <Pressable
              style={[
                {
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  borderRadius: Platform.OS === 'web' ? 24 : undefined,
                  maxHeight: Platform.OS === 'web' ? '90%' : '92%',
                  width: '100%',
                  overflow: 'hidden',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.18,
                  shadowRadius: 24,
                  elevation: 12,
                },
                Platform.OS === 'web' && { maxWidth: 540 },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              {Platform.OS !== 'web' && (
                <View className="w-10 h-1 bg-border rounded-full self-center mt-3 mb-1" />
              )}

              {/* ── MODAL HEADER ──────────────────────────────────────────────── */}
              <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-border/70">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-10 h-10 rounded-2xl bg-secondary/15 items-center justify-center mr-3 border border-secondary/30">
                    <Building size={20} color="#A87317" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display text-lg text-ink">Edit & Split Rent</Text>
                    <Text className="font-body text-xs text-ink-muted">
                      Calculate living costs & divide {members.length} ways
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowRentModal(false)}
                  hitSlop={8}
                  className="w-8 h-8 rounded-full bg-surface-alt border border-border items-center justify-center active:bg-border"
                  accessibilityLabel="Close"
                >
                  <X size={16} color="#1C1F1D" />
                </Pressable>
              </View>

              {/* ── SCROLLABLE FORM BODY ───────────────────────────────────────── */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                bounces={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 24,
                }}
              >
                {/* Mode Toggle Switcher */}
                <View className="flex-row bg-[#F1F3F0] p-1 rounded-xl mb-4 border border-border/80">
                  <Pressable
                    onPress={() => setCalcMode('itemized')}
                    className={`flex-1 py-2 rounded-lg items-center ${
                      calcMode === 'itemized' ? 'bg-white shadow-xs border border-border/60' : ''
                    }`}
                  >
                    <Text
                      className={`font-body-semibold text-xs ${
                        calcMode === 'itemized' ? 'text-primary font-body-bold' : 'text-ink-muted'
                      }`}
                    >
                      Itemized (Rent + Bills)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setCalcMode('total');
                      if (modalRentTotalInCurrency > 0) {
                        const config = getCurrencyConfig(currencyCode);
                        const rounded = Math.round(modalRentTotalInCurrency);
                        setRentAmount(rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator));
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg items-center ${
                      calcMode === 'total' ? 'bg-white shadow-xs border border-border/60' : ''
                    }`}
                  >
                    <Text
                      className={`font-body-semibold text-xs ${
                        calcMode === 'total' ? 'text-primary font-body-bold' : 'text-ink-muted'
                      }`}
                    >
                      Total Lump Sum
                    </Text>
                  </Pressable>
                </View>

                {/* Mode 1: Itemized Living Costs */}
                {calcMode === 'itemized' ? (
                  <View className="bg-surface border border-border rounded-2xl p-4 mb-4 shadow-xs">
                    <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-border/60">
                      <Text className="font-body-bold text-xs uppercase tracking-wider text-ink">
                        Itemized Living Costs
                      </Text>
                      <View className="bg-surface-alt px-2 py-0.5 rounded-full border border-border/60">
                        <Text className="font-body-semibold text-[10px] text-ink-muted">
                          {currency.code} ({currency.symbol})
                        </Text>
                      </View>
                    </View>

                    {/* Item 1: Base Rent */}
                    <View className="mb-3">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center">
                          <View className="w-6 h-6 rounded-lg bg-emerald-500/10 items-center justify-center mr-2">
                            <Home size={14} color="#10B981" />
                          </View>
                          <Text className="font-body-semibold text-xs text-ink">Base Apartment Rent</Text>
                        </View>
                        <Text className="font-body text-[11px] text-ink-muted">Monthly lease</Text>
                      </View>
                      <View className="flex-row items-center bg-[#F8FAF9] border border-[#E2E4DF] rounded-xl px-3 h-11">
                        <Text className="font-body-bold text-sm text-ink-muted mr-2">{currency.symbol}</Text>
                        <TextInput
                          value={baseRent}
                          onChangeText={(v) => { handleNumberInputChange(v, setBaseRent); setRentError(''); }}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#8A928E"
                          className="flex-1 font-body-semibold text-sm text-ink"
                          style={{ fontVariant: ['tabular-nums'] }}
                        />
                      </View>
                    </View>

                    {/* Item 2: Utilities */}
                    <View className="mb-3">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center">
                          <View className="w-6 h-6 rounded-lg bg-amber-500/10 items-center justify-center mr-2">
                            <Zap size={14} color="#F59E0B" />
                          </View>
                          <Text className="font-body-semibold text-xs text-ink">Utilities (Power, Water, Gas)</Text>
                        </View>
                        <Text className="font-body text-[11px] text-ink-muted">Meters & waste</Text>
                      </View>
                      <View className="flex-row items-center bg-[#F8FAF9] border border-[#E2E4DF] rounded-xl px-3 h-11">
                        <Text className="font-body-bold text-sm text-ink-muted mr-2">{currency.symbol}</Text>
                        <TextInput
                          value={utilities}
                          onChangeText={(v) => { handleNumberInputChange(v, setUtilities); setRentError(''); }}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#8A928E"
                          className="flex-1 font-body-semibold text-sm text-ink"
                          style={{ fontVariant: ['tabular-nums'] }}
                        />
                      </View>
                    </View>

                    {/* Item 3: Internet */}
                    <View className="mb-3">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center">
                          <View className="w-6 h-6 rounded-lg bg-sky-500/10 items-center justify-center mr-2">
                            <Wifi size={14} color="#0EA5E9" />
                          </View>
                          <Text className="font-body-semibold text-xs text-ink">Internet & WiFi</Text>
                        </View>
                        <Text className="font-body text-[11px] text-ink-muted">Broadband plan</Text>
                      </View>
                      <View className="flex-row items-center bg-[#F8FAF9] border border-[#E2E4DF] rounded-xl px-3 h-11">
                        <Text className="font-body-bold text-sm text-ink-muted mr-2">{currency.symbol}</Text>
                        <TextInput
                          value={internet}
                          onChangeText={(v) => { handleNumberInputChange(v, setInternet); setRentError(''); }}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#8A928E"
                          className="flex-1 font-body-semibold text-sm text-ink"
                          style={{ fontVariant: ['tabular-nums'] }}
                        />
                      </View>
                    </View>

                    {/* Calculated Total Banner */}
                    <View className="mt-1 pt-3 border-t border-border/70 flex-row items-center justify-between bg-primary/5 -mx-4 -mb-4 p-4 rounded-b-2xl">
                      <View>
                        <Text className="font-body-bold text-xs text-ink">
                          Calculated Total Rent
                        </Text>
                        <Text className="font-body text-[11px] text-ink-muted">
                          Divided by {members.length} roommates
                        </Text>
                      </View>
                      <Text className="font-display-bold text-lg text-primary" style={{ fontVariant: ['tabular-nums'] }}>
                        {formatCurrency(modalRentTotalInCurrency, { skipConversion: true })}
                      </Text>
                    </View>
                  </View>
                ) : (
                  /* Mode 2: Total Rent Lump Sum */
                  <View className="bg-surface border border-border rounded-2xl p-4 mb-4 shadow-xs">
                    <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-border/60">
                      <Text className="font-body-bold text-xs uppercase tracking-wider text-ink">
                        Total Monthly Rent
                      </Text>
                      <View className="bg-surface-alt px-2 py-0.5 rounded-full border border-border/60">
                        <Text className="font-body-semibold text-[10px] text-ink-muted">
                          {currency.code} ({currency.symbol})
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center bg-[#F8FAF9] border border-[#E2E4DF] rounded-2xl px-4 py-2.5 mb-2.5">
                      <View className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center mr-3 flex-shrink-0">
                        <Text className="font-display-bold text-lg text-primary">
                          {currency.symbol}
                        </Text>
                      </View>
                      <TextInput
                        value={rentAmount}
                        onChangeText={(v) => {
                          handleNumberInputChange(v, setRentAmount);
                          setRentError('');
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor="#8A928E"
                        className="flex-1 font-display-bold text-2xl text-ink"
                        style={{ fontVariant: ['tabular-nums'] }}
                      />
                    </View>

                    <View className="flex-row items-center justify-between pt-1">
                      <Text className="font-body text-xs text-ink-muted">
                        Equal share (1/{members.length}):
                      </Text>
                      <Text className="font-body-bold text-xs text-primary" style={{ fontVariant: ['tabular-nums'] }}>
                        {formatCurrency(modalPerPersonShareInCurrency, { skipConversion: true })} each
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── UNIFIED ROOMMATE SHARES & LANDLORD PAYER SELECTION ─────────── */}
                <View className="mb-4">
                  <View className="flex-row items-center mb-1">
                    <Divide size={15} color="#1E3D3C" />
                    <Text className="font-body-bold text-xs uppercase tracking-wider text-ink ml-1.5">
                      Who Paid Landlord?
                    </Text>
                  </View>
                  <Text className="font-body text-[11px] text-ink-muted mb-2.5">
                    Select who paid the rent. Each roommate owes{' '}
                    <Text className="font-body-bold text-ink">
                      {formatCurrency(modalPerPersonShareInCurrency, { skipConversion: true })}
                    </Text>:
                  </Text>

                  <View style={{ gap: 8 }}>
                    {members.map((rm) => {
                      const isPayer = rm.id === paidById;
                      return (
                        <Pressable
                          key={rm.id}
                          onPress={() => setPaidById(rm.id)}
                          className={`p-3 rounded-xl border ${
                            isPayer
                              ? 'bg-primary/5 border-primary shadow-xs'
                              : 'bg-surface border-border/80 active:bg-surface-alt'
                          }`}
                        >
                          <View className="flex-row items-center justify-between">
                            {/* Left: Avatar + Identity */}
                            <View className="flex-row items-center flex-1 mr-2 min-w-0">
                              <View
                                className="w-9 h-9 rounded-full items-center justify-center mr-2.5 flex-shrink-0"
                                style={{ backgroundColor: rm.avatar_color }}
                              >
                                <Text className="font-display-bold text-xs text-white">
                                  {getInitials(rm.display_name)}
                                </Text>
                              </View>
                              <View className="flex-1 min-w-0">
                                <View className="flex-row items-center gap-1.5 flex-wrap">
                                  <Text className="font-body-bold text-sm text-ink">
                                    {rm.id === currentMemberId ? 'You' : rm.display_name}
                                  </Text>
                                  {isPayer && (
                                    <View className="bg-primary/15 px-1.5 py-0.5 rounded-full border border-primary/30 flex-row items-center gap-1">
                                      <Check size={9} color="#1E3D3C" strokeWidth={3} />
                                      <Text className="font-body-bold text-[9px] text-primary">
                                        Payer
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text className="font-body text-xs text-ink-muted mt-0.5">
                                  {isPayer ? 'Paid full apartment rent' : `1/${members.length} roommate share`}
                                </Text>
                              </View>
                            </View>

                            {/* Right: Amount + Status */}
                            <View className="items-end flex-shrink-0">
                              <Text
                                className={`font-display-bold text-sm ${isPayer ? 'text-primary' : 'text-ink'}`}
                                style={{ fontVariant: ['tabular-nums'] }}
                              >
                                {formatCurrency(modalPerPersonShareInCurrency, { skipConversion: true })}
                              </Text>
                              <Text
                                className={`font-body-semibold text-[10px] mt-0.5 ${
                                  isPayer ? 'text-income' : 'text-expense'
                                }`}
                              >
                                {isPayer ? 'Paid total' : 'Owed'}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* ── DESCRIPTION / MONTH ────────────────────────────────────────── */}
                <View className="mb-2">
                  <Text className="font-body text-xs text-ink-muted mb-1.5">Description / Month</Text>
                  <TextInput
                    value={rentTitle}
                    onChangeText={(v) => { setRentTitle(v); setRentError(''); }}
                    placeholder="e.g. October Apartment Rent"
                    placeholderTextColor="#8A928E"
                    style={{
                      backgroundColor: '#F8FAF9',
                      borderWidth: 1,
                      borderColor: '#E2E4DF',
                      borderRadius: 12,
                      height: 44,
                      paddingHorizontal: 12,
                      fontFamily: 'Inter_400Regular',
                      color: '#1C1F1D',
                      fontSize: 14,
                    }}
                  />
                </View>

                {rentError ? (
                  <Text className="font-body text-xs text-danger mt-2 text-center">{rentError}</Text>
                ) : null}
              </ScrollView>

              {/* ── STICKY DEDICATED ACTION FOOTER ────────────────────────────── */}
              <View className="px-5 py-3.5 bg-surface border-t border-border flex-row items-center gap-3">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowRentModal(false)}
                  className="w-24"
                />
                <Button
                  label="Save & Split"
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
