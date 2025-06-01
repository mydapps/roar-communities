/**
 * Utility functions for blockchain explorer URLs
 * Since the app is on Base network, all explorer links should point to Basescan
 */

/**
 * Get the explorer URL for a transaction hash on Base network
 * @param txHash - The transaction hash
 * @returns The full Basescan URL for the transaction
 */
export const getExplorerUrl = (txHash: string): string => {
  return `https://basescan.org/tx/${txHash}`;
};

/**
 * Get the explorer URL for an address on Base network
 * @param address - The wallet/contract address
 * @returns The full Basescan URL for the address
 */
export const getAddressExplorerUrl = (address: string): string => {
  return `https://basescan.org/address/${address}`;
};

/**
 * Get the explorer name (for display purposes)
 * @returns The name of the explorer
 */
export const getExplorerName = (): string => {
  return 'Basescan';
}; 