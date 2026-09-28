/**
 * budget.model.ts
 * Mirrors the `budgets` table row exactly.
 * `spent_amount` comes from the `budget_with_spent` computed view.
 */

export interface BudgetModel {
  id: string;
  user_id: string;
  category: string;
  name: string;
  limit_amount: number;
  period_start: string; // DATE as ISO string e.g. "2026-09-01"
  created_at: string;
}

/** Extended shape returned by the `budget_with_spent` Postgres view */
export interface BudgetWithSpent extends BudgetModel {
  spent_amount: number;
}
