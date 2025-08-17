import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to maintain input focus during re-renders
 * Fixes the cursor disappearing issue in controlled inputs
 */
export const useFocusableInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wasFocused = useRef(false);
  const cursorPosition = useRef<number | null>(null);

  // Track when input gains focus
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    wasFocused.current = true;
    
    // Scroll into view on mobile
    setTimeout(() => {
      e.target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 300);
  }, []);

  // Track when input loses focus
  const handleBlur = useCallback(() => {
    wasFocused.current = false;
    cursorPosition.current = null;
  }, []);

  // Track cursor position during changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputRef.current === e.target) {
      cursorPosition.current = e.target.selectionStart;
    }
  }, []);

  // Restore focus and cursor position after re-renders
  useEffect(() => {
    if (wasFocused.current && inputRef.current && document.activeElement !== inputRef.current) {
      // Restore focus
      inputRef.current.focus();
      
      // Restore cursor position
      if (cursorPosition.current !== null) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(
              cursorPosition.current!,
              cursorPosition.current!
            );
          }
        }, 0);
      }
    }
  });

  return {
    inputRef,
    handleFocus,
    handleBlur,
    handleChange,
  };
}; 