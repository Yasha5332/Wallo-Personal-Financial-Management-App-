/**
 * group-expense.model.ts
 * Mirrors the `group_expenses` and `group_debts` table rows.
 */

export interface GroupExpenseModel {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by_member_id: string;
  split_member_ids: string[]; // array of group_member IDs
  category: string;
  is_settlement: boolean;
  created_at: string;
}

export interface GroupDebtModel {
  id: string;
  group_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  updated_at: string;
}

/**
 * Computed pairwise debt — used by the UI.
 * Derived client-side from GroupExpenseModel[], not stored directly.
 */
export interface ComputedDebtBalance {
  id: string;
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}
