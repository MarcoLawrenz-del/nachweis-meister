import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { debug } from '@/lib/debug';

// Enhanced demo seed data with realistic scenarios
const demoTenant = {
  id: 'demo-tenant-123',
  name: 'Demo Bauunternehmen GmbH',
  created_at: '2024-01-01T00:00:00.000Z'
};

// 3 Subcontractors with different statuses as required
const demoSubcontractors = [
  {
    id: 'demo-sub-1',
    company_name: 'Müller Bau GmbH',
    contact_name: 'Hans Müller',
    contact_email: 'info@mueller-bau.de',
    phone: '+49 30 123456',
    address: 'Baustraße 1, 10115 Berlin',
    company_type: 'baubetrieb' as const,
    compliance_status: 'non_compliant' as const,
    status: 'inactive' as const, // INACTIVE
    notes: 'Spezialisiert auf Rohbau und Betonarbeiten. Fehlende Nachweise.',
    country_code: 'DE',
    requires_employees: true,
    has_non_eu_workers: false,
    employees_not_employed_in_germany: false,
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-12-08T14:30:00.000Z',
    tenant_id: 'demo-tenant-123',
    activation_date: null,
    last_compliance_check: '2024-12-08T14:30:00.000Z',
    next_reminder_date: '2025-01-15T00:00:00.000Z',
    project_count: 1,
    critical_issues: 1
  },
  {
    id: 'demo-sub-2', 
    company_name: 'Schmidt Elektro AG',
    contact_name: 'Anna Schmidt',
    contact_email: 'kontakt@schmidt-elektro.de',
    phone: '+49 40 654321',
    address: 'Elektroweg 5, 20095 Hamburg',
    company_type: 'baubetrieb' as const,
    compliance_status: 'compliant' as const,
    status: 'active' as const, // ACTIVE + COMPLIANT
    notes: 'Elektroinstallationen und Smart Home Systeme. Vollständig konform.',
    country_code: 'DE',
    requires_employees: true,
    has_non_eu_workers: false,
    employees_not_employed_in_germany: false,
    created_at: '2024-02-01T14:30:00.000Z',
    updated_at: '2024-12-08T14:30:00.000Z',
    tenant_id: 'demo-tenant-123',
    activation_date: '2024-02-01T14:30:00.000Z',
    last_compliance_check: '2024-12-08T14:30:00.000Z',
    next_reminder_date: '2025-06-01T00:00:00.000Z',
    project_count: 1,
    critical_issues: 0
  },
  {
    id: 'demo-sub-3',
    company_name: 'Kowalski Entsendung',
    contact_name: 'Jan Kowalski',
    contact_email: 'info@kowalski-bau.pl',
    phone: '+48 22 123456',
    address: 'Budowlana 15, 00-001 Warszawa, Polen',
    company_type: 'einzelunternehmen' as const,
    compliance_status: 'expiring_soon' as const,
    status: 'active' as const, // ACTIVE + WITH POSTING (Entsendung)
    notes: 'Entsendungsbetrieb aus Polen. Specialisiert auf Maurerarbeiten.',
    country_code: 'PL',
    requires_employees: true,
    has_non_eu_workers: false,
    employees_not_employed_in_germany: true, // KEY: This triggers posting requirements
    created_at: '2024-03-10T09:15:00.000Z',
    updated_at: '2024-12-08T14:30:00.000Z',
    tenant_id: 'demo-tenant-123',
    activation_date: '2024-03-10T09:15:00.000Z',
    last_compliance_check: '2024-12-08T14:30:00.000Z',
    next_reminder_date: '2025-01-20T00:00:00.000Z',
    project_count: 1,
    critical_issues: 2
  }
];

// 2 Projects as required
const demoProjects = [
  {
    id: 'demo-proj-1',
    name: 'Bürogebäude Berlin Mitte',
    code: 'BBM-2024-001',
    address: 'Potsdamer Platz 1, 10785 Berlin',
    created_at: '2024-05-15T10:00:00.000Z',
    updated_at: '2024-12-08T14:30:00.000Z',
    tenant_id: 'demo-tenant-123',
    subcontractor_count: 2,
    critical_count: 2,
    expiring_count: 1
  },
  {
    id: 'demo-proj-2',
    name: 'Wohnkomplex Hamburg Hafencity',
    code: 'WHH-2024-002', 
    address: 'Am Sandtorkai 50, 20457 Hamburg',
    created_at: '2024-03-20T14:30:00.000Z',
    updated_at: '2024-12-08T14:30:00.000Z',
    tenant_id: 'demo-tenant-123',
    subcontractor_count: 1,
    critical_count: 1,
    expiring_count: 0
  }
];

