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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
        }
        setSession(session);
        setSupabaseUser(session?.user || null);
        setSupabaseLoading(false);
        
        console.log('UserProvider - initial session:', session);
        console.log('UserProvider - user:', session?.user || null);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setSupabaseLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('UserProvider - auth state change:', event, session);
        setSession(session);
        setSupabaseUser(session?.user || null);
        setSupabaseLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch backend user data when authenticated
  const { data: backendUserData, isLoading: backendLoading, error: backendError } = useQuery({
    queryKey: ['/api/auth/me', supabaseUser?.id],
    queryFn: async () => {
      if (!supabaseUser) return null;
      
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        
        if (!response.ok) {
          console.error('API Error:', response.status, response.statusText);
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('UserProvider - backend user data:', data);
        console.log('UserProvider - user role from API:', data.user?.role);
        console.log('UserProvider - isAdmin check:', data.user?.role === 'admin');
        
        return data.user as BackendUser;
      } catch (error) {
        console.error('Error fetching backend user data:', error);
        // Don't throw error in production to prevent UI crashes
        if (import.meta.env.PROD) {
          console.warn('Backend user data unavailable, using Supabase fallback');
          return null;
        }
        throw error;
      }
    },
    enabled: !!supabaseUser && !supabaseLoading,
    retry: (failureCount, error) => {
      console.log('Retry attempt:', failureCount, error);
      // More aggressive retry in production
      return import.meta.env.PROD ? failureCount < 3 : failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Add stale time to prevent excessive requests
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log backend errors
  useEffect(() => {
    if (backendError) {
      console.error('Backend user data error:', backendError);
    }
  }, [backendError]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata: { firstName: string; lastName: string; username: string }
  ) => {
    try {
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
      
      if (error) {
        console.error('Sign up error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: { 
    firstName?: string; 
    lastName?: string; 
    username?: string; 
  }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          username: updates.username,
        },
      });
      
      if (error) {
        console.error('Update profile error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('Update profile exception:', error);
      return { error };
    }
  };

  const loading = supabaseLoading || backendLoading;
  // Considera autenticado se o usuário do Supabase estiver presente
  // mesmo que os dados backend ainda estejam carregando
  const isAuthenticated = !!supabaseUser;
  
  // Check admin role from backend data, or fallback to email-based check
  // Add more robust admin detection with better logging
  const isAdmin = backendUserData?.role === 'admin' || 
    (supabaseUser?.email && (
      supabaseUser.email.includes('admin') || 
      supabaseUser.email.includes('jusvalida') ||
      supabaseUser.email === 'admin@jusvalida.com' ||
      supabaseUser.email === 'anderson@jusvalida.com' ||
      supabaseUser.email === 'andersonnarciso@gmail.com'
    ));
  
  const isSupport = backendUserData?.role === 'support' || 
    (supabaseUser?.email && supabaseUser.email.includes('support'));

  // Debug logging for production
  if (import.meta.env.PROD) {
    console.log('🔍 Admin Check Debug:', {
      backendUserData: backendUserData ? {
        id: backendUserData.id,
        email: backendUserData.email,
        role: backendUserData.role
      } : null,
      supabaseUser: supabaseUser ? {
        id: supabaseUser.id,
        email: supabaseUser.email,
        app_metadata: supabaseUser.app_metadata
      } : null,
      isAdmin,
      isSupport,
      backendLoading,
      backendError
    });
  }

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