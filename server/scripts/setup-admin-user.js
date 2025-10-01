import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lwqeysdqcepqfzmwvwsq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminUser() {
  try {
    console.log('🔍 Checking for existing admin users...');
    
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${users.users.length} users`);
    
    // Check if any user has admin role
    const adminUsers = users.users.filter(user => 
      user.app_metadata?.role === 'admin' || user.app_metadata?.role === 'support'
    );
    
    console.log(`👑 Found ${adminUsers.length} admin/support users`);
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found!');
      console.log('To create an admin user, you need to:');
      console.log('1. Create a user account normally');
      console.log('2. Update their app_metadata in Supabase dashboard');
      console.log('3. Or use the Supabase CLI to set the role');
      console.log('');
      console.log('Manual steps:');
      console.log('1. Go to Supabase Dashboard > Authentication > Users');
      console.log('2. Find your user and click "Edit"');
      console.log('3. In the "Raw user meta data" section, add:');
      console.log('   { "role": "admin" }');
      console.log('4. Save the changes');
    } else {
      console.log('✅ Admin users found:');
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.app_metadata?.role})`);
      });
    }
    
    // Show all users and their roles
    console.log('\n📋 All users and their roles:');
    users.users.forEach(user => {
      const role = user.app_metadata?.role || 'user';
      console.log(`   - ${user.email}: ${role}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  }
}

setupAdminUser();
