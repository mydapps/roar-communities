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

/**
 * Formats ETH amounts with proper handling of scientific notation and trailing zeros.
 * Always rounds to 6 decimal places and removes trailing zeros.
 *
 * @param value The ETH amount to format (number or string).
 * @returns The formatted ETH string without trailing zeros.
 */
export const formatETH = (value: number | string | undefined): string => {
  if (value === undefined || value === null) {
    return '0';
  }
  
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if num is NaN after parsing
    if (isNaN(num)) {
      return '0';
    }
    
    // Handle very small numbers that might display in scientific notation
    // Round to 6 decimal places first
    const rounded = Math.round(num * 1000000) / 1000000;
    
    // Format to 6 decimal places
    const formatted = rounded.toFixed(6);
    
    // Remove trailing zeros and decimal point if necessary
    return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  } catch (error) {
    console.error("Error formatting ETH amount:", value, error);
    return '0';
  }
}; 