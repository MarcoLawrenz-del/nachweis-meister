import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://qvamzeepjzqndakhjpjg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YW16ZWVwanpxbmRha2hqcGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjYxODMsImV4cCI6MjA3Mjg0MjE4M30.j4IsZ4wvBePgh1moBRBCFFum0t8uGDTVRsNlNjYK3D8'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'subfix-auth-token',
  },
})

export type { Database }