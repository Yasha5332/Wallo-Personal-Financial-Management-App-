/**
 * pay-period.schema.ts
 * Zod validation schema for updating the active pay period.
 */
import { z } from 'zod';

export const UpdatePayPeriodSchema = z
  .object({
    name: z.string().min(1).max(60).trim().optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD')
      .optional(),
    income_amount: z
      .number({ message: 'Income must be a number' })
      .min(0, 'Income cannot be negative')
      .optional(),
    fixed_costs_amount: z
      .number({ message: 'Fixed costs must be a number' })
      .min(0, 'Fixed costs cannot be negative')
      .optional(),
    savings_target_amount: z
      .number({ message: 'Savings target must be a number' })
      .min(0, 'Savings target cannot be negative')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type UpdatePayPeriodInput = z.infer<typeof UpdatePayPeriodSchema>;
