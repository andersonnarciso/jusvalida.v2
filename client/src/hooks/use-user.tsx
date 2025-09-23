import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';

interface BackendUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: 'user' | 'admin' | 'support';
  credits: number;
  stripeCustomerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserContextType {
  // Supabase user data
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  
  // Backend user data
  user: BackendUser | null;
  
  // Combined state
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  
  // Auth functions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata: { firstName: string; lastName: string; username: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { firstName?: string; lastName?: string; username?: string }) => Promise<{ error: any }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(true);

  // Track Supabase auth state
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSupabaseUser(session?.user || null);
      setSupabaseLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user || null);
        setSupabaseLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch backend user data when authenticated
  const { data: backendUserData, isLoading: backendLoading } = useQuery({
    queryKey: ['/api/auth/me', supabaseUser?.id],
    queryFn: async () => {
      if (!supabaseUser) return null;
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();
      
      // Adicionar log para debug
      console.log('UserProvider - backend user data:', data);
      
      return data.user as BackendUser;
    },
    enabled: !!supabaseUser && !supabaseLoading,
    retry: false
  });

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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

  const loading = supabaseLoading || backendLoading;
  // Considera autenticado se o usuário do Supabase estiver presente
  // mesmo que os dados backend ainda estejam carregando
  const isAuthenticated = !!supabaseUser;
  const isAdmin = backendUserData?.role === 'admin';
  const isSupport = backendUserData?.role === 'support';

  const value: UserContextType = {
    supabaseUser,
    session,
    user: backendUserData || null,
    loading,
    isAuthenticated,
    isAdmin,
    isSupport,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Backward compatibility export
export const useSupabaseAuth = useUser;