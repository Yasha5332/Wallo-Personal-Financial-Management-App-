/**
 * FinanceContext.tsx
 *
 * Thin React state layer — manages in-memory state and bridges the UI
 * to the service/repo layer. Contains NO business logic and makes NO
 * direct Supabase calls (those live in lib/repos/ and lib/services/).
 *
 * In demo mode (no Supabase configured), initial mock data is used and
 * all mutations update local state only.
 */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';

// ── Models ────────────────────────────────────────────────────────────────────
import type { TransactionModel, TransactionCategory } from '../lib/models/transaction.model';
import type { BudgetWithSpent } from '../lib/models/budget.model';
import type { SubscriptionModel } from '../lib/models/subscription.model';
import type { SavingsGoalModel } from '../lib/models/savings-goal.model';
import type { PayPeriodModel } from '../lib/models/pay-period.model';
import type { GroupMemberModel } from '../lib/models/group.model';
import type { GroupExpenseModel, ComputedDebtBalance } from '../lib/models/group-expense.model';

// ── Schemas ───────────────────────────────────────────────────────────────────
import type { CreateTransactionInput, UpdateTransactionInput } from '../lib/schemas/transaction.schema';
import type { UpdateBudgetLimitInput } from '../lib/schemas/budget.schema';
import type { CreateSavingsGoalInput, ContributeToGoalInput, UpdateSavingsGoalInput } from '../lib/schemas/savings-goal.schema';
import type { UpdatePayPeriodInput } from '../lib/schemas/pay-period.schema';
import type { CreateGroupExpenseInput, SettleDebtInput } from '../lib/schemas/group-expense.schema';

// ── Services ──────────────────────────────────────────────────────────────────
import { FinanceService, type DailyBudgetStats } from '../lib/services/finance.service';
import { BudgetService, type CategoryBudgetSummary } from '../lib/services/budget.service';
import { SharedExpenseService } from '../lib/services/shared-expense.service';
import { SavingsService } from '../lib/services/savings.service';

// ── Repos ─────────────────────────────────────────────────────────────────────
import { TransactionRepo } from '../lib/repos/transaction.repo';
import { BudgetRepo } from '../lib/repos/budget.repo';
import { SubscriptionRepo } from '../lib/repos/subscription.repo';
import { SavingsGoalRepo } from '../lib/repos/savings-goal.repo';
import { PayPeriodRepo } from '../lib/repos/pay-period.repo';
import { GroupExpenseRepo } from '../lib/repos/group-expense.repo';

// ─── Demo / mock data (used when Supabase is not configured) ──────────────────
import {
  DEMO_TRANSACTIONS,
  DEMO_BUDGETS,
  DEMO_SUBSCRIPTIONS,
  DEMO_SAVINGS_GOALS,
  DEMO_PAY_PERIOD,
  DEMO_MEMBERS,
  DEMO_SHARED_EXPENSES,
} from '../lib/demo-data';

// ─── Context shape ────────────────────────────────────────────────────────────
interface FinanceContextType {
  // State
  transactions: TransactionModel[];
  budgets: BudgetWithSpent[];
  budgetSummaries: CategoryBudgetSummary[];
  subscriptions: SubscriptionModel[];
  savingsGoals: SavingsGoalModel[];
  payPeriod: PayPeriodModel | null;
  members: GroupMemberModel[];
  sharedExpenses: GroupExpenseModel[];
  debtBalances: ComputedDebtBalance[];
  isLoading: boolean;

  // Derived
  balance: number;
  dailyBudgetStats: DailyBudgetStats | null;
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  totalSubscriptionsCost: number;

  // Actions
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  updateTransaction: (input: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudgetLimit: (input: UpdateBudgetLimitInput) => Promise<void>;
  addSavingsGoal: (input: CreateSavingsGoalInput) => Promise<void>;
  updateSavingsGoal: (input: UpdateSavingsGoalInput) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  contributeToGoal: (input: ContributeToGoalInput) => Promise<void>;
  addSharedExpense: (input: CreateGroupExpenseInput) => Promise<void>;
  settleDebt: (input: SettleDebtInput) => Promise<void>;
  addMember: (displayName: string, avatarColor?: string) => Promise<GroupMemberModel>;
  removeMember: (memberId: string) => Promise<void>;
  updatePayPeriod: (input: UpdatePayPeriodInput) => Promise<void>;
  resetPayPeriod: () => Promise<void>;
  reload: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const BASE_BALANCE = 1200.00; // Starting balance for demo / new users

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isDemoMode } = useAuth();

