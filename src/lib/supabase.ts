import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  document_number?: string;
  file_url: string;
  file_path: string;
  created_at: string;
  expiry_date?: string;
  profiles?: Profile;
};

export type ScanHistory = {
  id: string;
  document_id: string;
  scanned_at: string;
  ip_address?: string;
};
