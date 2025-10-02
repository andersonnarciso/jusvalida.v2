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

async function testTokenVerification() {
  try {
    console.log('🔍 Testing Token Verification...');
    
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
      email: adminUser.email
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
    
    // 4. Test token verification directly
    console.log('\n🔍 Testing token verification...');
    
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
    
    if (verifyError) {
      console.error('❌ Token verification error:', verifyError);
      return;
    }
    
    if (!user) {
      console.error('❌ No user returned from token verification');
      return;
    }
    
    console.log('✅ Token verification successful:', {
      id: user.id,
      email: user.email,
      role: user.app_metadata?.role
    });
    
    // 5. Test with service key
    console.log('\n🔍 Testing with service key...');
    
    const { data: { user: serviceUser }, error: serviceError } = await supabase.auth.admin.getUserById(adminUser.id);
    
    if (serviceError) {
      console.error('❌ Service key verification error:', serviceError);
      return;
    }
    
    console.log('✅ Service key verification successful:', {
      id: serviceUser.id,
      email: serviceUser.email,
      role: serviceUser.app_metadata?.role
    });
    
  } catch (error) {
    console.error('❌ Error in token test:', error);
  }
}

testTokenVerification();
