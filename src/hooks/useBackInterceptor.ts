'use client';

import { useEffect, useRef } from 'react';

/**
 * Intercepts browser/device back button popstate events to close a modal or overlay.
 * 
 * @param isOpen Whether the modal/overlay is currently open.
 * @param onClose Callback to close the modal/overlay.
 * @param key Unique key to identify this modal's state in history.
 */
export function useBackInterceptor(isOpen: boolean, onClose: () => void, key: string) {
  const isPushedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      // If our state is popped (or no longer active), close the modal
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onClose();
      }
    };

    if (isOpen) {
      if (!isPushedRef.current) {
        // Push a state so back button pops it instead of navigating the page
        window.history.pushState({ [key]: true }, '');
        isPushedRef.current = true;
        window.addEventListener('popstate', handlePopState);
      }
    } else {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        window.removeEventListener('popstate', handlePopState);
        // Safely go back in history to clean up our pushed state since it was closed manually
        window.history.back();
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose, key]);
}
