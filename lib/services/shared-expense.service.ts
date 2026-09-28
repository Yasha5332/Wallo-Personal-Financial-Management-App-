/**
 * shared-expense.service.ts
 * Business logic: shared expense splitting, pairwise debt netting, and settlements.
 * Calls GroupExpenseRepo and TransactionRepo. No Supabase directly.
 */
import { GroupExpenseRepo } from '../repos/group-expense.repo';
import { TransactionRepo } from '../repos/transaction.repo';
import {
  CreateGroupExpenseSchema,
  SettleDebtSchema,
  type CreateGroupExpenseInput,
  type SettleDebtInput,
} from '../schemas/group-expense.schema';
import { CreateTransactionSchema } from '../schemas/transaction.schema';
import type { GroupExpenseModel, ComputedDebtBalance } from '../models/group-expense.model';
import type { GroupMemberModel } from '../models/group.model';

export const SharedExpenseService = {

  /**
   * Add a new shared expense. If the current user paid, also log
   * their personal share as a personal transaction.
   */
  async addSharedExpense(
    currentUserId: string,
    currentMemberId: string,
    rawInput: CreateGroupExpenseInput,
  ): Promise<GroupExpenseModel> {
    const validated = CreateGroupExpenseSchema.parse(rawInput);
    const expense = await GroupExpenseRepo.createExpense(validated);

    // If current user paid, record their personal share as an expense transaction
    if (validated.paid_by_member_id === currentMemberId) {
      const myShare = validated.amount / validated.split_member_ids.length;
      const txInput = CreateTransactionSchema.parse({
        title: `${validated.title} (your 1/${validated.split_member_ids.length} share)`,
        amount: myShare,
        type: 'expense',
        category: validated.category,
        note: 'Split with roommates',
        is_recurring: false,
      });
      await TransactionRepo.create(currentUserId, txInput);
    }

    return expense;
  },

  /**
   * Record a debt settlement. Also logs a personal transaction for the
   * current user if they are one of the parties involved.
   */
  async settleDebt(
    currentUserId: string,
    currentMemberId: string,
    members: GroupMemberModel[],
    rawInput: SettleDebtInput,
  ): Promise<void> {
    const validated = SettleDebtSchema.parse(rawInput);
    await GroupExpenseRepo.settle(validated);

    const fromMember = members.find((m) => m.id === validated.from_member_id);
    const toMember = members.find((m) => m.id === validated.to_member_id);

    // Log a personal transaction for the current user
    if (validated.from_member_id === currentMemberId) {
      await TransactionRepo.create(
        currentUserId,
        CreateTransactionSchema.parse({
          title: `Paid back ${toMember?.display_name ?? 'roommate'}`,
          amount: validated.amount,
          type: 'expense',
          category: 'bills',
          note: 'Roommate debt settlement',
          is_recurring: false,
        }),
      );
    } else if (validated.to_member_id === currentMemberId) {
      await TransactionRepo.create(
        currentUserId,
        CreateTransactionSchema.parse({
          title: `${fromMember?.display_name ?? 'Roommate'} settled debt`,
          amount: validated.amount,
          type: 'income',
          category: 'other',
          note: 'Roommate debt repayment',
          is_recurring: false,
        }),
      );
    }
  },

  /**
   * Compute pairwise net debt balances from a list of group expenses.
   * Pure function — no repo calls, no side effects.
   */
  computeDebtBalances(
    expenses: GroupExpenseModel[],
    members: GroupMemberModel[],
  ): ComputedDebtBalance[] {
    const matrix: Record<string, number> = {};

    expenses.forEach((expense) => {
      const share = expense.amount / expense.split_member_ids.length;
      expense.split_member_ids.forEach((memberId) => {
        if (memberId !== expense.paid_by_member_id) {
          const key = `${memberId}__${expense.paid_by_member_id}`;
          matrix[key] = (matrix[key] ?? 0) + share;
        }
      });
    });

    const memberMap = new Map(members.map((m) => [m.id, m.display_name]));
    const result: ComputedDebtBalance[] = [];
    const processed = new Set<string>();

    members.forEach((m1) => {
      members.forEach((m2) => {
        if (m1.id === m2.id) return;
        const pairKey = [m1.id, m2.id].sort().join('|');
        if (processed.has(pairKey)) return;
        processed.add(pairKey);

        const m1OwesM2 = matrix[`${m1.id}__${m2.id}`] ?? 0;
        const m2OwesM1 = matrix[`${m2.id}__${m1.id}`] ?? 0;
        const net = m1OwesM2 - m2OwesM1;

        if (Math.abs(net) > 0.01) {
          const [fromId, toId, amount] =
            net > 0 ? [m1.id, m2.id, net] : [m2.id, m1.id, -net];
          result.push({
            id: `${fromId}__${toId}`,
            fromMemberId: fromId,
            fromName: memberMap.get(fromId) ?? fromId,
            toMemberId: toId,
            toName: memberMap.get(toId) ?? toId,
            amount,
          });
        }
      });
    });

    return result;
  },

};
