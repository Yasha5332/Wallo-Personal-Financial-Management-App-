/**
 * subscription.model.ts
 * Mirrors the `subscriptions` table row exactly.
 */

export interface SubscriptionModel {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  renewal_day: number; // 1–31
  category: string;
  is_active: boolean;
  created_at: string;
}
