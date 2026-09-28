/**
 * budget.repo.ts
 * DAO layer — raw Supabase CRUD for the `budgets` table
 * and the `budget_with_spent` computed view.
 * No business logic. No calculations. Just data access.
 */
import { supabase } from '../supabase';
import type { BudgetModel, BudgetWithSpent } from '../models/budget.model';
import type { UpdateBudgetLimitInput } from '../schemas/budget.schema';

export const BudgetRepo = {

  /**
   * Fetch budgets for the current period from the computed view.
   * Returns spent_amount computed by Postgres (SUM of matching transactions).
   */
  async findWithSpentByUser(userId: string): Promise<BudgetWithSpent[]> {
    const { data, error } = await supabase
      .from('budget_with_spent')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as BudgetWithSpent[];
  },

  /** Fetch raw budget rows without the computed spent amount */
  async findByUser(userId: string): Promise<BudgetModel[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as BudgetModel[];
  },

  /** Update the spending limit for a specific category */
  async updateLimit(
    userId: string,
    input: UpdateBudgetLimitInput,
  ): Promise<BudgetModel> {
    const { data, error } = await supabase
      .from('budgets')
      .update({ limit_amount: input.limit_amount })
      .eq('user_id', userId)
      .eq('category', input.category)
      .select()
      .single();

    if (error) throw error;
    return data as BudgetModel;
  },

};
