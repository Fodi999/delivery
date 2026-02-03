/**
 * Price utilities for handling cents-based pricing
 * All prices in DB are stored in cents (42.00 zł = 4200)
 */

/**
 * Format price from cents to zł string
 * @param cents - Price in cents (e.g., 3200)
 * @returns Formatted price string (e.g., "32.00 zł")
 */
export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} zł`;
}

/**
 * Convert zł to cents
 * @param zl - Price in zł (e.g., 32.5)
 * @returns Price in cents (e.g., 3250)
 */
export function toCents(zl: number): number {
  return Math.round(zl * 100);
}

/**
 * Get price in zł as number
 * @param cents - Price in cents (e.g., 3200)
 * @returns Price in zł (e.g., 32.00)
 */
export function toZl(cents: number): number {
  return cents / 100;
}