  const [transactions, setTransactions] = useState<TransactionModel[]>(DEMO_TRANSACTIONS);
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>(DEMO_BUDGETS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionModel[]>(DEMO_SUBSCRIPTIONS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalModel[]>(DEMO_SAVINGS_GOALS);
  const [payPeriod, setPayPeriod] = useState<PayPeriodModel | null>(DEMO_PAY_PERIOD);
  const [members, setMembers] = useState<GroupMemberModel[]>(DEMO_MEMBERS);
  const [sharedExpenses, setSharedExpenses] = useState<GroupExpenseModel[]>(DEMO_SHARED_EXPENSES);
  const [isLoading, setIsLoading] = useState(false);

  // ── Load from DB when user is authenticated ─────────────────────────────────
  const load = async () => {
    if (!user || isDemoMode) return;
    setIsLoading(true);
    try {
      // Find or create default circle group for the authenticated user
      let userGroups = await GroupExpenseRepo.findGroupsByUser(user.id);
      let activeGroup = userGroups[0] || null;
      if (!activeGroup) {
        activeGroup = await GroupExpenseRepo.createGroup(user.id, 'My Circle');
        await GroupExpenseRepo.addMember({
          group_id: activeGroup.id,
          display_name: profile?.name || 'You',
          user_id: user.id,
          avatar_color: '#1E3D3C',
          is_external: false,
        });
      }

      const [txs, bgs, subs, goals, period, grpMembers, grpExpenses] = await Promise.all([
        TransactionRepo.findByUser(user.id),
        BudgetRepo.findWithSpentByUser(user.id),
        SubscriptionRepo.findActiveByUser(user.id),
        SavingsGoalRepo.findByUser(user.id),
        PayPeriodRepo.findActive(user.id),
        GroupExpenseRepo.findMembersByGroup(activeGroup.id),
        GroupExpenseRepo.findExpensesByGroup(activeGroup.id),
      ]);
      setTransactions(txs);
      setBudgets(bgs);
      setSubscriptions(subs);
      setSavingsGoals(goals);
      setPayPeriod(period);
      setMembers(grpMembers.length > 0 ? grpMembers : [
        {
          id: `mem_${user.id.slice(0, 8)}`,
          group_id: activeGroup.id,
          user_id: user.id,
          display_name: profile?.name || 'You',
          avatar_color: '#1E3D3C',
          is_external: false,
          created_at: new Date().toISOString(),
        },
      ]);
      setSharedExpenses(grpExpenses);
    } catch (err) {
      console.warn('FinanceProvider.load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isDemoMode) {
      load();
    } else if (isDemoMode) {
      setTransactions(DEMO_TRANSACTIONS);
      setBudgets(DEMO_BUDGETS);
      setSubscriptions(DEMO_SUBSCRIPTIONS);
      setSavingsGoals(DEMO_SAVINGS_GOALS);
      setPayPeriod(DEMO_PAY_PERIOD);
      setMembers(DEMO_MEMBERS);
      setSharedExpenses(DEMO_SHARED_EXPENSES);
    }
  }, [user?.id, isDemoMode]);

  // ── Derived values (computed, not stored) ────────────────────────────────────
  const balance = useMemo(
    () => FinanceService.computeBalance(BASE_BALANCE, transactions),
    [transactions],
  );

  const dailyBudgetStats = useMemo(
    () => payPeriod ? FinanceService.computeDailyBudgetStats(payPeriod, transactions) : null,
    [payPeriod, transactions],
  );

  const budgetSummaries = useMemo(
    () => budgets.map((b) => BudgetService.toBudgetSummary(b)),
    [budgets],
  );

  const { totalLimit: totalBudgetLimit, totalSpent: totalBudgetSpent } = useMemo(
    () => BudgetService.computeTotals(budgetSummaries),
    [budgetSummaries],
  );

  const totalSubscriptionsCost = useMemo(
    () => subscriptions.reduce((acc, s) => acc + s.amount, 0),
    [subscriptions],
  );

  const debtBalances = useMemo(
    () => SharedExpenseService.computeDebtBalances(sharedExpenses, members),
    [sharedExpenses, members],
  );

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addTransaction = async (input: CreateTransactionInput) => {
    const txDate = input.transacted_at || new Date().toISOString();
    if (isDemoMode || !user) {
      // Demo: update local state only
      const mock: TransactionModel = {
        ...input,
        id: `tx_${Date.now()}`,
        user_id: 'demo',
        journal_entry_id: null,
        payment_account_id: null,
        note: input.note ?? null,
        is_recurring: input.is_recurring,
        is_void: false,
        transacted_at: txDate,
        created_at: new Date().toISOString(),
      };
      setTransactions((prev) =>
        [mock, ...prev].sort(
          (a, b) => new Date(b.transacted_at).getTime() - new Date(a.transacted_at).getTime(),
        ),
      );
      // Update budget spent in demo mode
      if (input.type === 'expense') {
        setBudgets((prev) =>
          prev.map((b) =>
            b.category === input.category
              ? { ...b, spent_amount: b.spent_amount + input.amount }
              : b,
          ),
        );
      }
      return;
    }
    const newTx = await TransactionRepo.create(user.id, input);
    setTransactions((prev) =>
      [newTx, ...prev].sort(
        (a, b) => new Date(b.transacted_at).getTime() - new Date(a.transacted_at).getTime(),
      ),
    );
    // Refresh budgets so spent_amount reflects the new transaction
    const updatedBudgets = await BudgetRepo.findWithSpentByUser(user.id);
    setBudgets(updatedBudgets);
  };

  const updateTransaction = async (input: UpdateTransactionInput) => {
    if (isDemoMode || !user) {
      let oldTx: TransactionModel | undefined;
      setTransactions((prev) => {
        oldTx = prev.find((t) => t.id === input.id);
        const next = prev.map((t) => {
          if (t.id !== input.id) return t;
          return {
            ...t,
            title: input.title ?? t.title,
            amount: input.amount ?? t.amount,
            type: input.type ?? t.type,
            category: input.category ?? t.category,
            note: input.note !== undefined ? (input.note ?? null) : t.note,
            is_recurring: input.is_recurring !== undefined ? input.is_recurring : t.is_recurring,
            transacted_at: input.transacted_at ?? t.transacted_at,
          };
        });
        return next.sort(
          (a, b) => new Date(b.transacted_at).getTime() - new Date(a.transacted_at).getTime(),
        );
      });

      if (oldTx) {
        const oldCategory = (oldTx as TransactionModel).category;
        const oldAmount = (oldTx as TransactionModel).amount;
        const oldType = (oldTx as TransactionModel).type;
        const newCategory = input.category ?? oldCategory;
        const newAmount = input.amount ?? oldAmount;
        const newType = input.type ?? oldType;

        setBudgets((prevBudgets) =>
          prevBudgets.map((b) => {
            let spent = b.spent_amount;
            if (oldType === 'expense' && b.category === oldCategory) {
              spent -= oldAmount;
            }
            if (newType === 'expense' && b.category === newCategory) {
              spent += newAmount;
            }
            return { ...b, spent_amount: Math.max(0, spent) };
          }),
        );
      }
      return;
    }

    const { id, ...updates } = input;
    const updated = await TransactionRepo.update(id, updates);
    setTransactions((prev) =>
      prev
        .map((t) => (t.id === updated.id ? updated : t))
        .sort((a, b) => new Date(b.transacted_at).getTime() - new Date(a.transacted_at).getTime()),
    );
    const updatedBudgets = await BudgetRepo.findWithSpentByUser(user.id);
    setBudgets(updatedBudgets);
  };

  const deleteTransaction = async (id: string) => {
    if (isDemoMode || !user) {
      const target = transactions.find((t) => t.id === id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (target && target.type === 'expense') {
        setBudgets((prev) =>
          prev.map((b) =>
            b.category === target.category
              ? { ...b, spent_amount: Math.max(0, b.spent_amount - target.amount) }
              : b,
          ),
        );
      }
      return;
    }
    await TransactionRepo.softDelete(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const updatedBudgets = await BudgetRepo.findWithSpentByUser(user.id);
    setBudgets(updatedBudgets);
  };

  const updateBudgetLimit = async (input: UpdateBudgetLimitInput) => {
    if (isDemoMode || !user) {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category === input.category ? { ...b, limit_amount: input.limit_amount } : b,
        ),
      );
      return;
    }
    await BudgetService.updateLimit(user.id, input);
    const updatedBudgets = await BudgetRepo.findWithSpentByUser(user.id);
    setBudgets(updatedBudgets);
  };

  const addSavingsGoal = async (input: CreateSavingsGoalInput) => {
    if (isDemoMode || !user) {
      const mock: SavingsGoalModel = {
        ...input,
        id: `goal_${Date.now()}`,
        user_id: 'demo',
        current_amount: 0,
        is_complete: false,
        created_at: new Date().toISOString(),
        weekly_suggested: input.weekly_suggested ?? 0,
        target_date: input.target_date ?? null,
      };
      setSavingsGoals((prev) => [...prev, mock]);
      return;
    }
    const newGoal = await SavingsService.createGoal(user.id, input);
    setSavingsGoals((prev) => [...prev, newGoal]);
  };

  const contributeToGoal = async (input: ContributeToGoalInput) => {
    const existing = savingsGoals.find((g) => g.id === input.goal_id);
    if (!existing) return;

    if (isDemoMode || !user) {
      const newAmount = Math.min(existing.target_amount, existing.current_amount + input.amount);
      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === input.goal_id
            ? { ...g, current_amount: newAmount, is_complete: newAmount >= g.target_amount }
            : g,
        ),
      );
      return;
    }
    const updated = await SavingsService.contributeToGoal(user.id, input, existing);
    setSavingsGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    // Reload transactions so the contribution expense appears
    const txs = await TransactionRepo.findByUser(user.id);
    setTransactions(txs);
  };

