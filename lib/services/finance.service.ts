/**
 * finance.service.ts
 * Business logic: balance calculation and daily budget stats.
 * No Supabase calls. No React. Pure computation over models.
 */
import type { TransactionModel } from '../models/transaction.model';
import type { PayPeriodModel } from '../models/pay-period.model';

export type BudgetHealthStatus = 'on_track' | 'warning' | 'over_budget';

export interface DailyBudgetStats {
  spendablePot: number;      // income - fixedCosts - savingsTarget
  totalExpenses: number;     // sum of expenses in this period
  remainingPot: number;      // spendablePot - totalExpenses
  daysRemaining: number;     // days between today and end_date (inclusive)
  daysTotal: number;         // total days in the period
  dailyLimit: number;        // remainingPot / daysRemaining
  spentToday: number;        // expenses logged today
  remainingToday: number;    // dailyLimit - spentToday
  status: BudgetHealthStatus;
  isOverBudget: boolean;
  overspendAmount: number;
}

export const FinanceService = {

  /**
   * Compute the user's running balance from a base amount
   * and the full transaction history.
   */
  computeBalance(baseBalance: number, transactions: TransactionModel[]): number {
    const diff = transactions.reduce((acc, t) => {
      if (t.is_void) return acc;
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
    return Math.max(0, baseBalance + diff);
  },

  /**
   * Compute all daily-budget statistics from the active pay period
   * and the user's transactions. This is the core engine powering the
   * hero card on the dashboard.
   */
  computeDailyBudgetStats(
    payPeriod: PayPeriodModel,
    transactions: TransactionModel[],
  ): DailyBudgetStats {
    const spendablePot = Math.max(
      0,
      payPeriod.income_amount
        - payPeriod.fixed_costs_amount
        - payPeriod.savings_target_amount,
    );

    const startMs = new Date(payPeriod.start_date).getTime();
    const now = new Date();

    // Expenses within this pay period only
    const periodExpenses = transactions.filter((t) => {
      if (t.type !== 'expense' || t.is_void) return false;
      return new Date(t.transacted_at).getTime() >= startMs;
    });

    const totalExpenses = periodExpenses.reduce((acc, t) => acc + t.amount, 0);
    const remainingPot = spendablePot - totalExpenses;

    // Day arithmetic — strip time component for accurate day counts
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(payPeriod.end_date);
    const endZero = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const startDate = new Date(payPeriod.start_date);
    const startZero = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysTotal = Math.max(
      1,
      Math.round((endZero.getTime() - startZero.getTime()) / MS_PER_DAY) + 1,
    );
    const daysRemaining = Math.max(
      0,
      Math.round((endZero.getTime() - todayZero.getTime()) / MS_PER_DAY) + 1,
    );

    const isOverBudget = remainingPot < 0;
    const overspendAmount = isOverBudget ? Math.abs(remainingPot) : 0;
    const dailyLimit =
      daysRemaining > 0 && remainingPot > 0 ? remainingPot / daysRemaining : 0;

    // Today's expenses
    const spentToday = transactions
      .filter((t) => {
        if (t.type !== 'expense' || t.is_void) return false;
        const d = new Date(t.transacted_at);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const remainingToday = Math.max(0, dailyLimit - spentToday);

    // Health status
    const baseDailyPace = spendablePot / daysTotal;
    const status: BudgetHealthStatus = isOverBudget
      ? 'over_budget'
      : dailyLimit < baseDailyPace * 0.5
      ? 'warning'
      : 'on_track';

    return {
      spendablePot,
      totalExpenses,
      remainingPot,
      daysRemaining,
      daysTotal,
      dailyLimit,
      spentToday,
      remainingToday,
      status,
      isOverBudget,
      overspendAmount,
    };
  },

};
