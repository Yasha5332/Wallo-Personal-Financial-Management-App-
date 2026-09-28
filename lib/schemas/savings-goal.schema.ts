/**
 * savings-goal.schema.ts
 * Zod validation schemas for savings goal create and contribution inputs.
 */
import { z } from 'zod';

export const CreateSavingsGoalSchema = z.object({
  title: z
    .string()
    .min(1, 'Goal title is required')
    .max(80, 'Title must be 80 characters or fewer')
    .trim(),
  target_amount: z
    .number({ message: 'Target must be a number' })
    .positive('Target amount must be greater than zero')
    .multipleOf(0.01, 'Max 2 decimal places'),
  target_date: z
    .string()
    .trim()
    .optional()
    .nullable(),
  weekly_suggested: z
    .number()
    .min(0)
    .optional()
    .default(0),
});

export const ContributeToGoalSchema = z.object({
  goal_id: z.string().uuid('Invalid goal ID'),
  amount: z
    .number({ message: 'Amount must be a number' })
    .positive('Contribution must be greater than zero')
    .multipleOf(0.01, 'Max 2 decimal places'),
});

export const UpdateSavingsGoalSchema = z.object({
  id: z.string().min(1, 'Goal ID is required'),
  title: z
    .string()
    .min(1, 'Goal title is required')
    .max(80, 'Title must be 80 characters or fewer')
    .trim()
    .optional(),
  target_amount: z
    .number({ message: 'Target must be a number' })
    .positive('Target amount must be greater than zero')
    .multipleOf(0.01, 'Max 2 decimal places')
    .optional(),
  target_date: z
    .string()
    .trim()
    .optional()
    .nullable(),
  weekly_suggested: z
    .number()
    .min(0)
    .optional(),
  current_amount: z
    .number()
    .min(0)
    .optional(),
  is_complete: z
    .boolean()
    .optional(),
});

export type CreateSavingsGoalInput = z.infer<typeof CreateSavingsGoalSchema>;
export type ContributeToGoalInput = z.infer<typeof ContributeToGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof UpdateSavingsGoalSchema>;
