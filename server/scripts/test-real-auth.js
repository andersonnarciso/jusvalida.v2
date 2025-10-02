import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealAuth() {
  try {
    console.log('🔍 Testing Real Authentication...');
    
    // 1. Try to sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'andersonnarciso@gmail.com',
      password: 'test123' // You'll need to set this password
    });
    
    if (authError) {
      console.log('❌ Sign in error:', authError.message);
      console.log('💡 Try creating a password for the user first');
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User:', authData.user?.email);
    console.log('Session:', authData.session?.access_token ? 'EXISTS' : 'MISSING');
    
    if (authData.session?.access_token) {
      // 2. Test the API with the real token
      console.log('\n🔍 Testing API with real token...');
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`
        }
      });
      
      console.log('API Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Success! Users found:', data.total);
        console.log('Users:', data.users.map(u => `${u.firstName} ${u.lastName} (${u.email})`));
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in real auth test:', error);
  }
}

testRealAuth();
