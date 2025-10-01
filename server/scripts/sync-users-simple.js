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

async function syncUsersSimple() {
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
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*');
    
    if (dbError) {
      console.error('❌ Error fetching database users:', dbError);
      return;
    }
    
    console.log(`📊 Found ${dbUsers.length} users in database`);
    
    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    
    // Process each auth user
    for (const authUser of authUsers.users) {
      const email = authUser.email;
      const supabaseId = authUser.id;
      const role = authUser.app_metadata?.role || 'user';
      const firstName = authUser.user_metadata?.first_name || 'User';
      const lastName = authUser.user_metadata?.last_name || 'Name';
      const username = email.split('@')[0]; // Use email prefix as username
      
      console.log(`\n👤 Processing user: ${email} (${role})`);
      
      // Check if user exists in database
      const existingUser = dbUsers.find(u => u.email === email);
      
      if (existingUser) {
        console.log(`   ✅ User exists in database`);
        
        let needsUpdate = false;
        const updates = {};
        
        // Update supabase_id if missing
        if (!existingUser.supabase_id) {
          updates.supabase_id = supabaseId;
          needsUpdate = true;
          console.log(`   🔄 Adding supabase_id...`);
        }
        
        // Update role if different
        if (existingUser.role !== role) {
          updates.role = role;
          needsUpdate = true;
          console.log(`   🔄 Updating role from ${existingUser.role} to ${role}...`);
        }
        
        // Update name if different
        if (existingUser.first_name !== firstName) {
          updates.first_name = firstName;
          needsUpdate = true;
          console.log(`   🔄 Updating first_name from ${existingUser.first_name} to ${firstName}...`);
        }
        
        if (existingUser.last_name !== lastName) {
          updates.last_name = lastName;
          needsUpdate = true;
          console.log(`   🔄 Updating last_name from ${existingUser.last_name} to ${lastName}...`);
        }
        
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', existingUser.id);
          
          if (updateError) {
            console.error(`   ❌ Error updating user: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated user successfully`);
            updatedCount++;
          }
        } else {
          console.log(`   ✅ User already up to date`);
        }
        
        syncedCount++;
      } else {
        console.log(`   ⚠️  User not found in database, creating...`);
        
        // Create new user in database
        const newUser = {
          username: username,
          email: email,
          password: '', // No password needed for Supabase users
          first_name: firstName,
          last_name: lastName,
          role: role,
          credits: 5, // Start with 5 free credits
          supabase_id: supabaseId,
        };
        
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();
        
        if (createError) {
          console.error(`   ❌ Error creating user: ${createError.message}`);
        } else {
          console.log(`   ✅ Created user with ID: ${createdUser.id}`);
          createdCount++;
        }
        
        syncedCount++;
      }
    }
    
    console.log('\n🎉 User synchronization completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${authUsers.users.length}`);
    console.log(`   Synced: ${syncedCount}`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Updated: ${updatedCount}`);
    
    // Show final status
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*');
    
    if (finalError) {
      console.error('❌ Error fetching final users:', finalError);
      return;
    }
    
    console.log(`\n📊 Final database status:`);
    console.log(`   Total users: ${finalUsers.length}`);
    
    const adminUsers = finalUsers.filter(u => u.role === 'admin');
    const supportUsers = finalUsers.filter(u => u.role === 'support');
    const regularUsers = finalUsers.filter(u => u.role === 'user');
    
    console.log(`   Admin users: ${adminUsers.length}`);
    console.log(`   Support users: ${supportUsers.length}`);
    console.log(`   Regular users: ${regularUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log(`\n👑 Admin users:`);
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.credits} créditos`);
      });
    }
    
    if (supportUsers.length > 0) {
      console.log(`\n🛠️  Support users:`);
      supportUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.credits} créditos`);
      });
    }
    
    console.log(`\n✅ Sincronização concluída! Agora o painel administrativo deve mostrar os usuários.`);
    
  } catch (error) {
    console.error('❌ Error syncing users:', error);
  }
}

syncUsersSimple();
