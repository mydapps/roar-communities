/**
 * Utility functions to handle browser extension conflicts
 */

/**
 * This helper function captures errors related to browser extensions
 * and prevents them from breaking the application
 */
export const setupBrowserErrorHandler = (): void => {
  const originalConsoleError = console.error;
  
  // Override console.error to filter out extension-related errors
  console.error = function(...args: any[]) {
    // Filter out known browser extension errors
    const errorString = args.join(' ');
    
    if (
      errorString.includes("crossbrowserName is not defined") ||
      errorString.includes("browser is not defined") ||
      errorString.includes("REMOTE_CONFIG_KEYS is not defined") ||
      errorString.includes("webextApi is not defined") ||
      errorString.includes("Cannot read properties of null (reading '1')") ||
      (args[0] && args[0].message && args[0].message.includes("browser extension"))
    ) {
      // Silently ignore these errors
      return;
    }
    
    // Pass through all other errors to the original console.error
    originalConsoleError.apply(console, args);
  };
  
  // Also add a global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    // Check if event.message is a string before calling includes
    const message = typeof event.message === 'string' ? event.message : '';

    if (
      message.includes("crossbrowserName is not defined") ||
      message.includes("browser is not defined") ||
      message.includes("REMOTE_CONFIG_KEYS is not defined") ||
      message.includes("webextApi is not defined") ||
      message.includes("Cannot read properties of null (reading '1')")
    ) {
      // Prevent the error from bubbling up
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    
    // Let other errors propagate normally
    return false;
  }, true);
}; 