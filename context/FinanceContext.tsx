import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  Transaction,
  CategoryBudget,
  SubscriptionItem,
  Roommate,
  SharedExpense,
  DebtBalance,
  SavingsGoal,
  StudentProfile,
  ExpenseCategory,
  TransactionType,
  PayPeriod,
  DailyBudgetStats,
  BudgetHealthStatus,
} from '../types/finance';

interface FinanceContextType {
  balance: number;
  profile: StudentProfile;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  subscriptions: SubscriptionItem[];
  roommates: Roommate[];
  sharedExpenses: SharedExpense[];
  debtBalances: DebtBalance[];
  savingsGoals: SavingsGoal[];
  payPeriod: PayPeriod;
  dailyBudgetStats: DailyBudgetStats;
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  totalSubscriptionsCost: number;
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  deleteTransaction: (id: string) => void;
  addSharedExpense: (expense: Omit<SharedExpense, 'id' | 'date'>) => void;
  settleDebt: (fromId: string, toId: string, amount: number) => void;
  updateBudgetLimit: (category: ExpenseCategory, newLimit: number) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  updatePayPeriod: (updates: Partial<Omit<PayPeriod, 'id'>>) => void;
  resetPayPeriod: () => void;
}

const INITIAL_PROFILE: StudentProfile = {
  name: 'Sam',
  incomePattern: 'monthly_allowance',
  nextIncomeDays: 9,
  nextIncomeAmount: 750,
  nextIncomeLabel: 'Monthly Allowance',
};

// Next payday in 9 days
const now = new Date();
const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const INITIAL_PAY_PERIOD: PayPeriod = {
  id: 'period_curr',
  name: currentMonthName,
  startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
  endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
  incomeAmount: 750,
  fixedCostsAmount: 210, // rent share, subscriptions, bills
  savingsTargetAmount: 80, // for savings vault
  currency: '$',
};

const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: 'food', name: 'Food & Dining', limit: 240, spent: 165 },
  { category: 'groceries', name: 'Groceries', limit: 180, spent: 120 },
  { category: 'entertainment', name: 'Entertainment', limit: 90, spent: 78 }, // 86% -> warning!
  { category: 'transport', name: 'Transport & Transit', limit: 60, spent: 22 },
  { category: 'bills', name: 'Bills & Utilities', limit: 70, spent: 48 },
  { category: 'education', name: 'Campus & Books', limit: 120, spent: 45 },
];

const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [
  { id: 'sub_1', name: 'Spotify Student', amount: 5.99, renewalDay: 14, category: 'entertainment' },
  { id: 'sub_2', name: 'iCloud 200GB', amount: 2.99, renewalDay: 22, category: 'bills' },
  { id: 'sub_3', name: 'Campus Rec & Gym', amount: 18.00, renewalDay: 1, category: 'bills' },
];

const INITIAL_ROOMMATES: Roommate[] = [
  { id: 'user_1', name: 'You', isCurrentUser: true, avatarColor: '#0F172A' },
  { id: 'user_2', name: 'Alex', isCurrentUser: false, avatarColor: '#FF6B4A' },
  { id: 'user_3', name: 'Maya', isCurrentUser: false, avatarColor: '#EC4899' },
];

const INITIAL_SHARED_EXPENSES: SharedExpense[] = [
  {
    id: 'sh_1',
    title: 'Apartment 304 Monthly Rent',
    amount: 1500.00,
    paidById: 'user_1',
    paidByName: 'You',
    splitWithIds: ['user_1', 'user_2', 'user_3'],
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    category: 'bills',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    title: 'Campus Cafe Cortado',
    amount: 4.50,
    type: 'expense',
    category: 'food',
    date: new Date().toISOString(),
    note: 'Quick study break',
  },
  {
    id: 'tx_2',
    title: 'Trader Joe’s Grocery Run',
    amount: 38.20,
    type: 'expense',
    category: 'groceries',
    date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    note: 'Meal prep supplies',
  },
  {
    id: 'tx_3',
    title: 'Peer Tutoring Math 101',
    amount: 80.00,
    type: 'income',
    category: 'part_time',
    date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    note: '2 hour session with Leo',
  },
  {
    id: 'tx_4',
    title: 'Semester Textbook Rental',
    amount: 35.00,
    type: 'expense',
    category: 'education',
    date: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    note: 'Microeconomics 4th ed',
  },
  {
    id: 'tx_5',
    title: 'Subway Pass Reload',
    amount: 20.00,
    type: 'expense',
    category: 'transport',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'tx_6',
    title: 'Spotify Student',
    amount: 5.99,
    type: 'expense',
    category: 'entertainment',
    date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    isRecurring: true,
  },
  {
    id: 'tx_7',
    title: 'Academic Scholarship Grant',
    amount: 500.00,
    type: 'income',
    category: 'scholarship',
    date: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString(),
    note: 'Dean’s Honor list award',
  },
];

