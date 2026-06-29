import { Transaction } from "@/repositories/transaction.repository";

export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "$",
    AUD: "$",
  };
  return symbols[code] || code || "$";
}

export function formatCurrencyValue(amount: number, currencyCode: string): string {
  const locales: Record<string, string> = {
    INR: "en-IN",
    USD: "en-US",
    EUR: "en-IE",
    GBP: "en-GB",
    CAD: "en-CA",
    AUD: "en-AU",
  };
  const cleanCode = ["INR", "USD", "EUR", "GBP", "CAD", "AUD"].includes(currencyCode)
    ? currencyCode
    : "USD";
  const locale = locales[currencyCode] || "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cleanCode,
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Formats a numeric amount as a currency string.
 * @param amount - The numeric amount
 * @param locale - The locale string (default: "en-US")
 * @param currency - The currency code (default: "USD")
 */
export function formatCurrency(amount: number, locale = "en-US", currency = "USD"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${currency || "$"}${amount.toFixed(2)}`;
  }
}

/**
 * Formats a YYYY-MM-DD date string into a human-readable format.
 * @param dateStr - The YYYY-MM-DD date string
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Append timezone offset padding to avoid UTC conversion shifts
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Calculates the net balance from a list of transactions.
 * Transactions with type "income" are treated as positive additions,
 * whereas "expense" transactions are subtracted.
 */
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, curr) => {
    const amount = Math.abs(curr.amount);
    return curr.type === "income" ? acc + amount : acc - amount;
  }, 0);
}

/**
 * Calculates the savings rate as a percentage of income.
 * @param income - Total monthly income
 * @param savings - Total savings contributed
 */
export function calculateSavingsRate(income: number, savings: number): number {
  if (income <= 0) return 0;
  const rate = (savings / income) * 100;
  return Math.round(Math.max(0, Math.min(100, rate)));
}

/**
 * Calculates the sum of all monthly expenses for a given YYYY-MM month string.
 */
export function calculateMonthlyExpenses(transactions: Transaction[], yearMonth: string): number {
  return transactions
    .filter((t) => t.type === "expense" && t.date.startsWith(yearMonth))
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
}

/**
 * Calculates the sum of all monthly incomes for a given YYYY-MM month string.
 */
export function calculateMonthlyIncome(transactions: Transaction[], yearMonth: string): number {
  return transactions
    .filter((t) => t.type === "income" && t.date.startsWith(yearMonth))
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
}

/**
 * Calculates the growth rate percentage from previous to current value.
 * Returns null if previous is 0 or missing (prevents division by zero).
 */
export function calculateGrowthRate(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

