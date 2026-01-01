import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amount based on currency code
 */
export function formatCurrency(amount: number | string, currencyCode: string = "INR"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (currencyCode === "INR") {
    return `₹${numAmount.toFixed(2)}`;
  } else if (currencyCode === "USD") {
    return `$${numAmount.toFixed(2)}`;
  } else {
    return `${currencyCode} ${numAmount.toFixed(2)}`;
  }
}
