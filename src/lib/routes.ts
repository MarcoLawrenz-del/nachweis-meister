export const routes = {
  subDetail: (projectId: string, subId: string) => `/projects/${projectId}/subs/${subId}`,
  subPackage: (projectId: string, subId: string) => `/projects/${projectId}/subs/${subId}/package`,
  subDocuments: (projectId: string, subId: string) => `/projects/${projectId}/subs/${subId}?tab=documents`,
} as const;