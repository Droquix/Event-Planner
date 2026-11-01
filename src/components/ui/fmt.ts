/**
 * Currency formatting utility for Indian Rupee amounts.
 */
export function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