// 1 Active engagement per requirement
const demoProjectSubs = [
  {
    id: 'demo-ps-1',
    project_id: 'demo-proj-1',
    subcontractor_id: 'demo-sub-2', // Schmidt Elektro - ACTIVE ENGAGEMENT
    status: 'active' as const,
    overall_status: 'approved' as const,
    start_at: '2024-06-01T00:00:00.000Z',
    end_at: '2025-03-31T23:59:59.000Z',
    created_at: '2024-05-20T10:00:00.000Z',
    approved_at: '2024-05-25T14:00:00.000Z'
  },
  {
    id: 'demo-ps-2', 
    project_id: 'demo-proj-1',
    subcontractor_id: 'demo-sub-3', // Kowalski - with posting requirements
    status: 'active' as const,
    overall_status: 'pending' as const,
    start_at: '2024-07-01T00:00:00.000Z',
    end_at: null,
    created_at: '2024-06-15T10:00:00.000Z',
    approved_at: null
  },
  {
    id: 'demo-ps-3',
    project_id: 'demo-proj-2',
    subcontractor_id: 'demo-sub-1', // Müller Bau - inactive/problematic
    status: 'inactive' as const,
    overall_status: 'pending' as const,
    start_at: null,
    end_at: null,
    created_at: '2024-04-10T10:00:00.000Z',
    approved_at: null
  }
];

// Requirements with different statuses
const demoRequirements = [
  // Schmidt Elektro - compliant documents
  {
    id: 'demo-req-1',
    project_sub_id: 'demo-ps-1',
    document_type_id: 'dt-gewerbeschein',
    status: 'valid' as const,
    due_date: '2025-06-30',
    created_at: '2024-05-20T10:00:00.000Z'
  },
  {
    id: 'demo-req-2',
    project_sub_id: 'demo-ps-1', 
    document_type_id: 'dt-arbeitgeberhaftpflicht',
    status: 'valid' as const,
    due_date: '2025-05-31',
    created_at: '2024-05-20T10:00:00.000Z'
  },
  // Kowalski - posting requirements with issues
  {
    id: 'demo-req-3',
    project_sub_id: 'demo-ps-2',
    document_type_id: 'dt-a1-nachweis',
    status: 'expiring' as const,
    due_date: '2025-01-20',
    created_at: '2024-06-15T10:00:00.000Z'
  },
  {
    id: 'demo-req-4',
    project_sub_id: 'demo-ps-2',
    document_type_id: 'dt-freistellungsbescheinigung',
    status: 'missing' as const,
    due_date: '2025-01-15',
    created_at: '2024-06-15T10:00:00.000Z'
  },
  // Müller Bau - missing critical documents
  {
    id: 'demo-req-5',
    project_sub_id: 'demo-ps-3',
    document_type_id: 'dt-gewerbeschein',
    status: 'expired' as const,
    due_date: '2024-12-01',
    created_at: '2024-04-10T10:00:00.000Z'
  }
];

// Critical items for dashboard
const demoCriticalItems = [
  {
    id: 'demo-critical-1',
    company_name: 'Müller Bau GmbH',
    project_name: 'Wohnkomplex Hamburg Hafencity',
    document_name: 'Gewerbeschein',
    status: 'expired' as const,
    due_date: '2024-12-01',
    action_type: 'remind' as const,
    priority: 1
  },
  {
    id: 'demo-critical-2',
    company_name: 'Kowalski Entsendung', 
    project_name: 'Bürogebäude Berlin Mitte',
    document_name: 'A1-Entsende-Nachweis',
    status: 'expiring' as const,
    due_date: '2025-01-20',
    action_type: 'remind' as const,
    priority: 2
  },
  {
    id: 'demo-critical-3',
    company_name: 'Kowalski Entsendung',
    project_name: 'Bürogebäude Berlin Mitte', 
    document_name: 'Freistellungsbescheinigung',
    status: 'missing' as const,
    due_date: '2025-01-15',
    action_type: 'remind' as const, // Changed from 'request' to 'remind'
    priority: 3
  }
];

// Statistics for dashboard
const demoStats = {
  totalSubcontractors: 3,
  activeSubcontractors: 2,
  totalProjects: 2,
  expiringSoon: 1,
  expired: 1,
  inReview: 0,
  missing: 1,
  criticalCount: 3,
  complianceRate: 67 // 2 of 3 subcontractors have some level of compliance
};

/**
 * Hook that provides comprehensive demo data
 */
export function useEnhancedDemoData() {
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');
  
  const [demoMode] = useState(isDemo);
  
  useEffect(() => {
    if (demoMode) {
      debug.log('🎯 Enhanced demo mode activated - using comprehensive seed data');
    }
  }, [demoMode]);
  
  return {
    isDemo: demoMode,
    demoTenant,
    demoStats,
    demoCriticalItems,
    demoSubcontractors,
    demoProjects,
    demoProjectSubs,
    demoRequirements
  };
}