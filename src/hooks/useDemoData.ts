import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Demo data for dashboard
const demoStats = {
  totalSubcontractors: 12,
  totalProjects: 8,
  expiringSoon: 3,
  expired: 1,
  inReview: 5,
  approved: 28
};

const demoCriticalItems = [
  {
    id: 'demo-1',
    company_name: 'Müller Bau GmbH',
    project_name: 'Bürogebäude Berlin',
    document_type: 'Freistellungsbescheinigung',
    status: 'expired',
    due_date: '2025-01-05',
    days_until_expiry: -3
  },
  {
    id: 'demo-2',
    company_name: 'Schmidt Elektro',
    project_name: 'Wohnkomplex Hamburg',
    document_type: 'A1-Entsende-Nachweis',
    status: 'expiring',
    due_date: '2025-01-15',
    days_until_expiry: 7
  },
  {
    id: 'demo-3',
    company_name: 'Weber Sanitär',
    project_name: 'Renovierung München',
    document_type: 'Gewerbeschein',
    status: 'expiring',
    due_date: '2025-01-20',
    days_until_expiry: 12
  }
];

const demoSubcontractors = [
  {
    id: 'demo-sub-1',
    company_name: 'Müller Bau GmbH',
    contact_name: 'Hans Müller',
    contact_email: 'info@mueller-bau.de',
    phone: '+49 30 123456',
    address: 'Baustraße 1, 10115 Berlin',
    company_type: 'baubetrieb' as const,
    compliance_status: 'inactive',
    status: 'inactive',
    notes: 'Spezialisiert auf Rohbau und Betonarbeiten',
    country_code: 'DE',
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T10:00:00.000Z',
    tenant_id: 'demo-tenant-123',
    activation_date: null,
    last_compliance_check: null,
    next_reminder_date: null,
    project_count: 2,
    critical_issues: 1
  },
  {
    id: 'demo-sub-2',
    company_name: 'Schmidt Elektro',
    contact_name: 'Anna Schmidt',
    contact_email: 'kontakt@schmidt-elektro.de',
    phone: '+49 40 654321',
    address: 'Elektroweg 5, 20095 Hamburg',
    company_type: 'baubetrieb' as const,
    compliance_status: 'active',
    status: 'active',
    notes: 'Elektroinstallationen und Smart Home Systeme',
    country_code: 'DE',
    created_at: '2024-02-01T14:30:00.000Z',
    updated_at: '2024-02-01T14:30:00.000Z',
    tenant_id: 'demo-tenant-123',
    activation_date: '2024-02-01T14:30:00.000Z',
    last_compliance_check: '2024-12-01T10:00:00.000Z',
    next_reminder_date: '2025-02-01T10:00:00.000Z',
    project_count: 3,
    critical_issues: 0
  },
  {
    id: 'demo-sub-3',
    company_name: 'Weber Sanitär',
    contact_name: 'Klaus Weber',
    contact_email: 'service@weber-sanitaer.de',
    phone: '+49 89 987654',
    address: 'Rohrgasse 12, 80331 München',
    company_type: 'einzelunternehmen' as const,
    compliance_status: 'active',
    status: 'active',
    notes: 'Sanitärinstallationen und Heizungstechnik',
    country_code: 'DE',
    created_at: '2024-03-10T09:15:00.000Z',
    updated_at: '2024-03-10T09:15:00.000Z',
    tenant_id: 'demo-tenant-123',
    activation_date: '2024-03-10T09:15:00.000Z',
    last_compliance_check: '2024-12-05T10:00:00.000Z',
    next_reminder_date: '2025-03-10T10:00:00.000Z',
    project_count: 1,
    critical_issues: 0
  }
];

const demoProjects = [
  {
    id: 'demo-proj-1',
    name: 'Bürogebäude Berlin',
    code: 'BB-2024-001',
    address: 'Potsdamer Platz 1, 10785 Berlin',
    created_at: '2024-05-15T10:00:00.000Z',
    updated_at: '2024-05-15T10:00:00.000Z',
    tenant_id: 'demo-tenant-123',
    subcontractor_count: 5,
    critical_count: 1,
    expiring_count: 2
  },
  {
    id: 'demo-proj-2',
    name: 'Wohnkomplex Hamburg',
    code: 'WH-2024-002',
    address: 'Hafencity, 20457 Hamburg',
    created_at: '2024-03-20T14:30:00.000Z',
    updated_at: '2024-03-20T14:30:00.000Z',
    tenant_id: 'demo-tenant-123',
    subcontractor_count: 3,
    critical_count: 0,
    expiring_count: 1
  }
];

/**
 * Hook that provides demo data when in demo mode
 */
export function useDemoData() {
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');
  
  const [demoMode] = useState(isDemo);
  
  useEffect(() => {
    if (demoMode) {
      console.log('🎯 Demo mode activated - using sample data');
    }
  }, [demoMode]);
  
  return {
    isDemo: demoMode,
    demoStats,
    demoCriticalItems,
    demoSubcontractors,
    demoProjects
  };
}