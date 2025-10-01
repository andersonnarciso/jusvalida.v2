import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`API Error ${res.status}:`, text);
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get authorization headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session for auth headers:', error);
      return {};
    }
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
    
    console.log('No access token available for API request');
    return {};
  } catch (error) {
    console.error('Error in getAuthHeaders:', error);
    return {};
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle FormData differently - don't JSON stringify or set Content-Type
  const isFormData = data instanceof FormData;
  
  // Get authorization headers from Supabase
  const authHeaders = await getAuthHeaders();
  
  // Build full URL
  const fullUrl = url.startsWith('http') ? url : `${config.api.baseUrl}${url}`;
  
  const headers = {
    ...authHeaders,
    ...(isFormData ? {} : (data ? { "Content-Type": "application/json" } : {})),
  };
  
  console.log(`API Request: ${method} ${fullUrl}`, {
    hasAuth: !!authHeaders.Authorization,
    isFormData,
    dataSize: data ? (isFormData ? 'FormData' : JSON.stringify(data).length) : 0
  });
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: isFormData ? data as FormData : (data ? JSON.stringify(data) : undefined),
    cache: url.includes('/api/auth/') ? 'no-store' : 'default', // Prevent auth caching
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Get authorization headers from Supabase
      const authHeaders = await getAuthHeaders();
      
      const url = queryKey.join("/") as string;
      const fullUrl = url.startsWith('http') ? url : `${config.api.baseUrl}${url}`;
      
      console.log(`Query Request: ${fullUrl}`, {
        hasAuth: !!authHeaders.Authorization
      });
      
      const res = await fetch(fullUrl, {
        headers: authHeaders,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('Unauthorized request, returning null');
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query function error:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        console.log('Query retry:', failureCount, error);
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        console.log('Mutation retry:', failureCount, error);
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});