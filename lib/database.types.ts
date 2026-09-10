// =============================================
// Database row types matching supabase/schema.sql
// =============================================

export interface DbProfile {
  id: string;
  name: string;
  income_pattern: 'fixed_salary' | 'monthly_allowance' | 'semester_lump_sum' | 'no_steady_income';
  next_income_days: number;
  next_income_amount: number;
  next_income_label: string;
  created_at: string;
}

export interface DbAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  sub_type: string | null;
  is_default: boolean;
  currency: string;
  created_at: string;
}

export interface DbJournalEntry {
  id: string;
  user_id: string;
  memo: string | null;
  posted_at: string;
  is_void: boolean;
  source: string;
}

export interface DbJournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string | null;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  journal_entry_id: string | null;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  payment_account_id: string | null;
  note: string | null;
  is_recurring: boolean;
  is_void: boolean;
  transacted_at: string;
  created_at: string;
}

export interface DbBudget {
  id: string;
  user_id: string;
  category: string;
  name: string;
  limit_amount: number;
  period_start: string;
  created_at: string;
}

export interface DbGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface DbGroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  display_name: string;
  avatar_color: string;
  is_external: boolean;
  created_at: string;
}

export interface DbGroupExpense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by_member_id: string;
  split_member_ids: string[];
  category: string;
  is_settlement: boolean;
  created_at: string;
}

export interface DbGroupDebt {
  id: string;
  group_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  updated_at: string;
}
