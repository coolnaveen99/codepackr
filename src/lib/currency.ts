export interface CurrencyDefinition {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  symbolPosition: 'prefix' | 'suffix';
  decimalPlaces: number;
  rateVsUsd: number; // Baseline exchange rate vs USD
}

export const CURRENCIES: CurrencyDefinition[] = [
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 1.0,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 0.92,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 0.79,
  },
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 83.5,
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    flag: '🇯🇵',
    symbolPosition: 'prefix',
    decimalPlaces: 0,
    rateVsUsd: 154.5,
  },
  {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 1.36,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 1.52,
  },
  {
    code: 'CHF',
    symbol: 'CHF ',
    name: 'Swiss Franc',
    flag: '🇨🇭',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 0.90,
  },
  {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    flag: '🇨🇳',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 7.24,
  },
  {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    flag: '🇧🇷',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 5.45,
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    flag: '🇸🇬',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 1.35,
  },
  {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 3.6725,
  },
  {
    code: 'SAR',
    symbol: 'SAR ',
    name: 'Saudi Riyal',
    flag: '🇸🇦',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 3.75,
  },
  {
    code: 'MXN',
    symbol: 'Mex$',
    name: 'Mexican Peso',
    flag: '🇲🇽',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 18.25,
  },
  {
    code: 'ZAR',
    symbol: 'R ',
    name: 'South African Rand',
    flag: '🇿🇦',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 18.15,
  },
  {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    flag: '🇰🇷',
    symbolPosition: 'prefix',
    decimalPlaces: 0,
    rateVsUsd: 1375.0,
  },
  {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    flag: '🇳🇿',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 1.64,
  },
  {
    code: 'SEK',
    symbol: 'kr ',
    name: 'Swedish Krona',
    flag: '🇸🇪',
    symbolPosition: 'suffix',
    decimalPlaces: 2,
    rateVsUsd: 10.55,
  },
  {
    code: 'NOK',
    symbol: 'kr ',
    name: 'Norwegian Krone',
    flag: '🇳🇴',
    symbolPosition: 'suffix',
    decimalPlaces: 2,
    rateVsUsd: 10.65,
  },
  {
    code: 'HKD',
    symbol: 'HK$',
    name: 'Hong Kong Dollar',
    flag: '🇭🇰',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 7.82,
  },
  {
    code: 'PHP',
    symbol: '₱',
    name: 'Philippine Peso',
    flag: '🇵🇭',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 58.2,
  },
  {
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht',
    flag: '🇹🇭',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 36.8,
  },
  {
    code: 'MYR',
    symbol: 'RM ',
    name: 'Malaysian Ringgit',
    flag: '🇲🇾',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 4.71,
  },
  {
    code: 'IDR',
    symbol: 'Rp ',
    name: 'Indonesian Rupiah',
    flag: '🇮🇩',
    symbolPosition: 'prefix',
    decimalPlaces: 0,
    rateVsUsd: 16250.0,
  },
  {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    flag: '🇹🇷',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 32.8,
  },
  {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Zloty',
    flag: '🇵🇱',
    symbolPosition: 'suffix',
    decimalPlaces: 2,
    rateVsUsd: 3.96,
  },
  {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli New Shekel',
    flag: '🇮🇱',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 3.72,
  },
  {
    code: 'DKK',
    symbol: 'kr ',
    name: 'Danish Krone',
    flag: '🇩🇰',
    symbolPosition: 'suffix',
    decimalPlaces: 2,
    rateVsUsd: 6.87,
  },
  {
    code: 'CLP',
    symbol: 'CLP$',
    name: 'Chilean Peso',
    flag: '🇨🇱',
    symbolPosition: 'prefix',
    decimalPlaces: 0,
    rateVsUsd: 920.0,
  },
  {
    code: 'COP',
    symbol: 'COL$',
    name: 'Colombian Peso',
    flag: '🇨🇴',
    symbolPosition: 'prefix',
    decimalPlaces: 0,
    rateVsUsd: 4020.0,
  },
  {
    code: 'EGP',
    symbol: 'E£',
    name: 'Egyptian Pound',
    flag: '🇪🇬',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 48.3,
  },
  {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    flag: '🇳🇬',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 1480.0,
  },
  {
    code: 'KES',
    symbol: 'KSh ',
    name: 'Kenyan Shilling',
    flag: '🇰🇪',
    symbolPosition: 'prefix',
    decimalPlaces: 2,
    rateVsUsd: 129.0,
  },
];

export const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

export const DEFAULT_CURRENCY_CODE = 'USD';

export function getCurrency(code: string): CurrencyDefinition {
  const found = CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || CURRENCIES[0];
}

export function formatCurrencyAmount(
  amount: number,
  currency: CurrencyDefinition,
  options?: {
    decimals?: number;
    convertFromUsd?: boolean;
    includeCode?: boolean;
  }
): string {
  let val = amount;
  if (options?.convertFromUsd && currency.code !== 'USD') {
    val = amount * currency.rateVsUsd;
  }

  const decimals = options?.decimals !== undefined ? options.decimals : currency.decimalPlaces;

  // Format with standard thousands separator
  const formattedNumber = val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let result = '';
  if (currency.symbolPosition === 'prefix') {
    result = `${currency.symbol}${formattedNumber}`;
  } else {
    result = `${formattedNumber} ${currency.symbol.trim()}`;
  }

  if (options?.includeCode) {
    result = `${result} ${currency.code}`;
  }

  return result;
}
