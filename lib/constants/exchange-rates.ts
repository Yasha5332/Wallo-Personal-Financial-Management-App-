/**
 * lib/constants/exchange-rates.ts
 *
 * Reliable baseline exchange rates table relative to USD (USD = 1.0).
 * Provides instantaneous, zero-latency offline currency conversion.
 */

export const BASELINE_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  VND: 25400.0,    // 1 USD = 25,400 Vietnamese Dong
  EUR: 0.92,       // 1 USD = 0.92 Euro
  GBP: 0.79,       // 1 USD = 0.79 British Pound
  JPY: 155.0,      // 1 USD = 155 Japanese Yen
  IDR: 16250.0,    // 1 USD = 16,250 Indonesian Rupiah
  SGD: 1.34,       // 1 USD = 1.34 Singapore Dollar
  AUD: 1.52,       // 1 USD = 1.52 Australian Dollar
  CAD: 1.37,       // 1 USD = 1.37 Canadian Dollar
  CHF: 0.90,       // 1 USD = 0.90 Swiss Franc
  CNY: 7.25,       // 1 USD = 7.25 Chinese Yuan
  INR: 83.50,      // 1 USD = 83.50 Indian Rupee
  KRW: 1380.0,     // 1 USD = 1,380 South Korean Won
  MYR: 4.70,       // 1 USD = 4.70 Malaysian Ringgit
  THB: 36.50,      // 1 USD = 36.50 Thai Baht
  PHP: 58.00,      // 1 USD = 58.00 Philippine Peso
  BRL: 5.45,       // 1 USD = 5.45 Brazilian Real
  MXN: 18.20,      // 1 USD = 18.20 Mexican Peso
  NZD: 1.64,       // 1 USD = 1.64 New Zealand Dollar
  SEK: 10.50,      // 1 USD = 10.50 Swedish Krona
  NOK: 10.60,      // 1 USD = 10.60 Norwegian Krone
  DKK: 6.87,       // 1 USD = 6.87 Danish Krone
  PLN: 3.95,       // 1 USD = 3.95 Polish Zloty
  TRY: 32.80,      // 1 USD = 32.80 Turkish Lira
  AED: 3.67,       // 1 USD = 3.67 UAE Dirham
  SAR: 3.75,       // 1 USD = 3.75 Saudi Riyal
  HKD: 7.81,       // 1 USD = 7.81 Hong Kong Dollar
  TWD: 32.40,      // 1 USD = 32.40 New Taiwan Dollar
};

/**
 * Calculates direct exchange rate from Currency A to Currency B.
 * Formula: Rate(A -> B) = Rate(B) / Rate(A)
 */
export function calculateExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = BASELINE_EXCHANGE_RATES
): number {
  const fromUpper = fromCurrency.toUpperCase();
  const toUpper = toCurrency.toUpperCase();
  if (fromUpper === toUpper) return 1.0;

  const rateFrom = rates[fromUpper] || 1.0;
  const rateTo = rates[toUpper] || 1.0;

  return rateTo / rateFrom;
}

/**
 * Converts an amount from one currency to another using exchange rates.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = BASELINE_EXCHANGE_RATES
): number {
  const rate = calculateExchangeRate(fromCurrency, toCurrency, rates);
  return amount * rate;
}
