/**
 * context/CurrencyContext.tsx
 *
 * Provides reactive currency preference and real-time exchange rate conversion across Wallo.
 * Supports base currency storage (USD) with dynamic FX conversion when viewing in other currencies
 * (e.g. 1 USD converts to ~25,400 VND, 0.92 EUR, or 155 JPY).
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CURRENCIES,
  CURRENCY_LIST,
  POPULAR_CURRENCY_CODES,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY,
  type CurrencyConfig,
} from '../lib/constants/currencies';
import {
  formatCurrencyAmount,
  getCurrencyConfig,
  type FormatCurrencyOptions,
} from '../lib/utils/currency';
import { ExchangeRateService } from '../lib/services/exchange-rate.service';
import {
  BASELINE_EXCHANGE_RATES,
  calculateExchangeRate,
  convertAmount,
} from '../lib/constants/exchange-rates';

const STORAGE_KEY = '@wallo:currency_preference';

export interface ExtendedFormatCurrencyOptions extends FormatCurrencyOptions {
  fromCurrency?: string;
  toCurrency?: string;
  skipConversion?: boolean;
}

interface CurrencyContextType {
  currencyCode: string;
  currency: CurrencyConfig;
  baseCurrencyCode: string;
  rates: Record<string, number>;
  setCurrency: (code: string) => Promise<void>;
  convert: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  getExchangeRate: (fromCurrency?: string, toCurrency?: string) => number;
  formatCurrency: (amount: number, options?: ExtendedFormatCurrencyOptions) => string;
  supportedCurrencies: CurrencyConfig[];
  popularCurrencies: CurrencyConfig[];
  isLoading: boolean;
  lastRatesUpdated: Date;
  refreshRates: () => Promise<boolean>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState<string>(DEFAULT_CURRENCY_CODE);
  const [rates, setRates] = useState<Record<string, number>>(BASELINE_EXCHANGE_RATES);
  const [lastRatesUpdated, setLastRatesUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Default base currency used to store financial models
  const baseCurrencyCode = DEFAULT_CURRENCY_CODE; // 'USD'

  const refreshRates = useCallback(async (): Promise<boolean> => {
    try {
      const result = await ExchangeRateService.refreshRates();
      if (result.rates) {
        setRates({ ...result.rates });
        setLastRatesUpdated(result.lastUpdated);
      }
      return result.success;
    } catch {
      return false;
    }
  }, []);

  // Load persisted preference and exchange rates on startup + fetch live rates from internet
  useEffect(() => {
    async function loadData() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && CURRENCIES[saved.toUpperCase()]) {
          setCurrencyCodeState(saved.toUpperCase());
        }

        const initialRates = await ExchangeRateService.initialize();
        setRates({ ...initialRates });
        setLastRatesUpdated(ExchangeRateService.getLastUpdated());

        // Automatically fetch live rates from internet on startup
        refreshRates();
      } catch (err) {
        console.warn('Failed to load currency preference or rates:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [refreshRates]);

  const setCurrency = useCallback(
    async (code: string) => {
      const upper = code.toUpperCase();
      if (!CURRENCIES[upper]) {
        console.warn(`Currency code "${code}" is not supported.`);
        return;
      }
      setCurrencyCodeState(upper);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, upper);
      } catch (err) {
        console.warn('Failed to save currency preference:', err);
      }
      // Automatically refresh live rates when switching currency
      refreshRates();
    },
    [refreshRates]
  );

  const currency = useMemo(() => {
    return getCurrencyConfig(currencyCode);
  }, [currencyCode]);

  const convert = useCallback(
    (amount: number, fromCurrency: string = baseCurrencyCode, toCurrency: string = currencyCode): number => {
      return calculateExchangeRate(fromCurrency, toCurrency, rates) * amount;
    },
    [baseCurrencyCode, currencyCode, rates]
  );

  const getExchangeRate = useCallback(
    (fromCurrency: string = baseCurrencyCode, toCurrency: string = currencyCode): number => {
      return calculateExchangeRate(fromCurrency, toCurrency, rates);
    },
    [baseCurrencyCode, currencyCode, rates]
  );

  const formatCurrency = useCallback(
    (amount: number, options?: ExtendedFormatCurrencyOptions) => {
      const fromCurr = options?.fromCurrency || baseCurrencyCode;
      const targetCode = options?.toCurrency || currencyCode;
      const targetConfig = getCurrencyConfig(targetCode);

      // Perform real exchange-rate conversion using live rates state
      const finalAmount = options?.skipConversion
        ? amount
        : convertAmount(amount, fromCurr, targetCode, rates);

      return formatCurrencyAmount(finalAmount, targetConfig, options);
    },
    [baseCurrencyCode, currencyCode, rates]
  );

  const popularCurrencies = useMemo(() => {
    return POPULAR_CURRENCY_CODES.map((code) => CURRENCIES[code]).filter(Boolean);
  }, []);

  const value = useMemo(
    () => ({
      currencyCode,
      currency,
      baseCurrencyCode,
      rates,
      setCurrency,
      convert,
      getExchangeRate,
      formatCurrency,
      supportedCurrencies: CURRENCY_LIST,
      popularCurrencies,
      isLoading,
      lastRatesUpdated,
      refreshRates,
    }),
    [
      currencyCode,
      currency,
      baseCurrencyCode,
      rates,
      setCurrency,
      convert,
      getExchangeRate,
      formatCurrency,
      popularCurrencies,
      isLoading,
      lastRatesUpdated,
      refreshRates,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Fallback gracefully if used outside provider
    return {
      currencyCode: DEFAULT_CURRENCY_CODE,
      currency: DEFAULT_CURRENCY,
      baseCurrencyCode: DEFAULT_CURRENCY_CODE,
      rates: BASELINE_EXCHANGE_RATES,
      setCurrency: async () => {},
      convert: (amt, from = 'USD', to = 'USD') =>
        ExchangeRateService.convert(amt, from, to),
      getExchangeRate: (from = 'USD', to = 'USD') =>
        ExchangeRateService.getRate(from, to),
      formatCurrency: (amt, opts) => formatCurrencyAmount(amt, DEFAULT_CURRENCY, opts),
      supportedCurrencies: CURRENCY_LIST,
      popularCurrencies: POPULAR_CURRENCY_CODES.map((code) => CURRENCIES[code]).filter(Boolean),
      isLoading: false,
      lastRatesUpdated: new Date(),
      refreshRates: async () => false,
    };
  }
  return ctx;
}
