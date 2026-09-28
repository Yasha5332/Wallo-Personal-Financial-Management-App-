/**
 * receipt.model.ts
 *
 * Data model for scanned receipts, OCR extraction results, and batch processing.
 */
import type { ExpenseCategory } from './transaction.model';

export type ReceiptOCRSource = 'device' | 'cloud';
export type ReceiptProcessingStatus = 'pending_review' | 'reviewed' | 'failed';

export interface ReceiptModel {
  id: string;
  user_id: string;
  transaction_id?: string | null;
  batch_id?: string | null;
  image_uri: string;
  thumbnail_uri?: string;
  ocr_raw_text?: string;
  ocr_source: ReceiptOCRSource;
  ocr_confidence_score: number; // 0.00 – 1.00
  merchant_name: string;
  transaction_date: string; // YYYY-MM-DD
  total_amount: number;
  currency: string;
  category: ExpenseCategory;
  processing_status: ReceiptProcessingStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReceiptBatchModel {
  id: string;
  user_id: string;
  created_at: string;
  notes?: string;
  total_count: number;
  pending_count: number;
  reviewed_count: number;
}
