import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface A11yContextType {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  screenReaderMode: boolean;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const A11yContext = createContext<A11yContextType | null>(null);

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
}

interface A11yProviderProps {
  children: ReactNode;
}

export function A11yProvider({ children }: A11yProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Detect screen reader usage
    const detectScreenReader = () => {
      // Check if user is navigating with keyboard only
      let keyboardNavigation = false;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          keyboardNavigation = true;
          setScreenReaderMode(true);
        }
      };

      const handleMouseDown = () => {
        if (keyboardNavigation) {
          keyboardNavigation = false;
          // Don't immediately disable screen reader mode
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    };

    const cleanupScreenReaderDetection = detectScreenReader();

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      cleanupScreenReaderDetection();
    };
  }, []);

  // Apply CSS classes based on preferences
  useEffect(() => {
    const root = document.documentElement;
    
    if (prefersReducedMotion) {
      root.classList.add('motion-reduce');
    } else {
      root.classList.remove('motion-reduce');
    }
    
    if (prefersHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [prefersReducedMotion, prefersHighContrast]);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const value: A11yContextType = {
    prefersReducedMotion,
    prefersHighContrast,
    screenReaderMode,
    announceToScreenReader,
  };

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

// Live region component for screen reader announcements
export function LiveRegion({ 
  children, 
  priority = 'polite' 
}: { 
  children: ReactNode; 
  priority?: 'polite' | 'assertive' | 'off'; 
}) {
  return (
    <div 
      aria-live={priority} 
      aria-atomic="true" 
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Skip link component for keyboard navigation
export function SkipLink({ 
  href = '#main-content', 
  children = 'Zum Hauptinhalt springen' 
}: { 
  href?: string; 
  children?: string; 
}) {
  return (
    <a
      href={href}
      className="absolute top-0 left-0 z-50 px-4 py-2 bg-brand-primary text-brand-on-primary font-medium focus:translate-y-0 -translate-y-full transition-transform"
    >
      {children}
    </a>
  );
}