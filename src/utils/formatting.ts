/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency symbol, defaults to USD
 * @param minimumFractionDigits Minimum fraction digits, defaults to 2
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency = 'USD',
  minimumFractionDigits = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format a number with commas
 * @param value Number to format
 * @returns Formatted number with commas
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param length Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, length = 20): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};

/**
 * Format ETH address for display
 * @param address ETH address
 * @returns Formatted address with beginning and end only
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Format a date to a human-readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a date to a human-readable string with time
 * @param date Date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}; 