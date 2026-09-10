export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'entertainment'
  | 'bills'
  | 'education';

export type IncomeCategory =
  | 'allowance'
  | 'part_time'
  | 'scholarship'
  | 'loan_aid'
  | 'other';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO date string
  note?: string;
  isRecurring?: boolean;
  sharedGroupId?: string;
  paidBy?: string;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  name: string;
  limit: number;
  spent: number;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  renewalDay: number;
  category: ExpenseCategory;
}

export interface Roommate {
  id: string;
  name: string;
  isCurrentUser: boolean;
  avatarColor: string;
}

export interface SharedExpense {
  id: string;
  title: string;
  amount: number;
  paidById: string;
  paidByName: string;
  splitWithIds: string[];
  date: string;
  category: ExpenseCategory;
}

export interface DebtBalance {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  weeklySuggested: number;
}

export interface StudentProfile {
  name: string;
  incomePattern: 'monthly_allowance' | 'part_time_job' | 'semester_lump_sum' | 'no_steady_income';
  nextIncomeDays: number;
  nextIncomeAmount: number;
  nextIncomeLabel: string;
}

export type BudgetHealthStatus = 'on_track' | 'warning' | 'over_budget';

export interface PayPeriod {
  id: string;
  name: string; // e.g., "September 2026"
  startDate: string; // ISO date string
  endDate: string; // ISO date string (payday)
  incomeAmount: number;
  fixedCostsAmount: number;
  savingsTargetAmount: number;
  currency?: string;
}

export interface DailyBudgetStats {
  spendablePot: number; // income - fixedCosts - savingsTarget
  totalExpenses: number; // sum of expenses in this period
  remainingPot: number; // spendablePot - totalExpenses
  daysRemaining: number; // days between today and endDate (inclusive)
  dailyLimit: number; // remainingPot / daysRemaining
  spentToday: number; // expenses logged today
  remainingToday: number; // dailyLimit - spentToday
  status: BudgetHealthStatus;
  isOverBudget: boolean;
  overspendAmount: number;
  daysTotal: number;
}
