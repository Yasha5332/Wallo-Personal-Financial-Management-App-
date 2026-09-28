/**
 * group-expense.repo.ts
 * DAO layer — raw Supabase CRUD for `group_expenses` and `group_debts`.
 * No business logic. No calculations. Just data access.
 */
import { supabase } from '../supabase';
import type { GroupExpenseModel, GroupDebtModel } from '../models/group-expense.model';
import type { GroupModel, GroupMemberModel } from '../models/group.model';
import type { CreateGroupExpenseInput, SettleDebtInput } from '../schemas/group-expense.schema';

export const GroupExpenseRepo = {

  // ── Groups ────────────────────────────────────────────────────────────────

  /** Fetch all groups the current user belongs to */
  async findGroupsByUser(userId: string): Promise<GroupModel[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .in(
        'id',
        (
          await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
        ).data?.map((r) => r.group_id) ?? [],
      );

    if (error) throw error;
    return (data ?? []) as GroupModel[];
  },

  /** Create a new group */
  async createGroup(userId: string, name: string): Promise<GroupModel> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as GroupModel;
  },

  /** Fetch all members of a group */
  async findMembersByGroup(groupId: string): Promise<GroupMemberModel[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as GroupMemberModel[];
  },

  // ── Expenses ──────────────────────────────────────────────────────────────

  /** Fetch all expenses for a group, newest first */
  async findExpensesByGroup(groupId: string): Promise<GroupExpenseModel[]> {
    const { data, error } = await supabase
      .from('group_expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as GroupExpenseModel[];
  },

  /** Insert a new shared expense */
  async createExpense(input: CreateGroupExpenseInput): Promise<GroupExpenseModel> {
    const { data, error } = await supabase
      .from('group_expenses')
      .insert({
        group_id: input.group_id,
        title: input.title,
        amount: input.amount,
        paid_by_member_id: input.paid_by_member_id,
        split_member_ids: input.split_member_ids,
        category: input.category,
        is_settlement: input.is_settlement,
      })
      .select()
      .single();

    if (error) throw error;
    return data as GroupExpenseModel;
  },

  // ── Debts ─────────────────────────────────────────────────────────────────

  /** Fetch all debt balances for a group */
  async findDebtsByGroup(groupId: string): Promise<GroupDebtModel[]> {
    const { data, error } = await supabase
      .from('group_debts')
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    return (data ?? []) as GroupDebtModel[];
  },

  /**
   * Record a settlement: insert a settlement expense row and
   * upsert (reduce) the debt balance between the two members.
   */
  async settle(input: SettleDebtInput): Promise<void> {
    // 1. Insert settlement expense record
    await supabase.from('group_expenses').insert({
      group_id: input.group_id,
      title: `Settlement payment`,
      amount: input.amount,
      paid_by_member_id: input.from_member_id,
      split_member_ids: [input.to_member_id],
      category: 'bills',
      is_settlement: true,
    });

    // 2. Reduce (or zero out) the debt in group_debts
    const { data: existing } = await supabase
      .from('group_debts')
      .select('amount')
      .eq('group_id', input.group_id)
      .eq('from_member_id', input.from_member_id)
      .eq('to_member_id', input.to_member_id)
      .single();

    const newAmount = Math.max(0, (existing?.amount ?? 0) - input.amount);

    await supabase
      .from('group_debts')
      .upsert({
        group_id: input.group_id,
        from_member_id: input.from_member_id,
        to_member_id: input.to_member_id,
        amount: newAmount,
        updated_at: new Date().toISOString(),
      });
  },

  /** Add a new member / friend to a group */
  async addMember(input: {
    group_id: string;
    display_name: string;
    avatar_color: string;
    user_id?: string | null;
    is_external?: boolean;
  }): Promise<GroupMemberModel> {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: input.group_id,
        display_name: input.display_name,
        avatar_color: input.avatar_color,
        user_id: input.user_id ?? null,
        is_external: input.is_external ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as GroupMemberModel;
  },

  /** Remove a member from a group */
  async deleteMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

};

