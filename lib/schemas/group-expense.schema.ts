/**
 * group-expense.schema.ts
 * Zod validation schemas for creating shared expenses and settlements.
 */
import { z } from 'zod';

export const CreateGroupExpenseSchema = z.object({
  group_id: z.string().uuid('Invalid group ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or fewer')
    .trim(),
  amount: z
    .number({ message: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .multipleOf(0.01, 'Max 2 decimal places'),
  paid_by_member_id: z.string().uuid('Invalid member ID'),
  split_member_ids: z
    .array(z.string().uuid())
    .min(2, 'Must split between at least 2 members'),
  category: z.string().default('bills'),
  is_settlement: z.boolean().default(false),
});

export const SettleDebtSchema = z.object({
  group_id: z.string().uuid('Invalid group ID'),
  from_member_id: z.string().uuid('Invalid from member ID'),
  to_member_id: z.string().uuid('Invalid to member ID'),
  amount: z
    .number({ message: 'Amount must be a number' })
    .positive('Settlement amount must be greater than zero')
    .multipleOf(0.01, 'Max 2 decimal places'),
});

export type CreateGroupExpenseInput = z.infer<typeof CreateGroupExpenseSchema>;
export type SettleDebtInput = z.infer<typeof SettleDebtSchema>;
