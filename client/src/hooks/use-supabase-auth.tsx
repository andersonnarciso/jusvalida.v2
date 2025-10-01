import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata: { firstName: string; lastName: string; username: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { firstName?: string; lastName?: string; username?: string }) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      
      // Adicionar log para debug
      console.log('SupabaseAuthProvider - initial session:', session);
      console.log('SupabaseAuthProvider - user:', session?.user || null);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
        
        // Adicionar log para debug
        console.log('SupabaseAuthProvider - auth state change:', event, session);
        console.log('SupabaseAuthProvider - user:', session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔍 SupabaseAuth - signIn called:', { email });
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔍 SupabaseAuth - signIn response:', { 
        hasData: !!data, 
        hasSession: !!data?.session, 
        hasUser: !!data?.user,
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
        console.log('✅ SupabaseAuth - User signed in successfully');
      } else if (error && error.message === 'Email not confirmed') {
        // For unconfirmed emails, try to force sync and then bypass confirmation
        console.log('🔄 Email not confirmed, attempting force sync for:', email);
        try {
          const response = await fetch('/api/auth/force-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          
          const syncResult = await response.json();
          console.log('🔄 Force sync result:', syncResult);
          
          if (syncResult.success) {
            console.log('✅ User synced, attempting admin confirmation...');
            // Try to confirm the user via admin API
            const confirmResponse = await fetch('/api/auth/admin-confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            });
            
            if (confirmResponse.ok) {
              console.log('✅ User confirmed, retrying login...');
              // Retry login after confirmation
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (retryData?.session) {
                setSession(retryData.session);
                setUser(retryData.user);
                console.log('✅ SupabaseAuth - User signed in after confirmation');
                setLoading(false);
                return { error: null };
              }
            }
          }
        } catch (syncError) {
          console.error('❌ Force sync/confirmation failed:', syncError);
        }
      }

      setLoading(false);
      return { error };
    } catch (error) {
      console.error('❌ SupabaseAuth - signIn exception:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata: { firstName: string; lastName: string; username: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.firstName,
          last_name: metadata.lastName,
          username: metadata.username,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: { 
    firstName?: string; 
    lastName?: string; 
    username?: string; 
  }) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: updates.firstName,
        last_name: updates.lastName,
        username: updates.username,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}