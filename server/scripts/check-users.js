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

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no Supabase...');
    
    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    console.log(`\n📊 Status dos usuários no Supabase Auth:`);
    console.log(`   Total: ${authUsers.users.length} usuários`);
    
    const adminUsers = authUsers.users.filter(user => 
      user.app_metadata?.role === 'admin' || user.app_metadata?.role === 'support'
    );
    
    console.log(`   Admins: ${adminUsers.length} usuários`);
    
    console.log(`\n👥 Lista de usuários:`);
    authUsers.users.forEach((user, index) => {
      const role = user.app_metadata?.role || 'user';
      const status = user.email_confirmed_at ? '✅ Confirmado' : '⚠️ Não confirmado';
      console.log(`   ${index + 1}. ${user.email} (${role}) - ${status}`);
    });
    
    if (adminUsers.length > 0) {
      console.log(`\n👑 Usuários administradores:`);
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.app_metadata?.role})`);
      });
    } else {
      console.log(`\n⚠️  Nenhum usuário administrador encontrado!`);
      console.log(`   Para criar um admin:`);
      console.log(`   1. Vá para o dashboard do Supabase`);
      console.log(`   2. Authentication > Users`);
      console.log(`   3. Clique no usuário desejado`);
      console.log(`   4. Em "Raw user meta data", adicione: {"role": "admin"}`);
    }
    
    // Check database connection
    console.log(`\n🔍 Testando conexão com o banco de dados...`);
    
    try {
      const { data: dbUsers, error: dbError } = await supabase
        .from('users')
        .select('id, email, role, supabase_id')
        .limit(10);
      
      if (dbError) {
        console.log(`   ⚠️  Erro ao acessar tabela users: ${dbError.message}`);
        console.log(`   Isso pode ser normal se as migrações não foram executadas ainda.`);
      } else {
        console.log(`   ✅ Conexão com banco OK`);
        console.log(`   📊 Usuários na tabela users: ${dbUsers.length}`);
        
        if (dbUsers.length > 0) {
          console.log(`   👥 Usuários no banco:`);
          dbUsers.forEach(user => {
            console.log(`     - ${user.email} (${user.role})`);
          });
        }
      }
    } catch (dbError) {
      console.log(`   ⚠️  Erro ao conectar com banco: ${dbError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers();
