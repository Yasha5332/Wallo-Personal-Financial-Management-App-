/**
 * savings.service.ts
 * Business logic: savings goal creation, contributions, and weekly suggestions.
 * Calls SavingsGoalRepo and TransactionRepo. No Supabase directly.
 */
import { SavingsGoalRepo } from '../repos/savings-goal.repo';
import { TransactionRepo } from '../repos/transaction.repo';
import {
  CreateSavingsGoalSchema,
  ContributeToGoalSchema,
  UpdateSavingsGoalSchema,
  type CreateSavingsGoalInput,
  type ContributeToGoalInput,
  type UpdateSavingsGoalInput,
} from '../schemas/savings-goal.schema';
import { CreateTransactionSchema } from '../schemas/transaction.schema';
import type { SavingsGoalModel } from '../models/savings-goal.model';

export const SavingsService = {

  /**
   * Create a new savings goal.
   * Automatically computes weekly_suggested if a target_date is provided.
   */
  async createGoal(
    userId: string,
    rawInput: CreateSavingsGoalInput,
  ): Promise<SavingsGoalModel> {
    const validated = CreateSavingsGoalSchema.parse(rawInput);

    // Auto-compute weekly suggestion from target date if not provided
    let weeklySuggested = validated.weekly_suggested ?? 0;
    if (validated.target_date && !rawInput.weekly_suggested) {
      const targetMs = new Date(validated.target_date).getTime();
      const nowMs = Date.now();
      const weeks = Math.max(1, Math.ceil((targetMs - nowMs) / (7 * 24 * 60 * 60 * 1000)));
      weeklySuggested = parseFloat((validated.target_amount / weeks).toFixed(2));
    }

    return SavingsGoalRepo.create(userId, { ...validated, weekly_suggested: weeklySuggested });
  },

  /**
   * Contribute an amount to a savings goal.
   * Updates the goal's current_amount (capped at target) and marks complete if reached.
   * Also logs the contribution as a personal expense transaction.
   */
  async contributeToGoal(
    userId: string,
    rawInput: ContributeToGoalInput,
    existingGoal: SavingsGoalModel,
  ): Promise<SavingsGoalModel> {
    const validated = ContributeToGoalSchema.parse(rawInput);

    const newAmount = Math.min(
      existingGoal.target_amount,
      existingGoal.current_amount + validated.amount,
    );
    const isComplete = newAmount >= existingGoal.target_amount;

    // Update goal progress in DB
    const updated = await SavingsGoalRepo.updateProgress(
      validated.goal_id,
      newAmount,
      isComplete,
    );

    // Log contribution as a personal expense (money moved to savings)
    await TransactionRepo.create(
      userId,
      CreateTransactionSchema.parse({
        title: `Saved toward: ${existingGoal.title}`,
        amount: validated.amount,
        type: 'expense',
        category: 'bills',
        note: 'Transfer to savings vault',
        is_recurring: false,
      }),
    );

    return updated;
  },

  /**
   * Update an existing savings goal.
   * Re-calculates weekly suggested amount if target or date has changed.
   */
  async updateGoal(
    userId: string,
    rawInput: UpdateSavingsGoalInput,
    existingGoal: SavingsGoalModel,
  ): Promise<SavingsGoalModel> {
    const validated = UpdateSavingsGoalSchema.parse(rawInput);

    const targetAmount = validated.target_amount ?? existingGoal.target_amount;
    const targetDate = validated.target_date !== undefined ? validated.target_date : existingGoal.target_date;
    const currentAmount = validated.current_amount !== undefined ? validated.current_amount : existingGoal.current_amount;
    const isComplete = currentAmount >= targetAmount;

    let weeklySuggested = validated.weekly_suggested ?? existingGoal.weekly_suggested;
    if (targetDate && targetDate !== 'Open-ended' && (validated.target_amount !== undefined || validated.target_date !== undefined)) {
      const targetMs = new Date(targetDate).getTime();
      const nowMs = Date.now();
      const weeks = Math.max(1, Math.ceil((targetMs - nowMs) / (7 * 24 * 60 * 60 * 1000)));
      weeklySuggested = parseFloat((targetAmount / weeks).toFixed(2));
    }

    return SavingsGoalRepo.update(validated.id, {
      title: validated.title ?? existingGoal.title,
      target_amount: targetAmount,
      target_date: targetDate,
      current_amount: currentAmount,
      weekly_suggested: weeklySuggested,
      is_complete: isComplete,
    });
  },

  /** Delete a savings goal permanently */
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    await SavingsGoalRepo.delete(goalId);
  },

  /** Compute overall totals across all goals */
  computeTotals(goals: SavingsGoalModel[]): {
    totalSaved: number;
    totalTarget: number;
    overallProgress: number;
  } {
    const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
    const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
    return {
      totalSaved,
      totalTarget,
      overallProgress: totalTarget > 0 ? totalSaved / totalTarget : 0,
    };
  },

};
