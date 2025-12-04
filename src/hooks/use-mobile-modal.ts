import { useEffect, useState, useCallback } from 'react';

export function useMobileModal(
  initialOpen: boolean = false,
  onClose?: () => void
) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    // Push state to history to support back button closing
    window.history.pushState({ modalOpen: true }, '', window.location.href);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (onClose) onClose();
    // If we are closing via UI, we might need to go back if the history state is ours.
    // However, checking history state is tricky.
    // A safer bet for "Back button support" is to just let the back button do its thing (popstate),
    // and for UI close, we just close.
    // BUT, if we pushed state, we should probably pop it if we close via UI to avoid "dead" forward history.
    // Let's try to be smart:
    // If we have a state, go back.
    if (window.history.state?.modalOpen) {
        window.history.back();
    }
  }, [onClose]);

  // Handle external open change (e.g. from Dialog prop)
  const onOpenChange = useCallback((open: boolean) => {
    if (open) {
        // Opening via UI (unlikely for controlled, but possible)
        setIsOpen(true);
        window.history.pushState({ modalOpen: true }, '', window.location.href);
    } else {
        // Closing via UI (backdrop, X button)
        setIsOpen(false);
        if (onClose) onClose();
        if (window.history.state?.modalOpen) {
            window.history.back();
        }
    }
  }, [onClose]);

  useEffect(() => {
    const handlePopState = () => {
      // If we popped state, it means we went back.
      // If the modal was open, we should close it.
      // The state we are popping TO might be null (base state).
      setIsOpen(false);
      if (onClose) onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

  return {
    isOpen,
    open,
    close,
    onOpenChange,
    setIsOpen // Expose raw setter if needed, but prefer open/close
  };
}