  const updateSavingsGoal = async (input: UpdateSavingsGoalInput) => {
    const existing = savingsGoals.find((g) => g.id === input.id);
    if (!existing) return;

    if (isDemoMode || !user) {
      const targetAmount = input.target_amount ?? existing.target_amount;
      const targetDate = input.target_date !== undefined ? input.target_date : existing.target_date;
      const currentAmount = input.current_amount !== undefined ? input.current_amount : existing.current_amount;
      const isComplete = currentAmount >= targetAmount;

      let weeklySuggested = input.weekly_suggested ?? existing.weekly_suggested;
      if (targetDate && targetDate !== 'Open-ended' && (input.target_amount !== undefined || input.target_date !== undefined)) {
        const targetMs = new Date(targetDate).getTime();
        const nowMs = Date.now();
        const weeks = Math.max(1, Math.ceil((targetMs - nowMs) / (7 * 24 * 60 * 60 * 1000)));
        weeklySuggested = parseFloat((targetAmount / weeks).toFixed(2));
      }

      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === input.id
            ? {
                ...g,
                title: input.title ?? g.title,
                target_amount: targetAmount,
                target_date: targetDate,
                current_amount: currentAmount,
                weekly_suggested: weeklySuggested,
                is_complete: isComplete,
              }
            : g,
        ),
      );
      return;
    }

    const updated = await SavingsService.updateGoal(user.id, input, existing);
    setSavingsGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const deleteSavingsGoal = async (goalId: string) => {
    if (isDemoMode || !user) {
      setSavingsGoals((prev) => prev.filter((g) => g.id !== goalId));
      return;
    }
    await SavingsService.deleteGoal(user.id, goalId);
    setSavingsGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const addSharedExpense = async (input: CreateGroupExpenseInput) => {
    const currentMember = isDemoMode || !user
      ? members.find((m) => m.id === 'user_1') || members[0]
      : members.find((m) => m.user_id === user.id) || members[0];
    const currentMemberId = currentMember?.id || 'user_1';

    if (isDemoMode || !user) {
      const mock: GroupExpenseModel = {
        ...input,
        id: `sh_${Date.now()}`,
        is_settlement: false,
        created_at: new Date().toISOString(),
      };
      setSharedExpenses((prev) => [mock, ...prev]);

      // If current user paid, record their personal share as an expense transaction
      if (input.paid_by_member_id === currentMemberId) {
        const myShare = parseFloat((input.amount / input.split_member_ids.length).toFixed(2));
        const mockTx: TransactionModel = {
          id: `tx_share_${Date.now()}`,
          user_id: 'demo',
          title: `${input.title} (your share)`,
          amount: myShare,
          type: 'expense',
          category: (input.category as any) || 'bills',
          note: 'Split with roommates',
          is_recurring: false,
          is_void: false,
          journal_entry_id: null,
          payment_account_id: null,
          transacted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setTransactions((prev) => [mockTx, ...prev]);
        setBudgets((prev) =>
          prev.map((b) =>
            b.category === input.category
              ? { ...b, spent_amount: b.spent_amount + myShare }
              : b,
          ),
        );
      }
      return;
    }
    const expense = await SharedExpenseService.addSharedExpense(user.id, currentMemberId, input);
    setSharedExpenses((prev) => [expense, ...prev]);
    const txs = await TransactionRepo.findByUser(user.id);
    setTransactions(txs);
  };

  const settleDebt = async (input: SettleDebtInput) => {
    const currentMember = isDemoMode || !user
      ? members.find((m) => m.id === 'user_1') || members[0]
      : members.find((m) => m.user_id === user.id) || members[0];
    const currentMemberId = currentMember?.id || 'user_1';

    if (isDemoMode || !user) {
      const mock: GroupExpenseModel = {
        id: `settle_${Date.now()}`,
        group_id: input.group_id,
        title: 'Settlement payment',
        amount: input.amount,
        paid_by_member_id: input.from_member_id,
        split_member_ids: [input.to_member_id],
        category: 'bills',
        is_settlement: true,
        created_at: new Date().toISOString(),
      };
      setSharedExpenses((prev) => [mock, ...prev]);

      // If current user paid someone back
      if (input.from_member_id === currentMemberId) {
        const toMember = members.find((m) => m.id === input.to_member_id);
        const mockTx: TransactionModel = {
          id: `tx_settle_${Date.now()}`,
          user_id: 'demo',
          title: `Paid back ${toMember?.display_name ?? 'roommate'}`,
          amount: input.amount,
          type: 'expense',
          category: 'bills',
          note: 'Roommate debt settlement',
          is_recurring: false,
          is_void: false,
          journal_entry_id: null,
          payment_account_id: null,
          transacted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setTransactions((prev) => [mockTx, ...prev]);
      } else if (input.to_member_id === currentMemberId) {
        const fromMember = members.find((m) => m.id === input.from_member_id);
        const mockTx: TransactionModel = {
          id: `tx_settle_${Date.now()}`,
          user_id: 'demo',
          title: `${fromMember?.display_name ?? 'Roommate'} settled debt`,
          amount: input.amount,
          type: 'income',
          category: 'other',
          note: 'Roommate debt repayment',
          is_recurring: false,
          is_void: false,
          journal_entry_id: null,
          payment_account_id: null,
          transacted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setTransactions((prev) => [mockTx, ...prev]);
      }
      return;
    }
    await SharedExpenseService.settleDebt(user.id, currentMemberId, members, input);
    const [expenses, txs] = await Promise.all([
      GroupExpenseRepo.findExpensesByGroup(input.group_id),
      TransactionRepo.findByUser(user.id),
    ]);
    setSharedExpenses(expenses);
    setTransactions(txs);
  };

  const FRIEND_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

  const addMember = async (displayName: string, avatarColor?: string): Promise<GroupMemberModel> => {
    const trimmed = displayName.trim();
    const color = avatarColor || FRIEND_COLORS[members.length % FRIEND_COLORS.length];

    if (isDemoMode || !user) {
      const newMember: GroupMemberModel = {
        id: `user_${Date.now()}`,
        group_id: 'grp_demo',
        user_id: null,
        display_name: trimmed,
        avatar_color: color,
        is_external: true,
        created_at: new Date().toISOString(),
      };
      setMembers((prev) => [...prev, newMember]);
      return newMember;
    }

    const defaultGroupId = members[0]?.group_id || 'grp_default';
    const created = await GroupExpenseRepo.addMember({
      group_id: defaultGroupId,
      display_name: trimmed,
      avatar_color: color,
      is_external: true,
    });
    setMembers((prev) => [...prev, created]);
    return created;
  };

  const removeMember = async (memberId: string): Promise<void> => {
    if (isDemoMode || !user) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      return;
    }
    await GroupExpenseRepo.deleteMember(memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const updatePayPeriod = async (input: UpdatePayPeriodInput) => {
    if (isDemoMode || !user || !payPeriod) {
      setPayPeriod((prev) => prev ? { ...prev, ...input } : prev);
      return;
    }
    const updated = await PayPeriodRepo.update(payPeriod.id, input);
    setPayPeriod(updated);
  };

  const resetPayPeriod = async () => {
    if (isDemoMode || !user) {
      setPayPeriod(DEMO_PAY_PERIOD);
      return;
    }
    await PayPeriodRepo.reset(user.id);
    const period = await PayPeriodRepo.findActive(user.id);
    setPayPeriod(period);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        budgetSummaries,
        subscriptions,
        savingsGoals,
        payPeriod,
        members,
        sharedExpenses,
        debtBalances,
        isLoading,
        balance,
        dailyBudgetStats,
        totalBudgetLimit,
        totalBudgetSpent,
        totalSubscriptionsCost,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgetLimit,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        contributeToGoal,
        addSharedExpense,
        settleDebt,
        addMember,
        removeMember,
        updatePayPeriod,
        resetPayPeriod,
        reload: load,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
  return ctx;
};
