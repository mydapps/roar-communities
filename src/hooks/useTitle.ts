import { useEffect } from 'react';

/**
 * A custom React hook that sets the document title
 * @param title The title to set for the page
 * @param suffix Optional suffix to append to the title
 */
export const useTitle = (title: string, suffix?: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = suffix ? `${title} | ${suffix}` : title;

    return () => {
      document.title = prevTitle;
    };
  }, [title, suffix]);
}; 