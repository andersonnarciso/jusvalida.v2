import { storage } from '../storage.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

async function testUsersDirect() {
  try {
    console.log('🔍 Testing getAllUsers directly...');
    
    const result = await storage.getAllUsers(1, 10);
    
    console.log('✅ Users found:', result.total);
    console.log('📊 Users data:', JSON.stringify(result, null, 2));
    
    if (result.users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log('✅ Users found:');
      result.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing users:', error);
  }
}

testUsersDirect();
