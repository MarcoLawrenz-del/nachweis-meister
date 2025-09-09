import React, { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

export function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true,
  autoFocus = true 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store the previously focused element
    if (restoreFocus) {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    // Focus the first focusable element or the container
    if (autoFocus) {
      const firstFocusable = getFocusableElements(container)[0];
      if (firstFocusable) {
        (firstFocusable as HTMLElement).focus();
      } else {
        container.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previously focused element
      if (restoreFocus && previouslyFocusedElementRef.current) {
        (previouslyFocusedElementRef.current as HTMLElement).focus();
      }
    };
  }, [active, restoreFocus, autoFocus]);

  return (
    <div ref={containerRef} tabIndex={-1} style={{ outline: 'none' }}>
      {children}
    </div>
  );
}

function getFocusableElements(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])'
  );
}

// Hook for managing focus
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement | null>(null);

  const setFocus = (element: HTMLElement | null) => {
    focusRef.current = element;
    element?.focus();
  };

  const restoreFocus = () => {
    focusRef.current?.focus();
  };

  return { setFocus, restoreFocus, focusRef };
}