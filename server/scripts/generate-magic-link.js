import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateMagicLink() {
  try {
    console.log('🔗 Gerando magic link para andersonnarciso@gmail.com...');
    
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'andersonnarciso@gmail.com',
      options: {
        redirectTo: 'http://localhost:5173/dashboard'
      }
    });
    
    if (error) {
      console.error('❌ Error generating magic link:', error);
      return;
    }
    
    console.log('✅ Magic link gerado com sucesso!');
    console.log('\n🔗 LINK PARA LOGIN:');
    console.log(data.properties.action_link);
    console.log('\n📋 INSTRUÇÕES:');
    console.log('1. Copie o link acima');
    console.log('2. Cole no navegador');
    console.log('3. Faça login com andersonnarciso@gmail.com');
    console.log('4. Acesse o painel administrativo');
    console.log('5. Os usuários devem aparecer agora!');
    
  } catch (error) {
    console.error('❌ Error generating magic link:', error);
  }
}

generateMagicLink();
