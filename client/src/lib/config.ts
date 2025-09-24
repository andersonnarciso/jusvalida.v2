// Configuração de ambiente para produção
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 
         import.meta.env.SUPABASE_URL || 
         (window as any).__SUPABASE_URL__ || 
         'https://lwqeysdqcepqfzmwvwsq.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 
             import.meta.env.SUPABASE_ANON_KEY || 
             (window as any).__SUPABASE_ANON_KEY__ || 
             'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cWV5c2RxY2VwcWZ6bXd2d3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ3OTksImV4cCI6MjA3MzYwMDc5OX0.5B6Jnpqh7zEIHHABF13ylltIZgttJ-ZKHC6AgzSMKlc'
  }
};

// Debug logging para produção
if (import.meta.env.PROD) {
  console.log('🔧 Config Debug:');
  console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('  SUPABASE_URL:', import.meta.env.SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('  SUPABASE_ANON_KEY:', import.meta.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('  window.__SUPABASE_URL__:', (window as any).__SUPABASE_URL__ ? 'SET' : 'NOT SET');
  console.log('  window.__SUPABASE_ANON_KEY__:', (window as any).__SUPABASE_ANON_KEY__ ? 'SET' : 'NOT SET');
  console.log('  Final URL:', config.supabase.url);
  console.log('  Final Key:', config.supabase.anonKey ? 'SET' : 'NOT SET');
}
