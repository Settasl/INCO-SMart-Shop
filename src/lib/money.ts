/**
 * Safe Money & Numeric Utilities for INCO Smart Shop
 * Prevents floating point inaccuracy by supporting minor-unit (cents) integer conversion,
 * safe rounding, and consistent currency formatting.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
}

export const DEFAULT_CURRENCY: CurrencyConfig = {
  code: "LRD",
  symbol: "L$",
  decimals: 2,
};

/**
 * Converts a decimal monetary amount to integer minor units (e.g. $10.50 -> 1050)
 */
export function toMinorUnits(amount: number, decimals: number = 2): number {
  if (!Number.isFinite(amount)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(amount * multiplier);
}

/**
 * Converts integer minor units back to standard decimal float (e.g. 1050 -> 10.50)
 */
export function fromMinorUnits(minorUnits: number, decimals: number = 2): number {
  if (!Number.isFinite(minorUnits)) return 0;
  const divisor = Math.pow(10, decimals);
  return minorUnits / divisor;
}

/**
 * Rounds a number safely to fixed decimal places without IEEE 754 precision drift
 */
export function roundSafe(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  return fromMinorUnits(toMinorUnits(value, decimals), decimals);
}

/**
 * Formats a monetary number for display with proper thousands separators and currency symbol
 */
export function formatMoney(
  amount: number,
  currencySymbol: string = "$",
  decimals: number = 2
): string {
  if (!Number.isFinite(amount)) return `${currencySymbol}0.00`;
  const safe = roundSafe(amount, decimals);
  return `${currencySymbol}${safe.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Validates whether a quantity is a valid non-negative number
 */
export function isValidQuantity(qty: unknown): boolean {
  return typeof qty === "number" && Number.isFinite(qty) && qty >= 0;
}

/**
 * Validates whether a price is a valid non-negative number
 */
export function isValidPrice(price: unknown): boolean {
  return typeof price === "number" && Number.isFinite(price) && price >= 0;
}
