import React, { createContext, useContext } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

type SupabaseAuthContextType = ReturnType<typeof useSupabaseAuth>;

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useSupabaseAuth();
  
  return (
    <SupabaseAuthContext.Provider value={auth}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuthContext() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuthContext must be used within a SupabaseAuthProvider');
  }
  return context;
}