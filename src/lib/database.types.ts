export type UserRole = 'admin' | 'client';
export type ClientStatus = 'active' | 'inactive' | 'suspended';
export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type RequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type AmcStatus = 'active' | 'expired' | 'cancelled';

export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  client_id: string | null;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  client_id: string;
  project_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Request {
  id: string;
  client_id: string;
  project_id: string | null;
  subject: string;
  status: RequestStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestMessage {
  id: string;
  request_id: string;
  author_id: string | null;
  body: string;
  is_staff: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  project_id: string | null;
  description: string;
  amount: number;
  status: PaymentStatus;
  due_date: string | null;
  paid_date: string | null;
  invoice_number: string | null;
  created_at: string;
}

export interface AmcContract {
  id: string;
  client_id: string;
  plan_name: string;
  amount: number;
  status: AmcStatus;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
