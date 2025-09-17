export const APP_BASE = "/app" as const;

export const ROUTES = {
  // Hauptnavigation
  dashboard: `${APP_BASE}/dashboard`,
  contractors: `${APP_BASE}/subcontractors`,
  contractor: (id: string) => `${APP_BASE}/subcontractors/${id}`,
  contractorWithTab: (id: string, tab: string) => `${APP_BASE}/subcontractors/${id}?tab=${tab}`,
  subPackage: (projectId: string, subId: string) => `${APP_BASE}/projects/${projectId}/subs/${subId}/package`,
  subDetail: (projectId: string, subId: string) => `${APP_BASE}/projects/${projectId}/subs/${subId}`,
  subDocuments: (projectId: string, subId: string) => `${APP_BASE}/projects/${projectId}/subs/${subId}?tab=documents`,
  projects: `${APP_BASE}/projects`,
  project: (id: string) => `${APP_BASE}/projects/${id}`,
  reviewQueue: `${APP_BASE}/review`,
  reminders: `${APP_BASE}/reminders`,
  settings: `${APP_BASE}/einstellungen`,
  rolesAccess: `${APP_BASE}/rollen-zugriff`,
  // Alias, falls irgendwo noch verwendet:
  home: `${APP_BASE}`,
} as const;