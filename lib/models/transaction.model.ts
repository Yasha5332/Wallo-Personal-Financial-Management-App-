/**
 * transaction.model.ts
 * Mirrors the `transactions` table row exactly.
 */

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

export interface TransactionModel {
  id: string;
  user_id: string;
  journal_entry_id: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  payment_account_id: string | null;
  note: string | null;
  is_recurring: boolean;
  is_void: boolean;
  transacted_at: string;
  created_at: string;
}
