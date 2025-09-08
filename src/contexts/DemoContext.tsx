import React, { createContext, useContext } from 'react';

// Mock data for demo mode
const mockUser = {
  id: 'demo-user-123',
  email: 'demo@nachweis-meister.de',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProfile = {
  id: 'demo-profile-123',
  tenant_id: 'demo-tenant-123',
  name: 'Demo Benutzer',
  email: 'demo@nachweis-meister.de',
  role: 'owner' as const,
};

const mockAuthContext = {
  user: mockUser,
  session: {
    access_token: 'demo-token',
    refresh_token: 'demo-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: mockUser,
  },
  profile: mockProfile,
  loading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  completeSetup: async () => ({ error: null }),
};

// Demo-specific auth context that overrides the real one
const DemoAuthContext = createContext(mockAuthContext);

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  return <DemoAuthContext.Provider value={mockAuthContext}>{children}</DemoAuthContext.Provider>;
}

// Hook that provides demo auth context
export function useDemoAuthContext() {
  return useContext(DemoAuthContext);
}