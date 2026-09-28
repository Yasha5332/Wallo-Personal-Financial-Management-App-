/**
 * pay-period.repo.ts
 * DAO layer — raw Supabase CRUD for the `pay_periods` table.
 * No business logic. No calculations. Just data access.
 */
import { supabase } from '../supabase';
import type { PayPeriodModel } from '../models/pay-period.model';
import type { UpdatePayPeriodInput } from '../schemas/pay-period.schema';

export const PayPeriodRepo = {

  /**
   * Fetch the currently active pay period for a user.
   * Returns null if no active period exists yet (new user).
   */
  async findActive(userId: string): Promise<PayPeriodModel | null> {
    const { data, error } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // PGRST116 = "no rows found" — not a real error
    if (error && error.code !== 'PGRST116') throw error;
    return data as PayPeriodModel | null;
  },

  /** Update fields of the active pay period */
  async update(
    id: string,
    input: UpdatePayPeriodInput,
  ): Promise<PayPeriodModel> {
    const { data, error } = await supabase
      .from('pay_periods')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PayPeriodModel;
  },

  /**
   * Reset: deactivate current period and create a fresh one.
   * Calls the `create_default_pay_period` Postgres RPC.
   */
  async reset(userId: string): Promise<void> {
    // Deactivate existing
    await supabase
      .from('pay_periods')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Seed a fresh default period via RPC
    const { error } = await supabase.rpc('create_default_pay_period', {
      p_user_id: userId,
    });

    if (error) throw error;
  },

};
