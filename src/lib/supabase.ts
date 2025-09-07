import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          locale_default: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          locale_default?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          locale_default?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          email: string;
          role: 'admin' | 'owner' | 'staff';
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          email: string;
          role?: 'admin' | 'owner' | 'staff';
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          email?: string;
          role?: 'admin' | 'owner' | 'staff';
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          code: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          code: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          code?: string;
          address?: string | null;
          created_at?: string;
        };
      };
      subcontractors: {
        Row: {
          id: string;
          tenant_id: string;
          company_name: string;
          contact_name: string | null;
          contact_email: string;
          country_code: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          company_name: string;
          contact_name?: string | null;
          contact_email: string;
          country_code?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          company_name?: string;
          contact_name?: string | null;
          contact_email?: string;
          country_code?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      project_subs: {
        Row: {
          id: string;
          project_id: string;
          subcontractor_id: string;
          overall_status: 'pending' | 'approved' | 'rejected';
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          subcontractor_id: string;
          overall_status?: 'pending' | 'approved' | 'rejected';
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          subcontractor_id?: string;
          overall_status?: 'pending' | 'approved' | 'rejected';
          approved_at?: string | null;
          created_at?: string;
        };
      };
      document_types: {
        Row: {
          id: string;
          code: string;
          name_de: string;
          description_de: string | null;
          required_by_default: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          code: string;
          name_de: string;
          description_de?: string | null;
          required_by_default?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          code?: string;
          name_de?: string;
          description_de?: string | null;
          required_by_default?: boolean;
          sort_order?: number;
        };
      };
      requirements: {
        Row: {
          id: string;
          project_sub_id: string;
          document_type_id: string;
          status: 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired';
          due_date: string | null;
          last_reminded_at: string | null;
          escalated: boolean;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_sub_id: string;
          document_type_id: string;
          status?: 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired';
          due_date?: string | null;
          last_reminded_at?: string | null;
          escalated?: boolean;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_sub_id?: string;
          document_type_id?: string;
          status?: 'missing' | 'in_review' | 'valid' | 'expiring' | 'expired';
          due_date?: string | null;
          last_reminded_at?: string | null;
          escalated?: boolean;
          rejection_reason?: string | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          requirement_id: string;
          file_url: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          valid_from: string | null;
          valid_to: string | null;
          issuer: string | null;
          document_number: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          requirement_id: string;
          file_url: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
          issuer?: string | null;
          document_number?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          requirement_id?: string;
          file_url?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
          issuer?: string | null;
          document_number?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
      };
      invitations: {
        Row: {
          id: string;
          project_sub_id: string;
          magic_token: string;
          expires_at: string;
          last_sent_at: string | null;
          revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_sub_id: string;
          magic_token: string;
          expires_at: string;
          last_sent_at?: string | null;
          revoked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_sub_id?: string;
          magic_token?: string;
          expires_at?: string;
          last_sent_at?: string | null;
          revoked?: boolean;
          created_at?: string;
        };
      };
    };
  };
};