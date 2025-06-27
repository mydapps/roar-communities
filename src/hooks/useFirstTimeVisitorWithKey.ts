import { useState, useEffect } from 'react';

export const useFirstTimeVisitorWithKey = (storageKey: string) => {
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkFirstTimeVisitor = () => {
      try {
        const hasVisited = localStorage.getItem(storageKey);
        setIsFirstTime(!hasVisited);
      } catch (error) {
        // If localStorage is not available, assume first time
        setIsFirstTime(true);
      }
      setIsLoading(false);
    };

    checkFirstTimeVisitor();
  }, [storageKey]);

  const markAsVisited = () => {
    try {
      localStorage.setItem(storageKey, 'true');
      setIsFirstTime(false);
    } catch (error) {
      console.warn('Unable to save to localStorage:', error);
    }
  };

  const resetFirstTimeStatus = () => {
    try {
      localStorage.removeItem(storageKey);
      setIsFirstTime(true);
    } catch (error) {
      console.warn('Unable to remove from localStorage:', error);
    }
  };

  return {
    isFirstTime,
    isLoading,
    markAsVisited,
    resetFirstTimeStatus
  };
}; 