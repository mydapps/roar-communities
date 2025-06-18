export type SpecialCommand = 'buzz' | 'eth' | 'ethereum' | 'btc' | 'bitcoin' | 'base' | 'sol' | 'solana' | 'dapps' | 'heart' | 'love' | 'roar' | 'roars';

export type EffectType = 'buzz' | 'eth' | 'btc' | 'base' | 'sol' | 'dapps' | 'heart' | 'roar';

// Map commands to their effect types
const commandToEffect: Record<SpecialCommand, EffectType> = {
  buzz: 'buzz',
  eth: 'eth',
  ethereum: 'eth',
  btc: 'btc',
  bitcoin: 'btc',
  base: 'base',
  sol: 'sol',
  solana: 'sol',
  dapps: 'dapps',
  heart: 'heart',
  love: 'heart',
  roar: 'roar',
  roars: 'roar',
};

// All valid commands
export const SPECIAL_COMMANDS: SpecialCommand[] = [
  'buzz', 'eth', 'ethereum', 'btc', 'bitcoin', 'base', 'sol', 'solana', 'dapps', 'heart', 'love', 'roar', 'roars'
];

/**
 * Check if a message is a special command
 */
export const isSpecialCommand = (message: string): boolean => {
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) return false;
  
  const command = trimmed.slice(1).toLowerCase() as SpecialCommand;
  return SPECIAL_COMMANDS.includes(command);
};

/**
 * Extract the command from a message
 */
export const extractCommand = (message: string): SpecialCommand | null => {
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) return null;
  
  const command = trimmed.slice(1).toLowerCase() as SpecialCommand;
  return SPECIAL_COMMANDS.includes(command) ? command : null;
};

/**
 * Get the effect type for a command
 */
export const getEffectType = (command: SpecialCommand): EffectType => {
  return commandToEffect[command];
};

/**
 * Get display text for a command (what shows in the message bubble)
 */
export const getCommandDisplayText = (command: SpecialCommand): string => {
  const displayTexts: Record<SpecialCommand, string> = {
    buzz: '📳 Buzz!',
    eth: '⟠ Ethereum',
    ethereum: '⟠ Ethereum',
    btc: '₿ Bitcoin',
    bitcoin: '₿ Bitcoin',
    base: '🔵 Base',
    sol: '◎ Solana',
    solana: '◎ Solana',
    dapps: '🚀 Dapps.co',
    heart: '❤️ Love',
    love: '❤️ Love',
    roar: '🦁 ROAR!',
    roars: '🦁 ROARS!',
  };
  
  return displayTexts[command];
};

/**
 * Check if message should trigger animation for receiver (via SSE)
 */
export const shouldTriggerReceiverAnimation = (message: string, isRead: boolean): boolean => {
  return isSpecialCommand(message) && isRead;
}; 