import { useState, useEffect, useRef } from 'react';

export interface MobileKeyboardState {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  safeViewportHeight: number;
  initialViewportHeight: number;
}

/**
 * Custom hook for detecting mobile keyboard visibility and managing viewport changes
 * @param isActive - Whether the hook should be active (e.g., when a modal is open)
 * @param threshold - Height difference threshold to consider keyboard visible (default: 150px)
 * @returns Object with keyboard state and utilities
 */
export const useMobileKeyboard = (
  isActive: boolean = true, 
  threshold: number = 150
): MobileKeyboardState => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [safeViewportHeight, setSafeViewportHeight] = useState(window.innerHeight);
  const initialViewportHeight = useRef(window.innerHeight);

  useEffect(() => {
    if (!isActive) return;

    // Store initial viewport height when hook becomes active
    initialViewportHeight.current = window.innerHeight;
    setSafeViewportHeight(window.innerHeight);

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDiff = initialViewportHeight.current - currentHeight;
        const keyboardIsVisible = heightDiff > threshold;
        
        setIsKeyboardVisible(keyboardIsVisible);
        setKeyboardHeight(heightDiff);
        setSafeViewportHeight(currentHeight);
        
        console.log('Mobile keyboard detection:', { 
          keyboardIsVisible, 
          heightDiff, 
          currentHeight, 
          initialHeight: initialViewportHeight.current 
        });
      }
    };

    const handleResize = () => {
      // Fallback for browsers without visualViewport support
      const currentHeight = window.innerHeight;
      const heightDiff = initialViewportHeight.current - currentHeight;
      const keyboardIsVisible = heightDiff > threshold;
      
      setIsKeyboardVisible(keyboardIsVisible);
      setKeyboardHeight(heightDiff);
      setSafeViewportHeight(currentHeight);
    };

    // Use visualViewport if available (better detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Initial check
    handleViewportChange();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isActive, threshold]);

  // Reset when becoming inactive
  useEffect(() => {
    if (!isActive) {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      setSafeViewportHeight(window.innerHeight);
    }
  }, [isActive]);

  return {
    isKeyboardVisible,
    keyboardHeight,
    safeViewportHeight,
    initialViewportHeight: initialViewportHeight.current
  };
};

/**
 * Utility function to scroll an element into view with keyboard awareness
 * @param element - The element to scroll into view
 * @param behavior - Scroll behavior ('smooth' | 'auto')
 * @param block - Vertical alignment ('start' | 'center' | 'end' | 'nearest')
 * @param delay - Delay before scrolling (default: 150ms to wait for keyboard)
 */
export const scrollIntoViewWithKeyboard = (
  element: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth',
  block: ScrollLogicalPosition = 'center',
  delay: number = 150
): void => {
  if (!element) return;

  setTimeout(() => {
    element.scrollIntoView({ 
      behavior, 
      block,
      inline: 'nearest'
    });
  }, delay);
};

/**
 * Hook for managing focused input visibility when mobile keyboard appears
 * @param isKeyboardVisible - Whether the keyboard is currently visible
 * @param refs - Array of refs to input elements that should stay visible
 */
export const useFocusedInputScroll = (
  isKeyboardVisible: boolean, 
  refs: Array<React.RefObject<HTMLElement>>
): void => {
  useEffect(() => {
    if (!isKeyboardVisible) return;

    const scrollActiveInputIntoView = () => {
      const activeElement = document.activeElement as HTMLElement;
      const targetRef = refs.find(ref => ref.current === activeElement);
      
      if (targetRef?.current) {
        scrollIntoViewWithKeyboard(targetRef.current, 'smooth', 'center');
      }
    };
    
    scrollActiveInputIntoView();
  }, [isKeyboardVisible, refs]);
};

export default useMobileKeyboard; 