/**
 * lib/services/exchange-rate.service.ts
 *
 * Hybrid exchange rate service. Bundles robust offline baseline rates and
 * refreshes from open exchange rate API when internet connection is available.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASELINE_EXCHANGE_RATES,
  calculateExchangeRate,
  convertAmount,
} from '../constants/exchange-rates';

const STORAGE_KEY = '@wallo:exchange_rates';
const STORAGE_TIMESTAMP_KEY = '@wallo:exchange_rates_timestamp';
const API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export class ExchangeRateService {
  private static rates: Record<string, number> = { ...BASELINE_EXCHANGE_RATES };
  private static lastUpdated: Date = new Date();
  private static initialized: boolean = false;

  /**
   * Initializes rates from cache and triggers a background refresh if stale.
   */
  public static async initialize(): Promise<Record<string, number>> {
    if (this.initialized) return this.rates;

    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      const timestamp = await AsyncStorage.getItem(STORAGE_TIMESTAMP_KEY);

      if (cached) {
        const parsed = JSON.parse(cached);
        this.rates = { ...BASELINE_EXCHANGE_RATES, ...parsed };
        if (timestamp) {
          this.lastUpdated = new Date(parseInt(timestamp, 10));
        }
      }

      // If stale or never fetched, fetch in background
      const isStale =
        !timestamp || Date.now() - parseInt(timestamp, 10) > CACHE_TTL_MS;
      if (isStale) {
        this.refreshRatesInBackground();
      }
    } catch (e) {
      console.warn('Could not load cached exchange rates, using baseline:', e);
    } finally {
      this.initialized = true;
    }

    return this.rates;
  }

  /**
   * Refreshes exchange rates on demand from API, updating cache and internal state.
   */
  public static async refreshRates(): Promise<{
    success: boolean;
    rates: Record<string, number>;
    lastUpdated: Date;
  }> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        return { success: false, rates: this.rates, lastUpdated: this.lastUpdated };
      }

      const data = await response.json();
      if (data && data.rates) {
        this.rates = { ...BASELINE_EXCHANGE_RATES, ...data.rates };
        this.lastUpdated = new Date();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.rates));
        await AsyncStorage.setItem(
          STORAGE_TIMESTAMP_KEY,
          Date.now().toString()
        );
        return { success: true, rates: this.rates, lastUpdated: this.lastUpdated };
      }
      return { success: false, rates: this.rates, lastUpdated: this.lastUpdated };
    } catch {
      return { success: false, rates: this.rates, lastUpdated: this.lastUpdated };
    }
  }

  /**
   * Background fetch for latest rates.
   */
  private static async refreshRatesInBackground(): Promise<void> {
    await this.refreshRates();
  }

  /**
   * Returns current active rates dictionary.
   */
  public static getRates(): Record<string, number> {
    return this.rates;
  }

  /**
   * Returns the direct conversion rate between two currencies.
   */
  public static getRate(fromCurrency: string, toCurrency: string): number {
    return calculateExchangeRate(fromCurrency, toCurrency, this.rates);
  }

  /**
   * Converts a numerical amount between any two currencies.
   */
  public static convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number {
    return convertAmount(amount, fromCurrency, toCurrency, this.rates);
  }

  /**
   * Returns when rates were last updated.
   */
  public static getLastUpdated(): Date {
    return this.lastUpdated;
  }
}
