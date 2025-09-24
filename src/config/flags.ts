// Feature Flags Configuration
// Central place for all feature toggles in the application

export const featureFlags = {
  // Demo mode for testing and development
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  
  // Reviewer/Auditor view capabilities
  prueferView: import.meta.env.VITE_PRUEFER_VIEW === 'true',
  
  // Pricing and payment features
  pricingEnabled: import.meta.env.VITE_PRICING_ENABLED !== 'false', // Default: true
  
  // Single Sign-On integration
  ssoEnabled: import.meta.env.VITE_SSO_ENABLED === 'true',
  
  // Magic link email domain allowlist
  magicAllowlistEnabled: import.meta.env.VITE_MAGIC_ALLOWLIST_ENABLED === 'true',
  
  // Safe mode for emergency shutdown
  safeMode: import.meta.env.VITE_SAFE_MODE === 'true',
  
  // Public upload functionality
  publicUploadEnabled: import.meta.env.VITE_PUBLIC_UPLOAD_ENABLED === 'true',
} as const;

// Helper functions for feature flag checks
export const isFeatureEnabled = (flag: keyof typeof featureFlags): boolean => {
  return featureFlags[flag];
};

// Environment validation
export const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ];

  const missingVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file configuration.'
    );
  }
};

// Initialize environment validation on import
validateEnvironment();