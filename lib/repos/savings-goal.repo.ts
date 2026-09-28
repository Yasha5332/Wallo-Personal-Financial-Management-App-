/**
 * savings-goal.repo.ts
 * DAO layer — raw Supabase CRUD for the `savings_goals` table.
 * No business logic. No calculations. Just data access.
 */
import { supabase } from '../supabase';
import type { SavingsGoalModel } from '../models/savings-goal.model';
import type { CreateSavingsGoalInput } from '../schemas/savings-goal.schema';

export const SavingsGoalRepo = {

  /** Fetch all savings goals for a user */
  async findByUser(userId: string): Promise<SavingsGoalModel[]> {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as SavingsGoalModel[];
  },

  /** Insert a new savings goal */
  async create(
    userId: string,
    input: CreateSavingsGoalInput,
  ): Promise<SavingsGoalModel> {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        title: input.title,
        target_amount: input.target_amount,
        current_amount: 0,
        target_date: input.target_date ?? null,
        weekly_suggested: input.weekly_suggested ?? 0,
        is_complete: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SavingsGoalModel;
  },

  /** Update the current saved amount and completion flag */
  async updateProgress(
    id: string,
    currentAmount: number,
    isComplete: boolean,
  ): Promise<SavingsGoalModel> {
    const { data, error } = await supabase
      .from('savings_goals')
      .update({ current_amount: currentAmount, is_complete: isComplete })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SavingsGoalModel;
  },

  /** Update fields of an existing savings goal */
  async update(
    id: string,
    updates: Partial<Omit<SavingsGoalModel, 'id' | 'user_id' | 'created_at'>>,
  ): Promise<SavingsGoalModel> {
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SavingsGoalModel;
  },

  /** Delete a goal permanently */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

};
