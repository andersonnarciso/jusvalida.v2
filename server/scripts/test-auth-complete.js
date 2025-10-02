import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthComplete() {
  try {
    console.log('🔍 Testing Complete Authentication Flow...');
    
    // 1. Get admin user from Supabase
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users from Supabase:', usersError);
      return;
    }
    
    const adminUser = users.find(u => u.email === 'andersonnarciso@gmail.com');
    if (!adminUser) {
      console.error('❌ Admin user not found in Supabase');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.app_metadata?.role
    });
    
    // 2. Create a session for the admin user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.email,
      options: {
        redirectTo: 'http://localhost:3000/admin'
      }
    });
    
    if (sessionError) {
      console.error('❌ Error generating session:', sessionError);
      return;
    }
    
    console.log('✅ Session generated');
    
    // 3. Extract token from the magic link
    const magicLink = sessionData.properties?.action_link;
    if (!magicLink) {
      console.error('❌ No magic link generated');
      return;
    }
    
    // Extract token from URL
    const url = new URL(magicLink);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.error('❌ No token in magic link');
      return;
    }
    
    console.log('✅ Token extracted:', token.substring(0, 20) + '...');
    
    // 4. Test API endpoints with token
    const endpoints = [
      '/api/admin/users',
      '/api/admin/site-config',
      '/api/admin/analytics'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing ${endpoint}...`);
      
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Success: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText}`);
        }
        
      } catch (apiError) {
        console.error(`   ❌ API Error: ${apiError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in auth test:', error);
  }
}

testAuthComplete();
