export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          properties: Json | null
          tenant_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          properties?: Json | null
          tenant_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          properties?: Json | null
          tenant_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          code: string
          description_de: string | null
          id: string
          name_de: string
          required_by_default: boolean
          sort_order: number
        }
        Insert: {
          code: string
          description_de?: string | null
          id?: string
          name_de: string
          required_by_default?: boolean
          sort_order?: number
        }
        Update: {
          code?: string
          description_de?: string | null
          id?: string
          name_de?: string
          required_by_default?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_number: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          issuer: string | null
          mime_type: string | null
          requirement_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          uploaded_at: string
          uploaded_by: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          document_number?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          issuer?: string | null
          mime_type?: string | null
          requirement_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          document_number?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          issuer?: string | null
          mime_type?: string | null
          requirement_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          id: string
          preview_snippet: string | null
          project_sub_id: string | null
          requirement_id: string | null
          sent_at: string | null
          status: string
          subcontractor_id: string
          subject: string
          template_key: string
          tenant_id: string
          to_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          preview_snippet?: string | null
          project_sub_id?: string | null
          requirement_id?: string | null
          sent_at?: string | null
          status?: string
          subcontractor_id: string
          subject: string
          template_key: string
          tenant_id: string
          to_email: string
        }
        Update: {
          created_at?: string
          id?: string
          preview_snippet?: string | null
          project_sub_id?: string | null
          requirement_id?: string | null
          sent_at?: string | null
          status?: string
          subcontractor_id?: string
          subject?: string
          template_key?: string
          tenant_id?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_project_sub_id_fkey"
            columns: ["project_sub_id"]
            isOneToOne: false
            referencedRelation: "project_subs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_type: string
          invited_by: string
          message: string
          project_sub_id: string | null
          role: string | null
          status: string
          subcontractor_id: string | null
          subject: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_type?: string
          invited_by: string
          message: string
          project_sub_id?: string | null
          role?: string | null
          status?: string
          subcontractor_id?: string | null
          subject: string
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_type?: string
          invited_by?: string
          message?: string
          project_sub_id?: string | null
          role?: string | null
          status?: string
          subcontractor_id?: string | null
          subject?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      Marco1: {
        Row: {
          company: string | null
          created_at: string | null
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_on_approval: boolean | null
          email_on_assignment: boolean | null
          email_on_escalation: boolean | null
          email_on_rejection: boolean | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_on_approval?: boolean | null
          email_on_assignment?: boolean | null
          email_on_escalation?: boolean | null
          email_on_rejection?: boolean | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_on_approval?: boolean | null
          email_on_assignment?: boolean | null
          email_on_escalation?: boolean | null
          email_on_rejection?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_subs: {
        Row: {
          approved_at: string | null
          created_at: string
          end_at: string | null
          id: string
          overall_status: string
          project_id: string
          start_at: string | null
          status: string
          subcontractor_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          overall_status?: string
          project_id: string
          start_at?: string | null
          status?: string
          subcontractor_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          overall_status?: string
          project_id?: string
          start_at?: string | null
          status?: string
          subcontractor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_subs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subs_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_jobs: {
        Row: {
          attempts: number
          created_at: string
          escalated: boolean
          id: string
          max_attempts: number
          next_run_at: string
          requirement_id: string
          state: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          escalated?: boolean
          id?: string
          max_attempts?: number
          next_run_at: string
          requirement_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          escalated?: boolean
          id?: string
          max_attempts?: number
          next_run_at?: string
          requirement_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_jobs_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_rules: {
        Row: {
          active: boolean
          company_type: string
          created_at: string
          document_type_id: string
          employees_not_employed_in_germany: boolean | null
          frequency: string
          has_non_eu_workers: boolean | null
          id: string
          requires_employees: boolean | null
          validity_months: number | null
        }
        Insert: {
          active?: boolean
          company_type: string
          created_at?: string
          document_type_id: string
          employees_not_employed_in_germany?: boolean | null
          frequency?: string
          has_non_eu_workers?: boolean | null
          id?: string
          requires_employees?: boolean | null
          validity_months?: number | null
        }
        Update: {
          active?: boolean
          company_type?: string
          created_at?: string
          document_type_id?: string
          employees_not_employed_in_germany?: boolean | null
          frequency?: string
          has_non_eu_workers?: boolean | null
          id?: string
          requires_employees?: boolean | null
          validity_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_rules_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          assigned_reviewer_id: string | null
          created_at: string
          document_type_id: string
          due_date: string | null
          escalated: boolean
          escalated_at: string | null
          escalation_reason: string | null
          id: string
          last_reminded_at: string | null
          project_sub_id: string
          rejection_reason: string | null
          review_priority: string | null
          status: string
          updated_at: string
          valid_to: string | null
        }
        Insert: {
          assigned_reviewer_id?: string | null
          created_at?: string
          document_type_id: string
          due_date?: string | null
          escalated?: boolean
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_reminded_at?: string | null
          project_sub_id: string
          rejection_reason?: string | null
          review_priority?: string | null
          status?: string
          updated_at?: string
          valid_to?: string | null
        }
        Update: {
          assigned_reviewer_id?: string | null
          created_at?: string
          document_type_id?: string
          due_date?: string | null
          escalated?: boolean
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_reminded_at?: string | null
          project_sub_id?: string
          rejection_reason?: string | null
          review_priority?: string | null
          status?: string
          updated_at?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirements_assigned_reviewer_id_fkey"
            columns: ["assigned_reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_project_sub_id_fkey"
            columns: ["project_sub_id"]
            isOneToOne: false
            referencedRelation: "project_subs"
            referencedColumns: ["id"]
          },
        ]
      }
      review_history: {
        Row: {
          action: string
          comment: string | null
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          requirement_id: string
          reviewer_id: string
        }
        Insert: {
          action: string
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          requirement_id: string
          reviewer_id: string
        }
        Update: {
          action?: string
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          requirement_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_history_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_history_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          activation_date: string | null
          address: string | null
          company_name: string
          company_type: string | null
          compliance_status: string | null
          contact_email: string
          contact_name: string | null
          country_code: string
          created_at: string
          employees_not_employed_in_germany: boolean | null
          has_non_eu_workers: boolean | null
          id: string
          last_compliance_check: string | null
          next_reminder_date: string | null
          notes: string | null
          phone: string | null
          requires_employees: boolean | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activation_date?: string | null
          address?: string | null
          company_name: string
          company_type?: string | null
          compliance_status?: string | null
          contact_email: string
          contact_name?: string | null
          country_code?: string
          created_at?: string
          employees_not_employed_in_germany?: boolean | null
          has_non_eu_workers?: boolean | null
          id?: string
          last_compliance_check?: string | null
          next_reminder_date?: string | null
          notes?: string | null
          phone?: string | null
          requires_employees?: boolean | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          activation_date?: string | null
          address?: string | null
          company_name?: string
          company_type?: string | null
          compliance_status?: string | null
          contact_email?: string
          contact_name?: string | null
          country_code?: string
          created_at?: string
          employees_not_employed_in_germany?: boolean | null
          has_non_eu_workers?: boolean | null
          id?: string
          last_compliance_check?: string | null
          next_reminder_date?: string | null
          notes?: string | null
          phone?: string | null
          requires_employees?: boolean | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          created_at: string | null
          data: Json | null
          event_type: string
          id: string
          processed_at: string | null
          stripe_event_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_type: string
          id?: string
          processed_at?: string | null
          stripe_event_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_type?: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domain_allowlists: {
        Row: {
          created_at: string
          created_by: string | null
          domain: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domain_allowlists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active_subs_quota: number | null
          created_at: string
          id: string
          locale_default: string
          logo_url: string | null
          name: string
          plan: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
        }
        Insert: {
          active_subs_quota?: number | null
          created_at?: string
          id?: string
          locale_default?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          active_subs_quota?: number | null
          created_at?: string
          id?: string
          locale_default?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_assign_reviewer: {
        Args: { tenant_id_param: string }
        Returns: string
      }
      calculate_next_reminder_date: {
        Args: { subcontractor_id_param: string }
        Returns: string
      }
      calculate_subcontractor_compliance: {
        Args: { subcontractor_id_param: string }
        Returns: string
      }
      calculate_subcontractor_compliance_bausicht: {
        Args: { subcontractor_id_param: string }
        Returns: string
      }
      calculate_subcontractor_compliance_by_type: {
        Args: { subcontractor_id_param: string }
        Returns: string
      }
      compute_required_requirements: {
        Args: { project_sub_id_param?: string; subcontractor_id_param: string }
        Returns: Json
      }
      get_active_required_warnings: {
        Args: { tenant_id_param?: string }
        Returns: {
          company_name: string
          document_name: string
          document_type_id: string
          due_date: string
          is_required: boolean
          project_sub_id: string
          requirement_id: string
          status: string
          subcontractor_active: boolean
          subcontractor_id: string
        }[]
      }
      get_tenant_kpis: {
        Args: { tenant_id: string }
        Returns: {
          active_subcontractors: number
          compliance_rate: number
          expired_requirements: number
          expiring_requirements: number
          in_review_requirements: number
          inactive_subcontractors: number
          last_updated: string
          missing_requirements: number
          rejected_requirements: number
          submitted_requirements: number
          total_requirements: number
          total_subcontractors: number
          valid_requirements: number
        }[]
      }
      is_domain_allowed_for_magic_link: {
        Args: { email_param: string; tenant_id_param?: string }
        Returns: boolean
      }
      send_compliance_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_requirement_status_by_date: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_subcontractor_for_project: {
        Args: { subcontractor_id_param: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
