// Currency conversion rates (in a real app, these would come from an API)
const EXCHANGE_RATES: Record<string, number> = {
  'INR': 1, // Base currency
  'USD': 0.012, // 1 INR = 0.012 USD
  'EUR': 0.011, // 1 INR = 0.011 EUR
  'GBP': 0.0095, // 1 INR = 0.0095 GBP
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  'INR': '₹',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
};

// Currency names
const CURRENCY_NAMES: Record<string, string> = {
  'INR': 'Indian Rupee',
  'USD': 'US Dollar',
  'EUR': 'Euro',
  'GBP': 'British Pound',
};

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private currentCurrency: string = 'INR';

  private constructor() {
    // Load currency from localStorage
    this.currentCurrency = localStorage.getItem('currency') || 'INR';
  }

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  public setCurrency(currency: string): void {
    this.currentCurrency = currency;
    localStorage.setItem('currency', currency);
  }

  public getCurrency(): string {
    return this.currentCurrency;
  }

  public getCurrencyConfig(): CurrencyConfig {
    return {
      code: this.currentCurrency,
      symbol: CURRENCY_SYMBOLS[this.currentCurrency] || '₹',
      name: CURRENCY_NAMES[this.currentCurrency] || 'Indian Rupee',
      rate: EXCHANGE_RATES[this.currentCurrency] || 1,
    };
  }

  public convert(amount: number, fromCurrency: string = 'INR', toCurrency?: string): number {
    const targetCurrency = toCurrency || this.currentCurrency;
    
    if (fromCurrency === targetCurrency) {
      return amount;
    }

    // Convert to INR first, then to target currency
    const inrAmount = fromCurrency === 'INR' ? amount : amount / EXCHANGE_RATES[fromCurrency];
    const convertedAmount = targetCurrency === 'INR' ? inrAmount : inrAmount * EXCHANGE_RATES[targetCurrency];
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }

  public format(amount: number, currency?: string): string {
    const targetCurrency = currency || this.currentCurrency;
    const convertedAmount = this.convert(amount, 'INR', targetCurrency);
    const symbol = CURRENCY_SYMBOLS[targetCurrency] || '₹';
    
    // Format with appropriate locale
    const locale = this.getLocaleForCurrency(targetCurrency);
    return `${symbol}${convertedAmount.toLocaleString(locale, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  public formatCompact(amount: number, currency?: string): string {
    const targetCurrency = currency || this.currentCurrency;
    const convertedAmount = this.convert(amount, 'INR', targetCurrency);
    const symbol = CURRENCY_SYMBOLS[targetCurrency] || '₹';
    
    if (convertedAmount >= 10000000) { // 1 crore
      return `${symbol}${(convertedAmount / 10000000).toFixed(1)}Cr`;
    } else if (convertedAmount >= 100000) { // 1 lakh
      return `${symbol}${(convertedAmount / 100000).toFixed(1)}L`;
    } else if (convertedAmount >= 1000) { // 1 thousand
      return `${symbol}${(convertedAmount / 1000).toFixed(1)}K`;
    } else {
      return `${symbol}${convertedAmount.toFixed(0)}`;
    }
  }

  private getLocaleForCurrency(currency: string): string {
    const localeMap: Record<string, string> = {
      'INR': 'en-IN',
      'USD': 'en-US',
      'EUR': 'en-EU',
      'GBP': 'en-GB',
    };
    return localeMap[currency] || 'en-IN';
  }

  public getAvailableCurrencies(): CurrencyConfig[] {
    return Object.keys(CURRENCY_SYMBOLS).map(code => ({
      code,
      symbol: CURRENCY_SYMBOLS[code],
      name: CURRENCY_NAMES[code],
      rate: EXCHANGE_RATES[code],
    }));
  }

  public getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1;
    
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    
    return toRate / fromRate;
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();

// Utility functions
export const formatCurrency = (amount: number, currency?: string): string => {
  return currencyService.format(amount, currency);
};

export const formatCurrencyCompact = (amount: number, currency?: string): string => {
  return currencyService.formatCompact(amount, currency);
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency?: string): number => {
  return currencyService.convert(amount, fromCurrency, toCurrency);
};

export const getCurrencySymbol = (currency?: string): string => {
  const targetCurrency = currency || currencyService.getCurrency();
  return CURRENCY_SYMBOLS[targetCurrency] || '₹';
};
