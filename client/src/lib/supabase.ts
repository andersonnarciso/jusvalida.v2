import { createClient } from '@supabase/supabase-js';

// Get environment variables with better fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  (typeof window !== 'undefined' && (window as any).__SUPABASE_URL__) ||
  'https://lwqeysdqcepqfzmwvwsq.supabase.co'; // Fallback for development

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY__) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cWV5c2RxY2VwcWZ6bXd2d3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ3OTksImV4cCI6MjA3MzYwMDc5OX0.5B6Jnpqh7zEIHHABF13ylltIZgttJ-ZKHC6AgzSMKlc'; // Fallback for development

// Debug logging for production
if (typeof window !== 'undefined') {
  console.log('Supabase Config:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    env: {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '***' : 'undefined'
    }
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback values for development.');
  console.error('URL:', supabaseUrl);
  console.error('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'jusvalida-web'
    }
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