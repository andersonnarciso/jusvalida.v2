import { useState, useEffect, createContext, useContext } from 'react';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store' // Prevent 304 responses
      });
      
      // Handle 304 Not Modified - user state unchanged
      if (response.status === 304) {
        return; // Keep existing user state
      }
      
      // Handle non-OK responses
      if (!response.ok) {
        setUser(null);
        return;
      }
      
      // Only parse JSON for successful responses
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      // Network error or JSON parsing error
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      setUser(data.user); // Set user immediately from login response
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error; // Re-throw so UI can handle the error
    }
  };

  const register = async (userData: any) => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    const data = await response.json();
    setUser(data.user);
  };

  const logout = async () => {
    await apiRequest('POST', '/api/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
