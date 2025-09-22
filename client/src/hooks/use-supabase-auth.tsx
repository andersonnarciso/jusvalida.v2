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
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.session) {
      setSession(data.session);
      setUser(data.user);
    }

    setLoading(false);
    return { error };
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

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
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