import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY');
  console.error('');
  console.error('Please create a .env file with your Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test connection by listing users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log(`📊 Found ${users.users.length} users in Supabase Auth`);
    return true;
    
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
    return false;
  }
}

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Test database connection by querying a simple table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Database tables not found or not accessible');
      console.log('This is normal if you haven\'t run migrations yet.');
      return false;
    }
    
    console.log('✅ Database tables are accessible');
    return true;
    
  } catch (error) {
    console.log('⚠️  Database tables not found or not accessible');
    console.log('This is normal if you haven\'t run migrations yet.');
    return false;
  }
}

async function showMigrationStatus() {
  console.log('📋 Migration Status Check');
  console.log('========================');
  
  const supabaseConnected = await checkSupabaseConnection();
  const databaseReady = await checkDatabaseTables();
  
  console.log('');
  console.log('📊 Status Summary:');
  console.log(`   Supabase Connection: ${supabaseConnected ? '✅' : '❌'}`);
  console.log(`   Database Tables: ${databaseReady ? '✅' : '⚠️'}`);
  
  if (!supabaseConnected) {
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Create a Supabase project at https://supabase.com');
    console.log('2. Get your project URL and service key');
    console.log('3. Create a .env file with the credentials');
    console.log('4. Run this script again');
    return;
  }
  
  if (!databaseReady) {
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Run: npx drizzle-kit generate');
    console.log('2. Run: npx drizzle-kit migrate');
    console.log('3. Run this script again to verify');
    return;
  }
  
  console.log('');
  console.log('🎉 Migration appears to be complete!');
  console.log('');
  console.log('🔧 Final Steps:');
  console.log('1. Create an admin user in Supabase Auth dashboard');
  console.log('2. Set user metadata: { "role": "admin" }');
  console.log('3. Run: node server/scripts/setup-admin-user.js');
  console.log('4. Test your application');
}

async function main() {
  console.log('🚀 Supabase Migration Helper');
  console.log('============================');
  console.log('');
  
  await showMigrationStatus();
}

main().catch(console.error);
