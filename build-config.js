// Build configuration for Netlify
const fs = require('fs');
const path = require('path');

// Função para criar um arquivo de configuração de ambiente
function createEnvConfig() {
  const envConfig = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://lwqeysdqcepqfzmwvwsq.supabase.co',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cWV5c2RxY2VwcWZ6bXd2d3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ3OTksImV4cCI6MjA3MzYwMDc5OX0.5B6Jnpqh7zEIHHABF13ylltIZgttJ-ZKHC6AgzSMKlc',
    NODE_ENV: process.env.NODE_ENV || 'production'
  };

  // Criar arquivo de configuração
  const configContent = `// Auto-generated environment configuration
export const ENV_CONFIG = ${JSON.stringify(envConfig, null, 2)};

// Debug information
export const DEBUG_INFO = {
  buildTime: new Date().toISOString(),
  environment: '${process.env.NODE_ENV || 'production'}',
  hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY
};
`;

  // Escrever arquivo
  const configPath = path.join(__dirname, 'client', 'src', 'lib', 'env-config.ts');
  fs.writeFileSync(configPath, configContent);
  
  console.log('✅ Environment configuration created:', configPath);
  console.log('Environment variables:', envConfig);
}

// Executar se for chamado diretamente
if (require.main === module) {
  createEnvConfig();
}

module.exports = { createEnvConfig };
