import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler o index.html
const indexPath = path.resolve(__dirname, 'client', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Obter variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL || 'https://lwqeysdqcepqfzmwvwsq.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cWV5c2RxY2VwcWZ6bXd2d3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ3OTksImV4cCI6MjA3MzYwMDc5OX0.5B6Jnpqh7zEIHHABF13ylltIZgttJ-ZKHC6AgzSMKlc';

console.log('🔧 Injecting environment variables:');
console.log('  SUPABASE_URL:', supabaseUrl);
console.log('  SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');

// Criar script de injeção
const envScript = `
  <script>
    // Injetar variáveis de ambiente diretamente
    window.__SUPABASE_URL__ = "${supabaseUrl}";
    window.__SUPABASE_ANON_KEY__ = "${supabaseAnonKey}";
    
    // Debug logging
    console.log('🔧 Environment variables injected:', {
      url: window.__SUPABASE_URL__,
      hasKey: !!window.__SUPABASE_ANON_KEY__,
      keyLength: window.__SUPABASE_ANON_KEY__?.length || 0
    });
  </script>
`;

// Injetar antes do fechamento do head
indexHtml = indexHtml.replace('</head>', envScript + '</head>');

// Salvar arquivo modificado
fs.writeFileSync(indexPath, indexHtml);

console.log('✅ Environment variables injected into index.html');
