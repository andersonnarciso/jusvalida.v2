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

async function setUserPassword() {
  try {
    console.log('🔍 Setting user password...');
    
    // Set password for the admin user
    const { data, error } = await supabase.auth.admin.updateUserById(
      'e936bd36-5d7a-440a-9a89-dc9dd616e81a',
      {
        password: 'admin123'
      }
    );
    
    if (error) {
      console.error('❌ Error setting password:', error);
      return;
    }
    
    console.log('✅ Password set successfully!');
    console.log('User:', data.user?.email);
    
    // Now test sign in
    console.log('\n🔍 Testing sign in...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'andersonnarciso@gmail.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Sign in error:', authError);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('Token:', authData.session?.access_token ? 'EXISTS' : 'MISSING');
    
    if (authData.session?.access_token) {
      // Test the API
      console.log('\n🔍 Testing API...');
      
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
    console.error('❌ Error setting password:', error);
  }
}

setUserPassword();
