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

async function testUsersAPI() {
  try {
    console.log('🔍 Testing Users API...');
    
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
    
    // 2. Generate a session token for the admin user
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
    
    // 3. Test the API endpoint
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${adminUser.id}` // This might not work, but let's try
      }
    });
    
    console.log('📊 API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Users API Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing users API:', error);
  }
}

testUsersAPI();
