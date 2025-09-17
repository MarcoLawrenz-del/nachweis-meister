// No-op Supabase client for local auth mode
// This prevents build errors while using local authentication

const noOpQueryResult = {
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK'
};

const noOpArrayResult = {
  data: [],
  error: null,
  count: 0,
  status: 200,
  statusText: 'OK'
};

const createNoOpQuery = (): any => ({
  ...noOpArrayResult,
  select: (...args: any[]) => createNoOpQuery(),
  insert: (...args: any[]) => createNoOpQuery(),
  update: (...args: any[]) => createNoOpQuery(),
  delete: (...args: any[]) => createNoOpQuery(),
  upsert: (...args: any[]) => createNoOpQuery(),
  eq: (...args: any[]) => createNoOpQuery(),
  neq: (...args: any[]) => createNoOpQuery(),
  gt: (...args: any[]) => createNoOpQuery(),
  gte: (...args: any[]) => createNoOpQuery(),
  lt: (...args: any[]) => createNoOpQuery(),
  lte: (...args: any[]) => createNoOpQuery(),
  like: (...args: any[]) => createNoOpQuery(),
  ilike: (...args: any[]) => createNoOpQuery(),
  is: (...args: any[]) => createNoOpQuery(),
  in: (...args: any[]) => createNoOpQuery(),
  contains: (...args: any[]) => createNoOpQuery(),
  containedBy: (...args: any[]) => createNoOpQuery(),
  rangeGt: (...args: any[]) => createNoOpQuery(),
  rangeGte: (...args: any[]) => createNoOpQuery(),
  rangeLt: (...args: any[]) => createNoOpQuery(),
  rangeLte: (...args: any[]) => createNoOpQuery(),
  rangeAdjacent: (...args: any[]) => createNoOpQuery(),
  overlaps: (...args: any[]) => createNoOpQuery(),
  textSearch: (...args: any[]) => createNoOpQuery(),
  match: (...args: any[]) => createNoOpQuery(),
  not: (...args: any[]) => createNoOpQuery(),
  or: (...args: any[]) => createNoOpQuery(),
  filter: (...args: any[]) => createNoOpQuery(),
  order: (...args: any[]) => createNoOpQuery(),
  limit: (...args: any[]) => createNoOpQuery(),
  range: (...args: any[]) => createNoOpQuery(),
  single: async (...args: any[]) => Promise.resolve(noOpQueryResult),
  maybeSingle: async (...args: any[]) => Promise.resolve(noOpQueryResult),
  csv: async (...args: any[]) => Promise.resolve({ data: '', error: null }),
  then: async (...args: any[]) => Promise.resolve(noOpArrayResult)
});

export const supabase = {
  from: (...args: any[]) => createNoOpQuery(),
  rpc: async (...args: any[]) => noOpQueryResult,
  storage: {
    from: (...args: any[]) => ({
      upload: async (...args: any[]) => noOpQueryResult,
      download: async (...args: any[]) => ({ data: null, error: null }),
      remove: async (...args: any[]) => noOpArrayResult,
      list: async (...args: any[]) => noOpArrayResult,
      getPublicUrl: (...args: any[]) => ({ data: { publicUrl: '' } })
    })
  },
  auth: {
    getUser: async (...args: any[]) => ({ data: { user: null }, error: null }),
    getSession: async (...args: any[]) => ({ data: { session: null }, error: null }),
    signUp: async (...args: any[]) => noOpQueryResult,
    signInWithPassword: async (...args: any[]) => noOpQueryResult,
    signInWithOAuth: async (...args: any[]) => noOpQueryResult,
    signInWithOtp: async (...args: any[]) => noOpQueryResult,
    signOut: async (...args: any[]) => ({ error: null }),
    onAuthStateChange: (...args: any[]) => ({
      data: { subscription: { unsubscribe: () => {} } }
    })
  },
  functions: {
    invoke: async (...args: any[]) => noOpQueryResult
  },
  channel: (...args: any[]) => ({
    on: (...args: any[]) => ({
      subscribe: (...args: any[]) => ({})
    })
  }),
  removeChannel: (...args: any[]) => {}
};

// For TypeScript compatibility
export type Database = any;