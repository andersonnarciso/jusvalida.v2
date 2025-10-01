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

async function debugFrontendAuth() {
  try {
    console.log('🔍 Debugando autenticação do frontend...');
    
    // 1. Verificar se o usuário admin está logado
    console.log('\n1. Verificando usuário admin no Supabase Auth...');
    
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
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Role: ${adminUser.app_metadata?.role || 'user'}`);
    console.log(`   Email confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Last sign in: ${adminUser.last_sign_in_at ? new Date(adminUser.last_sign_in_at).toLocaleString() : 'Never'}`);
    
    // 2. Verificar se há sessões ativas
    console.log('\n2. Verificando sessões ativas...');
    
    // List all sessions (this might not work with admin API)
    console.log('   ⚠️  Não é possível listar sessões ativas via admin API');
    console.log('   💡 Solução: O usuário precisa fazer login no frontend');
    
    // 3. Criar um token de teste para o usuário admin
    console.log('\n3. Criando token de teste para andersonnarciso@gmail.com...');
    
    try {
      // Try to sign in with the admin user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'andersonnarciso@gmail.com',
        password: 'q1q2q3q4q5' // Use a known password
      });
      
      if (signInError) {
        console.log('   ⚠️  Não foi possível fazer login com senha (normal se não tiver senha definida)');
        console.log(`   Erro: ${signInError.message}`);
        
        // Create a magic link instead
        console.log('\n4. Gerando magic link para login...');
        
        const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: 'andersonnarciso@gmail.com',
          options: {
            redirectTo: 'http://localhost:5173/dashboard'
          }
        });
        
        if (magicLinkError) {
          console.error('   ❌ Error generating magic link:', magicLinkError);
        } else {
          console.log('   ✅ Magic link generated:');
          console.log(`   Link: ${magicLinkData.properties.action_link}`);
          console.log('\n   📋 Para resolver o problema:');
          console.log('   1. Acesse o link acima no navegador');
          console.log('   2. Faça login com andersonnarciso@gmail.com');
          console.log('   3. Acesse o painel administrativo');
          console.log('   4. Os usuários devem aparecer agora');
        }
      } else {
        console.log('   ✅ Login successful!');
        console.log(`   Access Token: ${signInData.session.access_token.substring(0, 50)}...`);
        console.log(`   Expires At: ${new Date(signInData.session.expires_at * 1000).toLocaleString()}`);
        
        // Test the API with this token
        console.log('\n5. Testando API com token do admin...');
        
        const response = await fetch('http://localhost:3000/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${signInData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ API funcionando! Encontrados ${data.users.length} usuários`);
          data.users.forEach((user, index) => {
            console.log(`      ${index + 1}. ${user.email} (${user.role})`);
          });
        } else {
          const errorText = await response.text();
          console.log(`   ❌ API Error: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('   ❌ Error during login test:', error);
    }
    
    console.log('\n🎯 Diagnóstico concluído!');
    console.log('\n📋 Possíveis soluções:');
    console.log('   1. Fazer login no frontend com andersonnarciso@gmail.com');
    console.log('   2. Usar o magic link gerado acima');
    console.log('   3. Verificar se o token está sendo enviado nas requisições');
    console.log('   4. Limpar cache do navegador');
    console.log('   5. Verificar console do navegador para erros');
    
  } catch (error) {
    console.error('❌ Error debugging frontend auth:', error);
  }
}

debugFrontendAuth();
