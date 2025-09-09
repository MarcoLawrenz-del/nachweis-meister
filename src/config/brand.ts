export const BRAND = {
  name: 'subfix',
  tagline: 'Compliance vereinfacht',
  description: 'Nachunternehmer-Management für Bauprojekte',
  logo: {
    light: '/brand/subfix-logo.svg',
    dark: '/brand/subfix-logo-inverted.svg'
  },
  colors: {
    primary: 'var(--brand-primary)',
    primaryFg: 'var(--brand-on-primary)',
    accent: 'var(--brand-accent)',
    success: 'var(--brand-success)',
    warning: 'var(--brand-warning)',
    danger: 'var(--brand-danger)'
  },
  radius: {
    base: '1rem'
  },
  terms: {
    // Konsistente Begriffe für die gesamte App
    subcontractor: 'Nachunternehmer',
    engagement: 'Engagement',
    requiredDocument: 'Pflichtdokument',
    inReview: 'In Prüfung',
    validUntil: 'Gültig bis',
    escalation: 'Eskalation',
    compliance: 'Compliance',
    project: 'Bauprojekt',
    enterprise: 'Enterprise'
  }
} as const;