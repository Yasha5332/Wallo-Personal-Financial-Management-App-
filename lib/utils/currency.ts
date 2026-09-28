/**
 * lib/utils/currency.ts
 *
 * High-performance, robust currency formatting engine for Wallo.
 * Adheres to regional conventions, symbol placement, decimal rules,
 * and tabular-num friendly layouts.
 */

import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_CODE,
  type CurrencyConfig,
} from '../constants/currencies';

export interface FormatCurrencyOptions {
  showSign?: boolean;
  type?: 'income' | 'expense' | 'neutral';
  compact?: boolean;
  includeSymbol?: boolean;
  overrideDecimals?: number;
}

/**
 * Returns the CurrencyConfig for a given code, or DEFAULT_CURRENCY (USD) if not found.
 */
export function getCurrencyConfig(code?: string): CurrencyConfig {
  if (!code) return DEFAULT_CURRENCY;
  const upper = code.toUpperCase();
  return CURRENCIES[upper] || DEFAULT_CURRENCY;
}

/**
 * Formats a number according to currency configuration rules.
 */
export function formatCurrencyAmount(
  amount: number,
  currencyOrCode?: string | CurrencyConfig,
  options: FormatCurrencyOptions = {}
): string {
  const config =
    typeof currencyOrCode === 'object' && currencyOrCode !== null
      ? currencyOrCode
      : getCurrencyConfig(currencyOrCode);

  const {
    showSign = false,
    type = 'neutral',
    compact = false,
    includeSymbol = true,
    overrideDecimals,
  } = options;

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Determine Sign
  let sign = '';
  if (showSign) {
    if (type === 'income' || (!isNegative && type === 'neutral' && amount > 0)) {
      sign = '+';
    } else if (type === 'expense' || isNegative) {
      sign = '−'; // unicode minus
    }
  } else if (isNegative) {
    sign = '−';
  }

  // Compact number formatting (e.g. 1.2K, 3.4M)
  if (compact && absAmount >= 1000) {
    let compactFormatted = '';
    if (absAmount >= 1_000_000_000) {
      compactFormatted = (absAmount / 1_000_000_000).toFixed(1) + 'B';
    } else if (absAmount >= 1_000_000) {
      compactFormatted = (absAmount / 1_000_000).toFixed(1) + 'M';
    } else {
      compactFormatted = (absAmount / 1_000).toFixed(1) + 'K';
    }

    if (!includeSymbol) {
      return `${sign}${compactFormatted}`;
    }

    if (config.symbolPosition === 'suffix') {
      return `${sign}${compactFormatted} ${config.symbol}`;
    }
    const needsSpace = config.symbol.length > 1;
    return `${sign}${config.symbol}${needsSpace ? ' ' : ''}${compactFormatted}`;
  }

  // Decimal places
  const decimals = overrideDecimals !== undefined ? overrideDecimals : config.decimals;

  // Split into integer and decimal parts
  const fixedString = absAmount.toFixed(decimals);
  const [intPart, decPart] = fixedString.split('.');

  // Format integer part with thousands separators
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);

  // Assemble full number
  let numberFormatted = formattedInt;
  if (decimals > 0 && decPart) {
    numberFormatted += config.decimalSeparator + decPart;
  }

  if (!includeSymbol) {
    return `${sign}${numberFormatted}`;
  }

  // Position symbol
  if (config.symbolPosition === 'suffix') {
    return `${sign}${numberFormatted} ${config.symbol}`;
  }

  // Prefix symbol: multi-character symbols (e.g., 'Rp', 'CHF', 'AED') look best with a space
  const hasSpace = config.symbol.length > 1;
  return `${sign}${config.symbol}${hasSpace ? ' ' : ''}${numberFormatted}`;
}

/**
 * Parses user input string into a valid number based on decimal conventions.
 */
export function parseCurrencyInput(text: string, currencyCode?: string): number {
  if (!text) return 0;
  const config = getCurrencyConfig(currencyCode);

  // Clean non-numeric characters except separators
  let clean = text.trim();

  // If decimal separator is comma (e.g. EUR, IDR), convert comma to dot for parsing
  if (config.decimalSeparator === ',') {
    // Remove dots (thousands separators) and replace comma with dot
    clean = clean.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // Standard: remove commas (thousands separators)
    clean = clean.replace(/,/g, '');
  }

  // Remove any remaining symbols
  clean = clean.replace(/[^0-9.-]/g, '');

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
