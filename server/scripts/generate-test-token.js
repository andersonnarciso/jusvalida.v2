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

async function generateTestToken() {
  try {
    console.log('🔑 Gerando token de teste para andersonnarciso@gmail.com...');
    
    // Create a test session for the admin user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'andersonnarciso@gmail.com',
      options: {
        redirectTo: 'http://localhost:5173/dashboard'
      }
    });
    
    if (sessionError) {
      console.error('❌ Error generating magic link:', sessionError);
      return;
    }
    
    console.log('✅ Magic link generated:');
    console.log(`   Link: ${sessionData.properties.action_link}`);
    
    // Alternative: Create a JWT token manually
    console.log('\n🔑 Criando token JWT manual...');
    
    // Get the admin user
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
    
    // Create a custom JWT token (this is a simplified version)
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: 'admin',
      aud: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      iss: supabaseUrl,
      app_metadata: {
        role: 'admin'
      },
      user_metadata: {
        first_name: 'Anderson',
        last_name: 'Narciso'
      }
    };
    
    // For testing, we'll use the service key to create a session
    const { data: session, error: sessionCreateError } = await supabase.auth.admin.createUser({
      email: 'test-admin@jusvalida.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Admin'
      },
      app_metadata: {
        role: 'admin'
      }
    });
    
    if (sessionCreateError) {
      console.error('❌ Error creating test user:', sessionCreateError);
      return;
    }
    
    console.log('✅ Test admin user created:');
    console.log(`   Email: test-admin@jusvalida.com`);
    console.log(`   Password: test123456`);
    console.log(`   User ID: ${session.user.id}`);
    
    // Now try to sign in with this user to get a real token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test-admin@jusvalida.com',
      password: 'test123456'
    });
    
    if (signInError) {
      console.error('❌ Error signing in:', signInError);
      return;
    }
    
    console.log('\n🎉 Token de teste gerado com sucesso!');
    console.log(`   Access Token: ${signInData.session.access_token.substring(0, 50)}...`);
    console.log(`   Refresh Token: ${signInData.session.refresh_token.substring(0, 50)}...`);
    console.log(`   Expires At: ${new Date(signInData.session.expires_at * 1000).toLocaleString()}`);
    
    // Test the API with this token
    console.log('\n🧪 Testando API com token válido...');
    
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
    
  } catch (error) {
    console.error('❌ Error generating test token:', error);
  }
}

generateTestToken();
