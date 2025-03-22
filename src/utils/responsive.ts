
// Additional export for direct use without the hook
export const isMobile = (): boolean => {
  // Check if it's client-side
  if (typeof window === 'undefined') return false;
  
  // Use media query for more reliable detection
  return window.innerWidth < 768;
};
