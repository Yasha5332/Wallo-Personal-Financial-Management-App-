/**
 * savings-goal.model.ts
 * Mirrors the `savings_goals` table row exactly.
 */

export interface SavingsGoalModel {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null; // display string e.g. "Dec 15, 2026"
  weekly_suggested: number;
  is_complete: boolean;
  created_at: string;
}
