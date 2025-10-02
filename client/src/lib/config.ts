// Configuração de ambiente para produção
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 
         import.meta.env.SUPABASE_URL || 
         (window as any).__SUPABASE_URL__,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 
             import.meta.env.SUPABASE_ANON_KEY || 
             (window as any).__SUPABASE_ANON_KEY__
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 
             import.meta.env.API_URL || 
             (import.meta.env.PROD ? 'https://app.jusvalida.com.br' : 'http://localhost:3000')
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
  console.log('  API Base URL:', config.api.baseUrl);
}
