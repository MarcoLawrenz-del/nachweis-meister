// Email configuration for consistent branding across all edge functions
export const EMAIL_CONFIG = {
  invitations: {
    from: 'invitations@subfix.de',
    replyTo: 'support@subfix.de'
  },
  reviews: {
    from: 'reviews@subfix.de',
    replyTo: 'support@subfix.de'
  },
  onboarding: {
    from: 'onboarding@subfix.de',
    replyTo: 'support@subfix.de'
  },
  team: {
    from: 'team@subfix.de',
    replyTo: 'support@subfix.de'
  }
} as const;

export type EmailType = keyof typeof EMAIL_CONFIG;

export const getEmailConfig = (type: EmailType) => EMAIL_CONFIG[type];