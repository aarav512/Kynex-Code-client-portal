// Hand-written mirror of supabase/schema.sql. Once your Supabase project is
// running, regenerate the authoritative version with:
//   npm run db:types
// (requires the Supabase CLI + SUPABASE_PROJECT_ID env var). This file exists
// so the app type-checks before you've done that.

export type UserRole = 'admin' | 'client';
export type ProjectStatus = 'not_started' | 'in_progress' | 'client_review' | 'completed' | 'live';
export type FileCategory = 'website_files' | 'images_assets' | 'documents' | 'content' | 'other';
export type RequestCategory = 'website_change' | 'bug_error' | 'content_update' | 'technical_support' | 'other';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RequestStatus = 'submitted' | 'in_progress' | 'waiting_for_client' | 'completed';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type AmcStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['clients']['Row']> & {
          company_name: string;
          contact_name: string;
          contact_email: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          client_id: string | null;
          full_name: string;
          email: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          project_type: string;
          description: string | null;
          status: ProjectStatus;
          start_date: string | null;
          expected_completion_date: string | null;
          live_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['projects']['Row']> & {
          client_id: string;
          name: string;
          project_type: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
      };
      files: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          category: FileCategory;
          file_name: string;
          storage_path: string;
          file_type: string;
          file_size_bytes: number;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['files']['Row']> & {
          client_id: string;
          file_name: string;
          storage_path: string;
          file_type: string;
          uploaded_by: string;
        };
        Update: Partial<Database['public']['Tables']['files']['Row']>;
      };
      requests: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          title: string;
          description: string;
          category: RequestCategory;
          priority: RequestPriority;
          status: RequestStatus;
          attachment_path: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['requests']['Row']> & {
          client_id: string;
          title: string;
          description: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['requests']['Row']>;
      };
      request_messages: {
        Row: {
          id: string;
          request_id: string;
          client_id: string;
          author_id: string;
          author_name: string;
          author_role: UserRole;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['request_messages']['Row']> & {
          request_id: string;
          client_id: string;
          author_id: string;
          author_name: string;
          author_role: UserRole;
          body: string;
        };
        Update: Partial<Database['public']['Tables']['request_messages']['Row']>;
      };
      invoices: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          invoice_number: string;
          description: string;
          amount: number;
          currency: string;
          status: PaymentStatus;
          due_date: string;
          payment_date: string | null;
          invoice_file_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['invoices']['Row']> & {
          client_id: string;
          invoice_number: string;
          description: string;
          amount: number;
          due_date: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Row']>;
      };
      amc: {
        Row: {
          id: string;
          client_id: string;
          plan_name: string;
          services_included: string[];
          amount: number;
          currency: string;
          start_date: string;
          renewal_date: string;
          status: AmcStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['amc']['Row']> & {
          client_id: string;
          plan_name: string;
          amount: number;
          start_date: string;
          renewal_date: string;
        };
        Update: Partial<Database['public']['Tables']['amc']['Row']>;
      };
    };
  };
}
