/**
 * Formats a number or string representation of a number to a fixed number of decimal places.
 * Handles undefined input gracefully.
 *
 * @param value The number or string to format.
 * @param decimals The number of decimal places (default is 6).
 * @returns The formatted string, or '0.000000' if input is undefined.
 */
export const formatNumber = (value: number | string | undefined, decimals: number = 6): string => {
  if (value === undefined || value === null) {
    // Return a string with the specified number of zeros after the decimal
    return `0.${'0'.repeat(decimals)}`;
  }
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    // Check if num is NaN after parsing
    if (isNaN(num)) {
       return `0.${'0'.repeat(decimals)}`;
    }
    return num.toFixed(decimals);
  } catch (error) {
    console.error("Error formatting number:", value, error);
    return `0.${'0'.repeat(decimals)}`;
  }
}; 