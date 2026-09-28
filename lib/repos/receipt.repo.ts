/**
 * receipt.repo.ts
 *
 * Repository for managing scanned receipts and batches.
 * Works seamlessly in offline demo mode via AsyncStorage and syncs to Supabase when active.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import type { ReceiptModel, ReceiptBatchModel } from '../models/receipt.model';

const STORAGE_KEY_RECEIPTS = '@wallo:receipts_data';
const STORAGE_KEY_BATCHES = '@wallo:receipt_batches_data';

export const ReceiptRepo = {
  /**
   * Fetch all receipts stored locally
   */
  async getAll(): Promise<ReceiptModel[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_RECEIPTS);
      if (!json) return [];
      return JSON.parse(json) as ReceiptModel[];
    } catch {
      return [];
    }
  },

  /**
   * Fetch pending receipts that need review
   */
  async getPending(): Promise<ReceiptModel[]> {
    const all = await this.getAll();
    return all.filter((r) => r.processing_status === 'pending_review');
  },

  /**
   * Save a single or multiple receipts
   */
  async saveMany(newReceipts: ReceiptModel[]): Promise<void> {
    const existing = await this.getAll();
    const map = new Map<string, ReceiptModel>();
    existing.forEach((r) => map.set(r.id, r));
    newReceipts.forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values());
    await AsyncStorage.setItem(STORAGE_KEY_RECEIPTS, JSON.stringify(merged));
  },

  /**
   * Update a receipt (e.g. mark as reviewed with transaction ID)
   */
  async update(id: string, updates: Partial<ReceiptModel>): Promise<void> {
    const all = await this.getAll();
    const updated = all.map((r) => {
      if (r.id === id) {
        return { ...r, ...updates, updated_at: new Date().toISOString() };
      }
      return r;
    });
    await AsyncStorage.setItem(STORAGE_KEY_RECEIPTS, JSON.stringify(updated));
  },

  /**
   * Delete a receipt
   */
  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_RECEIPTS, JSON.stringify(filtered));
  },

  /**
   * Clear all reviewed receipts
   */
  async clearReviewed(): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter((r) => r.processing_status !== 'reviewed');
    await AsyncStorage.setItem(STORAGE_KEY_RECEIPTS, JSON.stringify(filtered));
  },
};
