import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          credits: number;
          stripe_customer_id: string | null;
          role: 'user' | 'admin' | 'support';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          credits?: number;
          stripe_customer_id?: string | null;
          role?: 'user' | 'admin' | 'support';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          credits?: number;
          stripe_customer_id?: string | null;
          role?: 'user' | 'admin' | 'support';
          created_at?: string;
          updated_at?: string;
        };
      };
      document_analyses: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          analysis_type: string;
          ai_provider: string;
          ai_model: string;
          credits_used: number;
          result: any;
          deleted_at: string | null;
          deleted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          analysis_type: string;
          ai_provider: string;
          ai_model: string;
          credits_used: number;
          result: any;
          deleted_at?: string | null;
          deleted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          analysis_type?: string;
          ai_provider?: string;
          ai_model?: string;
          credits_used?: number;
          result?: any;
          deleted_at?: string | null;
          deleted_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}