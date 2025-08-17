import { useState, useEffect } from 'react';

const COMMUNITIES_VISITED_KEY = 'dapps_communities_visited';

export const useFirstTimeVisitor = () => {
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkFirstTimeVisitor = () => {
      try {
        const hasVisited = localStorage.getItem(COMMUNITIES_VISITED_KEY);
        setIsFirstTime(!hasVisited);
      } catch (error) {
        // If localStorage is not available, assume first time
        setIsFirstTime(true);
      }
      setIsLoading(false);
    };

    checkFirstTimeVisitor();
  }, []);

  const markAsVisited = () => {
    try {
      localStorage.setItem(COMMUNITIES_VISITED_KEY, 'true');
      setIsFirstTime(false);
    } catch (error) {
      console.warn('Unable to save to localStorage:', error);
    }
  };

  const resetFirstTimeStatus = () => {
    try {
      localStorage.removeItem(COMMUNITIES_VISITED_KEY);
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