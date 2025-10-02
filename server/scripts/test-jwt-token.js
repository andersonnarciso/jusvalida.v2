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

async function testJWTToken() {
  try {
    console.log('🔍 Testing JWT Token Generation...');
    
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
    
    // 2. Create a session for the admin user using admin API
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
    
    // 3. Try to create a session directly
    const { data: sessionData2, error: sessionError2 } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: adminUser.email,
      options: {
        redirectTo: 'http://localhost:3000/admin'
      }
    });
    
    if (sessionError2) {
      console.error('❌ Error generating signup link:', sessionError2);
    } else {
      console.log('✅ Signup link generated');
    }
    
    // 4. Try to create a session with password
    const { data: sessionData3, error: sessionError3 } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: adminUser.email,
      options: {
        redirectTo: 'http://localhost:3000/admin'
      }
    });
    
    if (sessionError3) {
      console.error('❌ Error generating recovery link:', sessionError3);
    } else {
      console.log('✅ Recovery link generated');
    }
    
    // 5. Try to create a session with admin API
    const { data: sessionData4, error: sessionError4 } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.email,
      options: {
        redirectTo: 'http://localhost:3000/admin'
      }
    });
    
    if (sessionError4) {
      console.error('❌ Error generating admin link:', sessionError4);
    } else {
      console.log('✅ Admin link generated');
      console.log('Link:', sessionData4.properties?.action_link);
    }
    
  } catch (error) {
    console.error('❌ Error in JWT test:', error);
  }
}

testJWTToken();
