/**
 * profile.model.ts
 * Mirrors the `profiles` table row exactly.
 */

export type IncomePattern =
  | 'fixed_salary'
  | 'monthly_allowance'
  | 'semester_lump_sum'
  | 'no_steady_income';

export interface ProfileModel {
  id: string;
  name: string;
  income_pattern: IncomePattern;
  next_income_days: number;
  next_income_amount: number;
  next_income_label: string;
  logging_streak: number;
  created_at: string;
}
