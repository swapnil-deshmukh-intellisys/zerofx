import { useEffect } from 'react';

/**
 * Custom hook to scroll to top when component mounts
 * @param {boolean} smooth - Whether to use smooth scrolling (default: true)
 * @param {number} delay - Delay in milliseconds before scrolling (default: 0)
 */
const useScrollToTop = (smooth = true, delay = 0) => {
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    };

    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timeoutId);
    } else {
      scrollToTop();
    }
  }, [smooth, delay]);
};

export default useScrollToTop;
