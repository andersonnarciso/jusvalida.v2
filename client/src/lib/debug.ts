// Debug utilities for production
export function debugEnvironment() {
  if (typeof window === 'undefined') return;
  
  console.log('🔍 Environment Debug Information:');
  console.log('=====================================');
  
  // Vite environment variables
  console.log('Vite Environment Variables:');
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'NOT SET');
  console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('- MODE:', import.meta.env.MODE);
  console.log('- DEV:', import.meta.env.DEV);
  console.log('- PROD:', import.meta.env.PROD);
  
  // All environment variables
  console.log('All import.meta.env:', import.meta.env);
  
  // Window variables
  console.log('Window Variables:');
  console.log('- __SUPABASE_URL__:', (window as any).__SUPABASE_URL__ || 'NOT SET');
  console.log('- __SUPABASE_ANON_KEY__:', (window as any).__SUPABASE_ANON_KEY__ ? 'SET' : 'NOT SET');
  
  // Local storage
  console.log('Local Storage:');
  try {
    const authToken = localStorage.getItem('jusvalida-auth-token');
    const supabaseAuth = localStorage.getItem('sb-lwqeysdqcepqfzmwvwsq-auth-token');
    console.log('- jusvalida-auth-token:', authToken ? 'SET' : 'NOT SET');
    console.log('- supabase-auth-token:', supabaseAuth ? 'SET' : 'NOT SET');
  } catch (error) {
    console.log('- Local storage error:', error);
  }
  
  // Session storage
  console.log('Session Storage:');
  try {
    const sessionAuth = sessionStorage.getItem('sb-lwqeysdqcepqfzmwvwsq-auth-token');
    console.log('- session-auth-token:', sessionAuth ? 'SET' : 'NOT SET');
  } catch (error) {
    console.log('- Session storage error:', error);
  }
  
  // Network information
  console.log('Network Information:');
  console.log('- Online:', navigator.onLine);
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Location:', window.location.href);
  
  console.log('=====================================');
}

// Função para testar a conectividade do Supabase
export async function testSupabaseConnection() {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('🧪 Testing Supabase Connection...');
    
    // Importar dinamicamente para evitar problemas de SSR
    const { createClient } = await import('@supabase/supabase-js');
    
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://lwqeysdqcepqfzmwvwsq.supabase.co';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cWV5c2RxY2VwcWZ6bXd2d3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ3OTksImV4cCI6MjA3MzYwMDc5OX0.5B6Jnpqh7zEIHHABF13ylltIZgttJ-ZKHC6AgzSMKlc';
    
    const supabase = createClient(url, key);
    
    // Testar conexão
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    } else {
      console.log('✅ Supabase connection test successful');
      console.log('Session status:', data.session ? 'Active' : 'None');
      return true;
    }
  } catch (error) {
    console.error('❌ Supabase connection test exception:', error);
    return false;
  }
}

// Função para forçar recarregamento das variáveis de ambiente
export function reloadEnvironment() {
  if (typeof window === 'undefined') return;
  
  console.log('🔄 Reloading environment variables...');
  
  // Tentar recarregar as variáveis do window
  const url = (window as any).__SUPABASE_URL__ || 'https://lwqeysdqcepqfzmwvwsq.supabase.co';
  const key = (window as any).__SUPABASE_ANON_KEY__ || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cWV5c2RxY2VwcWZ6bXd2d3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ3OTksImV4cCI6MjA3MzYwMDc5OX0.5B6Jnpqh7zEIHHABF13ylltIZgttJ-ZKHC6AgzSMKlc';
  
  console.log('Using fallback values:', { url, hasKey: !!key });
  
  return { url, key };
}
