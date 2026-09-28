/**
 * demo-data.ts
 * Static mock data used when Supabase is not configured (demo mode).
 * Replaces the inline INITIAL_* constants that were in FinanceContext.
 */
import type { TransactionModel } from './models/transaction.model';
import type { BudgetWithSpent } from './models/budget.model';
import type { SubscriptionModel } from './models/subscription.model';
import type { SavingsGoalModel } from './models/savings-goal.model';
import type { PayPeriodModel } from './models/pay-period.model';
import type { GroupMemberModel } from './models/group.model';
import type { GroupExpenseModel } from './models/group-expense.model';

const now = new Date();
const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
const nextPayday = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString();

export const DEMO_PAY_PERIOD: PayPeriodModel = {
  id: 'period_demo',
  user_id: 'demo',
  name: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  start_date: thisMonth.slice(0, 10),
  end_date: nextPayday.slice(0, 10),
  income_amount: 750,
  fixed_costs_amount: 210,
  savings_target_amount: 80,
  currency: 'USD',
  is_active: true,
  created_at: thisMonth,
};

export const DEMO_TRANSACTIONS: TransactionModel[] = [
  {
    id: 'tx_1', user_id: 'demo', journal_entry_id: null, payment_account_id: null,
    title: 'Campus Cafe Cortado', amount: 4.50, type: 'expense', category: 'food',
    note: 'Quick study break', is_recurring: false, is_void: false,
    transacted_at: new Date().toISOString(), created_at: new Date().toISOString(),
  },
  {
    id: 'tx_2', user_id: 'demo', journal_entry_id: null, payment_account_id: null,
    title: 'Trader Joe\'s Grocery Run', amount: 38.20, type: 'expense', category: 'groceries',
    note: 'Meal prep supplies', is_recurring: false, is_void: false,
    transacted_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 'tx_3', user_id: 'demo', journal_entry_id: null, payment_account_id: null,
    title: 'Peer Tutoring Math 101', amount: 80.00, type: 'income', category: 'part_time',
    note: '2 hour session with Leo', is_recurring: false, is_void: false,
    transacted_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    id: 'tx_4', user_id: 'demo', journal_entry_id: null, payment_account_id: null,
    title: 'Semester Textbook Rental', amount: 35.00, type: 'expense', category: 'education',
    note: 'Microeconomics 4th ed', is_recurring: false, is_void: false,
    transacted_at: new Date(Date.now() - 50 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 50 * 3600000).toISOString(),
  },
  {
    id: 'tx_5', user_id: 'demo', journal_entry_id: null, payment_account_id: null,
    title: 'Subway Pass Reload', amount: 20.00, type: 'expense', category: 'transport',
    note: null, is_recurring: false, is_void: false,
    transacted_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
  {
    id: 'tx_6', user_id: 'demo', journal_entry_id: null, payment_account_id: null,
    title: 'Spotify Student', amount: 5.99, type: 'expense', category: 'entertainment',
    note: null, is_recurring: true, is_void: false,
    transacted_at: new Date(Date.now() - 120 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 120 * 3600000).toISOString(),
  },
  {
    id: 'tx_7', user_id: 'demo', journal_entry_id: null, payment_account_id: null,
    title: 'Academic Scholarship Grant', amount: 500.00, type: 'income', category: 'scholarship',
    note: "Dean's Honor list award", is_recurring: false, is_void: false,
    transacted_at: new Date(Date.now() - 200 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 200 * 3600000).toISOString(),
  },
];

export const DEMO_BUDGETS: BudgetWithSpent[] = [
  { id: 'b1', user_id: 'demo', category: 'food', name: 'Food & Dining', limit_amount: 240, spent_amount: 165, period_start: thisMonth.slice(0, 10), created_at: thisMonth },
  { id: 'b2', user_id: 'demo', category: 'groceries', name: 'Groceries', limit_amount: 180, spent_amount: 120, period_start: thisMonth.slice(0, 10), created_at: thisMonth },
  { id: 'b3', user_id: 'demo', category: 'entertainment', name: 'Entertainment', limit_amount: 90, spent_amount: 78, period_start: thisMonth.slice(0, 10), created_at: thisMonth },
  { id: 'b4', user_id: 'demo', category: 'transport', name: 'Transport & Transit', limit_amount: 60, spent_amount: 22, period_start: thisMonth.slice(0, 10), created_at: thisMonth },
  { id: 'b5', user_id: 'demo', category: 'bills', name: 'Bills & Utilities', limit_amount: 70, spent_amount: 48, period_start: thisMonth.slice(0, 10), created_at: thisMonth },
  { id: 'b6', user_id: 'demo', category: 'education', name: 'Campus & Books', limit_amount: 120, spent_amount: 45, period_start: thisMonth.slice(0, 10), created_at: thisMonth },
];

export const DEMO_SUBSCRIPTIONS: SubscriptionModel[] = [
  { id: 'sub_1', user_id: 'demo', name: 'Spotify Student', amount: 5.99, renewal_day: 14, category: 'entertainment', is_active: true, created_at: thisMonth },
  { id: 'sub_2', user_id: 'demo', name: 'iCloud 200GB', amount: 2.99, renewal_day: 22, category: 'bills', is_active: true, created_at: thisMonth },
  { id: 'sub_3', user_id: 'demo', name: 'Campus Rec & Gym', amount: 18.00, renewal_day: 1, category: 'bills', is_active: true, created_at: thisMonth },
];

export const DEMO_SAVINGS_GOALS: SavingsGoalModel[] = [
  { id: 'goal_1', user_id: 'demo', title: 'New M3 MacBook Air', target_amount: 1100, current_amount: 780, target_date: 'Dec 15, 2026', weekly_suggested: 32, is_complete: false, created_at: thisMonth },
  { id: 'goal_2', user_id: 'demo', title: 'Spring Break Road Trip', target_amount: 350, current_amount: 210, target_date: 'Mar 20, 2027', weekly_suggested: 16, is_complete: false, created_at: thisMonth },
];

export const DEMO_MEMBERS: GroupMemberModel[] = [
  { id: 'user_1', group_id: 'grp_demo', user_id: 'demo', display_name: 'You', avatar_color: '#0F172A', is_external: false, created_at: thisMonth },
  { id: 'user_2', group_id: 'grp_demo', user_id: null, display_name: 'Alex', avatar_color: '#FF6B4A', is_external: true, created_at: thisMonth },
  { id: 'user_3', group_id: 'grp_demo', user_id: null, display_name: 'Maya', avatar_color: '#EC4899', is_external: true, created_at: thisMonth },
];

export const DEMO_SHARED_EXPENSES: GroupExpenseModel[] = [
  {
    id: 'sh_1',
    group_id: 'grp_demo',
    title: 'Apartment 304 Monthly Rent',
    amount: 1500.00,
    paid_by_member_id: 'user_1',
    split_member_ids: ['user_1', 'user_2', 'user_3'],
    category: 'bills',
    is_settlement: false,
    created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
];
