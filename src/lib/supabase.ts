import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(
  supabaseUrl,
  typeof window === 'undefined' ? supabaseServiceRoleKey : supabaseAnonKey
);

// Database types
export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  content?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  user_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  content?: string;
  metadata?: any;
} 