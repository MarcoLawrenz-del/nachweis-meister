export const APP_BASE = "/app" as const;

export const ROUTES = {
  dashboard: `${APP_BASE}/dashboard`,
  contractors: `${APP_BASE}/subcontractors`,
  contractor: (id: string) => `${APP_BASE}/subcontractors/${id}`,
  subPackage: (projectId: string, subId: string) => `${APP_BASE}/projects/${projectId}/subs/${subId}/package`,
  settings: `${APP_BASE}/einstellungen`,
  home: `${APP_BASE}`,
  adminMagicLinkTests: `${APP_BASE}/admin/tests/magic-link`,
} as const;