import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { debug } from '@/lib/debug';
import { useEnhancedDemoData } from './useEnhancedDemoData';
import '@/styles/brand.css';

/**
 * Hook that provides demo data when in demo mode
 * @deprecated Use useEnhancedDemoData for new implementations
 */
export function useDemoData() {
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');
  const enhancedDemo = useEnhancedDemoData();
  
  const [demoMode] = useState(isDemo);
  
  useEffect(() => {
    if (demoMode) {
      debug.log('🎯 Demo mode activated - using enhanced sample data');
    }
  }, [demoMode]);
  
  // Return enhanced data but maintain backward compatibility
  return {
    isDemo: demoMode,
    demoStats: enhancedDemo.demoStats,
    demoCriticalItems: enhancedDemo.demoCriticalItems,
    demoSubcontractors: enhancedDemo.demoSubcontractors,
    demoProjects: enhancedDemo.demoProjects
  };
}