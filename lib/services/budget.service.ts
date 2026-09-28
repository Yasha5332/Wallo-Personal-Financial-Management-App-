/**
 * budget.service.ts
 * Business logic: budget CRUD orchestration and per-category spending summaries.
 * Calls BudgetRepo and TransactionRepo. No Supabase directly.
 */
import { BudgetRepo } from '../repos/budget.repo';
import { UpdateBudgetLimitSchema, type UpdateBudgetLimitInput } from '../schemas/budget.schema';
import type { BudgetWithSpent } from '../models/budget.model';

export interface CategoryBudgetSummary {
  category: string;
  name: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressRatio: number;        // 0–1+
  status: 'on_track' | 'warning' | 'over_budget';
}

export const BudgetService = {

  /**
   * Fetch all budgets with their computed spent amounts,
   * and return enriched summary objects ready for the UI.
   */
  async getBudgetSummaries(userId: string): Promise<CategoryBudgetSummary[]> {
    const budgets = await BudgetRepo.findWithSpentByUser(userId);
    return budgets.map((b) => BudgetService.toBudgetSummary(b));
  },

  /**
   * Update the spending limit for a single category.
   * Validates input with Zod before calling the repo.
   */
  async updateLimit(userId: string, rawInput: UpdateBudgetLimitInput): Promise<void> {
    const validated = UpdateBudgetLimitSchema.parse(rawInput);
    await BudgetRepo.updateLimit(userId, validated);
  },

  /** Derive status and ratios from a raw BudgetWithSpent row */
  toBudgetSummary(b: BudgetWithSpent): CategoryBudgetSummary {
    const progressRatio = b.limit_amount > 0 ? b.spent_amount / b.limit_amount : 0;
    const status =
      progressRatio >= 1
        ? 'over_budget'
        : progressRatio >= 0.8
        ? 'warning'
        : 'on_track';

    return {
      category: b.category,
      name: b.name,
      limitAmount: b.limit_amount,
      spentAmount: b.spent_amount,
      remainingAmount: Math.max(0, b.limit_amount - b.spent_amount),
      progressRatio,
      status,
    };
  },

  /** Compute totals across all budgets */
  computeTotals(summaries: CategoryBudgetSummary[]): {
    totalLimit: number;
    totalSpent: number;
    totalRemaining: number;
  } {
    const totalLimit = summaries.reduce((acc, s) => acc + s.limitAmount, 0);
    const totalSpent = summaries.reduce((acc, s) => acc + s.spentAmount, 0);
    return {
      totalLimit,
      totalSpent,
      totalRemaining: Math.max(0, totalLimit - totalSpent),
    };
  },

};
