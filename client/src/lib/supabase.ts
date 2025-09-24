import { createClient } from '@supabase/supabase-js';

// Configuração simples do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lwqeysdqcepqfzmwvwsq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cWV5c2RxY2VwcWZ6bXd2d3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ3OTksImV4cCI6MjA3MzYwMDc5OX0.5B6Jnpqh7zEIHHABF13ylltIZgttJ-ZKHC6AgzSMKlc';

// Debug logging
console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length || 0
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
} else {
  console.log('✅ Supabase configuration loaded successfully');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'jusvalida-auth-token'
  },
  global: {
    headers: {
      'X-Client-Info': 'jusvalida-web',
      'X-Environment': import.meta.env.MODE || 'production'
    }
  }
});

// Teste de conectividade
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
    } else {
      console.log('✅ Supabase connection test successful');
      console.log('Current session:', data.session ? 'Active' : 'None');
    }
  });
}

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