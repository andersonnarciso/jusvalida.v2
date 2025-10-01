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

async function testAdminAPI() {
  try {
    console.log('🔍 Testando API de administração...');
    
    // 1. Get a valid session token for andersonnarciso@gmail.com
    console.log('\n1. Obtendo token de sessão...');
    
    // First, let's check if we can get user sessions
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    const adminUser = users.users.find(u => u.email === 'andersonnarciso@gmail.com');
    if (!adminUser) {
      console.error('❌ Admin user not found in Supabase Auth');
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.email}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Role: ${adminUser.app_metadata?.role || 'user'}`);
    console.log(`   Email confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
    
    // 2. Test the admin users API endpoint
    console.log('\n2. Testando endpoint /api/admin/users...');
    
    try {
      // Test without authentication first
      const response1 = await fetch('http://localhost:3000/api/admin/users');
      console.log(`   Status sem auth: ${response1.status}`);
      
      if (response1.status === 401) {
        console.log('   ✅ API está protegida (retorna 401 sem auth)');
      } else {
        console.log('   ⚠️  API não está protegida adequadamente');
      }
      
      // Test with a mock token
      const response2 = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      console.log(`   Status com token mock: ${response2.status}`);
      
      if (response2.status === 401) {
        console.log('   ✅ API rejeita token inválido');
      }
      
    } catch (apiError) {
      console.error('   ❌ Erro ao testar API:', apiError.message);
    }
    
    // 3. Check if the user is properly synced
    console.log('\n3. Verificando sincronização do usuário...');
    
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'andersonnarciso@gmail.com')
      .single();
    
    if (dbError) {
      console.error('   ❌ Erro ao buscar usuário no banco:', dbError);
    } else {
      console.log('   ✅ Usuário encontrado no banco:');
      console.log(`      ID: ${dbUser.id}`);
      console.log(`      Email: ${dbUser.email}`);
      console.log(`      Role: ${dbUser.role}`);
      console.log(`      Supabase ID: ${dbUser.supabase_id}`);
      console.log(`      Créditos: ${dbUser.credits}`);
    }
    
    // 4. Test the getAllUsers function directly
    console.log('\n4. Testando função getAllUsers diretamente...');
    
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allUsersError) {
      console.error('   ❌ Erro ao buscar todos os usuários:', allUsersError);
    } else {
      console.log(`   ✅ Encontrados ${allUsers.length} usuários no banco:`);
      allUsers.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.email} (${user.role}) - ${user.credits} créditos`);
      });
    }
    
    console.log('\n🎯 Diagnóstico concluído!');
    console.log('\n📋 Possíveis problemas:');
    console.log('   1. Token de autenticação não está sendo enviado corretamente');
    console.log('   2. Middleware de autenticação está falhando');
    console.log('   3. Problema na verificação de role admin');
    console.log('   4. CORS ou problema de rede');
    
  } catch (error) {
    console.error('❌ Error testing admin API:', error);
  }
}

testAdminAPI();
