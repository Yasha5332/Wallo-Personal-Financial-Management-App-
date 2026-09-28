/**
 * @deprecated
 * This file is superseded by the typed model files in lib/models/.
 * It is kept temporarily as a reference during migration.
 *
 * Use the corresponding model file instead:
 *   DbProfile         → lib/models/profile.model.ts       (ProfileModel)
 *   DbTransaction     → lib/models/transaction.model.ts   (TransactionModel)
 *   DbBudget          → lib/models/budget.model.ts        (BudgetModel)
 *   DbGroup           → lib/models/group.model.ts         (GroupModel)
 *   DbGroupMember     → lib/models/group.model.ts         (GroupMemberModel)
 *   DbGroupExpense    → lib/models/group-expense.model.ts (GroupExpenseModel)
 *   DbGroupDebt       → lib/models/group-expense.model.ts (GroupDebtModel)
 *
 * Re-exports everything from the new models to avoid breaking any imports
 * that have not been migrated yet.
 */

export type { ProfileModel as DbProfile } from './models/profile.model';
export type { TransactionModel as DbTransaction } from './models/transaction.model';
export type { BudgetModel as DbBudget } from './models/budget.model';
export type { SubscriptionModel as DbSubscription } from './models/subscription.model';
export type { SavingsGoalModel as DbSavingsGoal } from './models/savings-goal.model';
export type { PayPeriodModel as DbPayPeriod } from './models/pay-period.model';
export type { GroupModel as DbGroup, GroupMemberModel as DbGroupMember } from './models/group.model';
export type {
  GroupExpenseModel as DbGroupExpense,
  GroupDebtModel as DbGroupDebt,
} from './models/group-expense.model';

// Legacy types kept for backwards compatibility — remove in v2
export interface DbJournalEntry {
  id: string; user_id: string; memo: string | null;
  posted_at: string; is_void: boolean; source: string;
}
export interface DbJournalEntryLine {
  id: string; journal_entry_id: string; account_id: string;
  debit: number; credit: number; description: string | null;
}
export interface DbAccount {
  id: string; user_id: string; name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  sub_type: string | null; is_default: boolean; currency: string; created_at: string;
}
