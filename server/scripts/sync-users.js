import { createClient } from '@supabase/supabase-js';
import { db } from '../db.ts';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncUsers() {
  try {
    console.log('🔄 Sincronizando usuários do Supabase Auth com a tabela users...');
    
    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    console.log(`📊 Found ${authUsers.users.length} users in Supabase Auth`);
    
    // Get all users from database
    const dbUsers = await db.select().from(users);
    console.log(`📊 Found ${dbUsers.length} users in database`);
    
    // Check each auth user
    for (const authUser of authUsers.users) {
      const email = authUser.email;
      const supabaseId = authUser.id;
      const role = authUser.app_metadata?.role || 'user';
      
      console.log(`\n👤 Processing user: ${email} (${role})`);
      
      // Check if user exists in database
      const existingUser = dbUsers.find(u => u.email === email);
      
      if (existingUser) {
        console.log(`   ✅ User exists in database`);
        
        // Update supabase_id if missing
        if (!existingUser.supabaseId) {
          console.log(`   🔄 Updating supabase_id...`);
          await db.update(users)
            .set({ supabaseId: supabaseId })
            .where(eq(users.id, existingUser.id));
          console.log(`   ✅ Updated supabase_id`);
        }
        
        // Update role if different
        if (existingUser.role !== role) {
          console.log(`   🔄 Updating role from ${existingUser.role} to ${role}...`);
          await db.update(users)
            .set({ role: role })
            .where(eq(users.id, existingUser.id));
          console.log(`   ✅ Updated role`);
        }
      } else {
        console.log(`   ⚠️  User not found in database, creating...`);
        
        // Create new user in database
        const newUser = {
          username: email.split('@')[0], // Use email prefix as username
          email: email,
          password: '', // No password needed for Supabase users
          firstName: authUser.user_metadata?.first_name || 'User',
          lastName: authUser.user_metadata?.last_name || 'Name',
          role: role,
          credits: 5, // Start with 5 free credits
          supabaseId: supabaseId,
        };
        
        const [createdUser] = await db.insert(users).values(newUser).returning();
        console.log(`   ✅ Created user with ID: ${createdUser.id}`);
      }
    }
    
    console.log('\n🎉 User synchronization completed!');
    
    // Show final status
    const finalUsers = await db.select().from(users);
    console.log(`\n📊 Final database status:`);
    console.log(`   Total users: ${finalUsers.length}`);
    
    const adminUsers = finalUsers.filter(u => u.role === 'admin');
    console.log(`   Admin users: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log(`   Admin users:`);
      adminUsers.forEach(user => {
        console.log(`     - ${user.email} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error syncing users:', error);
  }
}

syncUsers();
