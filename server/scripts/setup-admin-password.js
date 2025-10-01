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

async function setupAdminPassword() {
  try {
    console.log('🔑 Configurando senha para o usuário admin...');
    
    // 1. Verificar se o usuário admin existe
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    const adminUser = users.users.find(u => u.email === 'andersonnarciso@gmail.com');
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', adminUser.email);
    
    // 2. Definir uma senha para o usuário admin
    const newPassword = 'admin123456'; // Senha simples para teste
    
    console.log('🔑 Definindo senha para o usuário admin...');
    
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        password: newPassword,
        email_confirm: true // Confirmar email automaticamente
      }
    );
    
    if (updateError) {
      console.error('❌ Error updating user password:', updateError);
      return;
    }
    
    console.log('✅ Senha definida com sucesso!');
    console.log('\n📋 CREDENCIAIS DE LOGIN:');
    console.log(`   Email: andersonnarciso@gmail.com`);
    console.log(`   Senha: ${newPassword}`);
    console.log('\n🌐 COMO USAR:');
    console.log('1. Acesse: http://localhost:5173');
    console.log('2. Clique em "Entrar"');
    console.log('3. Use as credenciais acima');
    console.log('4. Acesse o painel administrativo');
    console.log('5. Os usuários devem aparecer agora!');
    
    // 3. Testar login
    console.log('\n🧪 Testando login...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'andersonnarciso@gmail.com',
      password: newPassword
    });
    
    if (signInError) {
      console.error('❌ Error testing login:', signInError);
    } else {
      console.log('✅ Login test successful!');
      console.log(`   Token: ${signInData.session.access_token.substring(0, 50)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up admin password:', error);
  }
}

setupAdminPassword();
