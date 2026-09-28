/**
 * subscription.repo.ts
 * DAO layer — raw Supabase CRUD for the `subscriptions` table.
 * No business logic. No calculations. Just data access.
 */
import { supabase } from '../supabase';
import type { SubscriptionModel } from '../models/subscription.model';

export const SubscriptionRepo = {

  /** Fetch all active subscriptions for a user */
  async findActiveByUser(userId: string): Promise<SubscriptionModel[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('renewal_day', { ascending: true });

    if (error) throw error;
    return (data ?? []) as SubscriptionModel[];
  },

  /** Insert a new subscription */
  async create(
    userId: string,
    input: Omit<SubscriptionModel, 'id' | 'user_id' | 'created_at'>,
  ): Promise<SubscriptionModel> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as SubscriptionModel;
  },

  /** Deactivate a subscription (soft-delete) */
  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

};