const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal_1',
    title: 'New M3 MacBook Air',
    targetAmount: 1100,
    currentAmount: 780,
    targetDate: 'Dec 15, 2026',
    weeklySuggested: 32,
  },
  {
    id: 'goal_2',
    title: 'Spring Break Road Trip',
    targetAmount: 350,
    currentAmount: 210,
    targetDate: 'Mar 20, 2027',
    weeklySuggested: 16,
  },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile] = useState<StudentProfile>(INITIAL_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<CategoryBudget[]>(INITIAL_BUDGETS);
  const [subscriptions] = useState<SubscriptionItem[]>(INITIAL_SUBSCRIPTIONS);
  const [roommates] = useState<Roommate[]>(INITIAL_ROOMMATES);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>(INITIAL_SHARED_EXPENSES);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [payPeriod, setPayPeriod] = useState<PayPeriod>(INITIAL_PAY_PERIOD);

  // Dynamic daily budget until payday calculation (automatic dynamic re-planning on expenses)
  const dailyBudgetStats = useMemo<DailyBudgetStats>(() => {
    const spendablePot = Math.max(
      0,
      payPeriod.incomeAmount - payPeriod.fixedCostsAmount - payPeriod.savingsTargetAmount
    );

    const startMs = new Date(payPeriod.startDate).getTime();
    const currentDate = new Date();

    const periodExpenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const tMs = new Date(t.date).getTime();
      return tMs >= startMs;
    });

    const totalExpenses = periodExpenses.reduce((acc, t) => acc + t.amount, 0);
    const remainingPot = spendablePot - totalExpenses;

    const todayZero = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    const endZero = new Date(new Date(payPeriod.endDate).getFullYear(), new Date(payPeriod.endDate).getMonth(), new Date(payPeriod.endDate).getDate()).getTime();
    const startZero = new Date(new Date(payPeriod.startDate).getFullYear(), new Date(payPeriod.startDate).getMonth(), new Date(payPeriod.startDate).getDate()).getTime();

    const daysTotal = Math.max(1, Math.round((endZero - startZero) / (1000 * 60 * 60 * 24)) + 1);
    const daysRemaining = Math.max(0, Math.round((endZero - todayZero) / (1000 * 60 * 60 * 24)) + 1);

    const isOverBudget = remainingPot < 0;
    const overspendAmount = isOverBudget ? Math.abs(remainingPot) : 0;
    const dailyLimit = daysRemaining > 0 && remainingPot > 0 ? remainingPot / daysRemaining : 0;

    const spentToday = transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        return (
          tDate.getFullYear() === currentDate.getFullYear() &&
          tDate.getMonth() === currentDate.getMonth() &&
          tDate.getDate() === currentDate.getDate()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const remainingToday = Math.max(0, dailyLimit - spentToday);

    const baseDailyPace = spendablePot / daysTotal;
    let status: BudgetHealthStatus = 'on_track';
    if (isOverBudget) {
      status = 'over_budget';
    } else if (dailyLimit < baseDailyPace * 0.5) {
      status = 'warning';
    }

    return {
      spendablePot,
      totalExpenses,
      remainingPot,
      daysRemaining,
      dailyLimit,
      spentToday,
      remainingToday,
      status,
      isOverBudget,
      overspendAmount,
      daysTotal,
    };
  }, [payPeriod, transactions]);

  const updatePayPeriod = (updates: Partial<Omit<PayPeriod, 'id'>>) => {
    setPayPeriod((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const resetPayPeriod = () => {
    setPayPeriod(INITIAL_PAY_PERIOD);
  };

  // Dynamic balance calculated from initial base balance + income - expenses
  const balance = useMemo(() => {
    const base = 1200.00;
    const diff = transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
    return Math.max(0, base + diff);
  }, [transactions]);

  // Overall budget totals
  const totalBudgetLimit = useMemo(() => budgets.reduce((acc, b) => acc + b.limit, 0), [budgets]);
  const totalBudgetSpent = useMemo(() => budgets.reduce((acc, b) => acc + b.spent, 0), [budgets]);

  // Total recurring subscriptions cost
  const totalSubscriptionsCost = useMemo(
    () => subscriptions.reduce((acc, s) => acc + s.amount, 0),
    [subscriptions]
  );

  // Calculate pairwise debts across roommates
  const debtBalances = useMemo(() => {
    // Map of `${fromId}_${toId}` -> amount
    const debtMatrix: { [key: string]: number } = {};

    sharedExpenses.forEach((expense) => {
      const share = expense.amount / expense.splitWithIds.length;
      expense.splitWithIds.forEach((memberId) => {
        if (memberId !== expense.paidById) {
          const key = `${memberId}_${expense.paidById}`;
          debtMatrix[key] = (debtMatrix[key] || 0) + share;
        }
      });
    });

    const result: DebtBalance[] = [];
    const membersMap = new Map(roommates.map((r) => [r.id, r.name]));

    // Net out debts between pairs
    const processedPairs = new Set<string>();
    roommates.forEach((r1) => {
      roommates.forEach((r2) => {
        if (r1.id === r2.id) return;
        const pairKey = [r1.id, r2.id].sort().join('_');
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const r1OwesR2 = debtMatrix[`${r1.id}_${r2.id}`] || 0;
        const r2OwesR1 = debtMatrix[`${r2.id}_${r1.id}`] || 0;
        const net = r1OwesR2 - r2OwesR1;

        if (Math.abs(net) > 0.01) {
          if (net > 0) {
            result.push({
              id: `${r1.id}_${r2.id}`,
              fromId: r1.id,
              fromName: membersMap.get(r1.id) || r1.name,
              toId: r2.id,
              toName: membersMap.get(r2.id) || r2.name,
              amount: net,
            });
          } else {
            result.push({
              id: `${r2.id}_${r1.id}`,
              fromId: r2.id,
              fromName: membersMap.get(r2.id) || r2.name,
              toId: r1.id,
              toName: membersMap.get(r1.id) || r1.name,
              amount: -net,
            });
          }
        }
      });
    });

    return result;
  }, [sharedExpenses, roommates]);

  // Operations
  const addTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}`,
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Update budget if it is an expense in a category
    if (tx.type === 'expense') {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category === tx.category ? { ...b, spent: b.spent + tx.amount } : b
        )
      );
    }
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (target && target.type === 'expense') {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category === target.category
            ? { ...b, spent: Math.max(0, b.spent - target.amount) }
            : b
        )
      );
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addSharedExpense = (expense: Omit<SharedExpense, 'id' | 'date'>) => {
    const newExpense: SharedExpense = {
      ...expense,
      id: `sh_${Date.now()}`,
      date: new Date().toISOString(),
    };
    setSharedExpenses((prev) => [newExpense, ...prev]);

    // If current user paid for it, log user's personal share as an expense
    if (expense.paidById === 'user_1') {
      const myShare = expense.amount / expense.splitWithIds.length;
      addTransaction({
        title: `${expense.title} (Your 1/${expense.splitWithIds.length} share)`,
        amount: myShare,
        type: 'expense',
        category: expense.category,
        note: `Split with roommates`,
      });
    }
  };

  const settleDebt = (fromId: string, toId: string, amount: number) => {
    const fromMember = roommates.find((r) => r.id === fromId)?.name || 'Roommate';
    const toMember = roommates.find((r) => r.id === toId)?.name || 'Roommate';

    // Record settle-up payment by reducing debt through an inverse shared credit or resetting
    const settlementExpense: SharedExpense = {
      id: `settle_${Date.now()}`,
      title: `Settled: ${fromMember} paid ${toMember}`,
      amount: amount,
      paidById: fromId,
      paidByName: fromMember,
      splitWithIds: [toId],
      date: new Date().toISOString(),
      category: 'bills',
    };

    setSharedExpenses((prev) => [settlementExpense, ...prev]);

    // If current user was involved, update transactions
    if (fromId === 'user_1') {
      addTransaction({
        title: `Paid back ${toMember}`,
        amount: amount,
        type: 'expense',
        category: 'bills',
        note: 'Roommate debt settlement',
      });
    } else if (toId === 'user_1') {
      addTransaction({
        title: `${fromMember} settled debt`,
        amount: amount,
        type: 'income',
        category: 'other',
        note: 'Roommate debt repayment',
      });
    }
  };

  const updateBudgetLimit = (category: ExpenseCategory, newLimit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit: newLimit } : b))
    );
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      currentAmount: 0,
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
  };

  const contributeToGoal = (goalId: string, amount: number) => {
    setSavingsGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g
      )
    );
    addTransaction({
      title: `Saved towards goal`,
      amount,
      type: 'expense',
      category: 'bills',
      note: 'Transfer to savings vault',
    });
  };

  return (
    <FinanceContext.Provider
      value={{
        balance,
        profile,
        transactions,
        budgets,
        subscriptions,
        roommates,
        sharedExpenses,
        debtBalances,
        savingsGoals,
        payPeriod,
        dailyBudgetStats,
        totalBudgetLimit,
        totalBudgetSpent,
        totalSubscriptionsCost,
        addTransaction,
        deleteTransaction,
        addSharedExpense,
        settleDebt,
        updateBudgetLimit,
        addSavingsGoal,
        contributeToGoal,
        updatePayPeriod,
        resetPayPeriod,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
