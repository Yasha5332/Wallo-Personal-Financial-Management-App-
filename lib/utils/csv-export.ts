/**
 * lib/utils/csv-export.ts
 *
 * Real CSV Export & Backup utility for Wallo.
 * Generates formatted CSV string (Date, Title, Category, Type, Amount, Currency, Note)
 * and handles Web (Blob direct download) and Mobile (expo-file-system + expo-sharing).
 */
import { Platform } from 'react-native';
import type { TransactionModel } from '../models/transaction.model';
import type { Transaction } from '../../types/finance';

export interface CSVExportOptions {
  transactions: (Transaction | TransactionModel)[];
  currencyCode?: string;
  filename?: string;
}

export interface CSVExportResult {
  success: boolean;
  filename: string;
  count: number;
  csvString: string;
  fileUri?: string;
  error?: string;
}

/**
 * Formats a raw date value into standard YYYY-MM-DD format for CSV.
 */
export function formatCSVDate(dateVal: unknown): string {
  if (!dateVal) return '';
  try {
    const d = new Date(String(dateVal));
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const str = String(dateVal);
    return str.includes('T') ? str.split('T')[0] : str;
  } catch {
    return String(dateVal);
  }
}

/**
 * Escapes a single CSV field value according to RFC 4180:
 * - If value contains commas, double quotes, or newlines, wrap in double quotes.
 * - Double any inner double quotes (" -> "").
 */
export function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (
    str.includes('"') ||
    str.includes(',') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates formatted CSV string:
 * Columns: Date, Title, Category, Type, Amount, Currency, Note
 */
export function generateTransactionsCSV(
  transactions: (Transaction | TransactionModel)[],
  currencyCode: string = 'USD'
): string {
  const headers = ['Date', 'Title', 'Category', 'Type', 'Amount', 'Currency', 'Note'];
  const headerLine = headers.join(',');

  const rows = transactions.map((t) => {
    // Support both Transaction.date and TransactionModel.transacted_at / created_at
    const rawDate =
      (t as { date?: string }).date ||
      (t as { transacted_at?: string }).transacted_at ||
      (t as { created_at?: string }).created_at ||
      '';
    const date = formatCSVDate(rawDate);
    const title = escapeCSVField(t.title ?? 'Untitled');
    const category = escapeCSVField(t.category ?? 'other');
    const type = escapeCSVField(t.type ?? 'expense');

    const numericAmount =
      typeof t.amount === 'number'
        ? t.amount
        : parseFloat(String(t.amount) || '0');
    const amount = isNaN(numericAmount) ? '0.00' : numericAmount.toFixed(2);

    const currency = escapeCSVField(currencyCode);
    const note = escapeCSVField(t.note ?? '');

    return `${date},${title},${category},${type},${amount},${currency},${note}`;
  });

  return [headerLine, ...rows].join('\r\n');
}

/**
 * Web implementation: trigger a direct file download blob.
 */
export function downloadCSVOnWeb(csvContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Web download is only supported in a browser environment');
  }

  // Prepend UTF-8 BOM so spreadsheet apps (Excel, Sheets, Numbers) open unicode characters properly
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup after click
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Mobile implementation: use expo-file-system to write the file,
 * then expo-sharing to allow saving to files, AirDrop, messaging, etc.
 */
export async function shareCSVOnMobile(csvContent: string, filename: string): Promise<string> {
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');

  let fileUri = '';

  try {
    // Expo SDK 57 modern FileSystem API
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(csvContent);
    fileUri = file.uri;
  } catch (fsErr) {
    console.warn('Modern File API creation failed, falling back to legacy FileSystem:', fsErr);
    try {
      const FileSystemLegacy = await import('expo-file-system/legacy');
      const targetUri = `${FileSystemLegacy.cacheDirectory}${filename}`;
      await FileSystemLegacy.writeAsStringAsync(targetUri, csvContent, {
        encoding: FileSystemLegacy.EncodingType.UTF8,
      });
      fileUri = targetUri;
    } catch (legacyErr) {
      throw new Error(
        `Failed to save file to device cache: ${
          legacyErr instanceof Error ? legacyErr.message : String(legacyErr)
        }`
      );
    }
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not supported on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export CSV & Backup',
    UTI: 'public.comma-separated-values-text',
  });

  return fileUri;
}

/**
 * Unified CSV export and backup function:
 * Automatically branches to Web (direct download Blob) or Mobile (expo-file-system + expo-sharing).
 */
export async function exportTransactionsToCSV({
  transactions,
  currencyCode = 'USD',
  filename,
}: CSVExportOptions): Promise<CSVExportResult> {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const targetFilename = filename || `wallo_transactions_${dateStamp}.csv`;

  try {
    const csvString = generateTransactionsCSV(transactions, currencyCode);

    if (Platform.OS === 'web') {
      downloadCSVOnWeb(csvString, targetFilename);
      return {
        success: true,
        filename: targetFilename,
        count: transactions.length,
        csvString,
      };
    } else {
      const fileUri = await shareCSVOnMobile(csvString, targetFilename);
      return {
        success: true,
        filename: targetFilename,
        count: transactions.length,
        csvString,
        fileUri,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
    return {
      success: false,
      filename: targetFilename,
      count: transactions.length,
      csvString: '',
      error: errorMessage,
    };
  }
}
