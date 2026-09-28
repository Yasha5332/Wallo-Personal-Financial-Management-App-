/**
 * pay-period.model.ts
 * Mirrors the `pay_periods` table row exactly.
 */

export interface PayPeriodModel {
  id: string;
  user_id: string;
  name: string;         // e.g. "September 2026"
  start_date: string;   // DATE as ISO string e.g. "2026-09-01"
  end_date: string;     // DATE as ISO string — the payday
  income_amount: number;
  fixed_costs_amount: number;
  savings_target_amount: number;
  currency: string;     // e.g. "USD"
  is_active: boolean;
  created_at: string;
}
