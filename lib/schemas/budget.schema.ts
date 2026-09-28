/**
 * budget.schema.ts
 * Zod validation schemas for budget update inputs.
 */
import { z } from 'zod';

export const UpdateBudgetLimitSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit_amount: z
    .number({ message: 'Limit must be a number' })
    .min(0, 'Budget limit cannot be negative')
    .multipleOf(0.01, 'Max 2 decimal places'),
});

export type UpdateBudgetLimitInput = z.infer<typeof UpdateBudgetLimitSchema>;
