/**
 * transaction.repo.ts
 * DAO layer — raw Supabase CRUD for the `transactions` table.
 * No business logic. No calculations. Just data access.
 */
import { supabase } from '../supabase';
import type { TransactionModel } from '../models/transaction.model';
import type { CreateTransactionInput } from '../schemas/transaction.schema';

export const TransactionRepo = {

  /** Fetch all non-voided transactions for a user, newest first */
  async findByUser(userId: string): Promise<TransactionModel[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_void', false)
      .order('transacted_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as TransactionModel[];
  },

  /** Fetch transactions within a date range for a user */
  async findByUserAndDateRange(
    userId: string,
    fromDate: string,
    toDate: string,
  ): Promise<TransactionModel[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_void', false)
      .gte('transacted_at', fromDate)
      .lte('transacted_at', toDate)
      .order('transacted_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as TransactionModel[];
  },

  /** Insert a new transaction row */
  async create(
    userId: string,
    input: CreateTransactionInput,
  ): Promise<TransactionModel> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        title: input.title,
        amount: input.amount,
        type: input.type,
        category: input.category,
        note: input.note ?? null,
        is_recurring: input.is_recurring,
        ...(input.transacted_at ? { transacted_at: input.transacted_at } : {}),
      })
      .select()
      .single();

    if (error) throw error;
    return data as TransactionModel;
  },

  /** Soft-delete: mark a transaction as voided instead of hard deleting */
  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ is_void: true })
      .eq('id', id);

    if (error) throw error;
  },

  /** Update mutable fields of an existing transaction */
  async update(
    id: string,
    updates: Partial<Pick<TransactionModel, 'title' | 'amount' | 'type' | 'category' | 'note' | 'is_recurring' | 'transacted_at'>>,
  ): Promise<TransactionModel> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TransactionModel;
  },

};
