/**
 * transaction.schema.ts
 * Zod validation schemas for transaction create/update inputs.
 */
import { z } from 'zod';

const EXPENSE_CATEGORIES = [
  'food', 'groceries', 'transport', 'entertainment', 'bills', 'education',
] as const;

const INCOME_CATEGORIES = [
  'allowance', 'part_time', 'scholarship', 'loan_aid', 'other',
] as const;

export const CreateTransactionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or fewer')
    .trim(),
  amount: z
    .number({ message: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .multipleOf(0.01, 'Max 2 decimal places'),
  type: z.enum(['expense', 'income']),
  category: z
    .union([z.enum(EXPENSE_CATEGORIES), z.enum(INCOME_CATEGORIES)]),
  note: z
    .string()
    .max(200, 'Note must be 200 characters or fewer')
    .trim()
    .optional(),
  is_recurring: z.boolean().default(false),
  transacted_at: z.string().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial().extend({
  id: z.string().min(1, 'Transaction ID is required'),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
