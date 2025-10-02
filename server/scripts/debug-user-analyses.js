import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { documentAnalyses, users } from '../../shared/schema.ts';
import { eq, isNull, desc, and } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function debugUserAnalyses() {
  try {
    console.log('🔍 Debugging user analyses...');
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`📊 Found ${allUsers.length} users`);
    
    for (const user of allUsers) {
      console.log(`\n👤 User: ${user.email} (${user.id})`);
      
      // Get analyses for this user
      const userAnalyses = await db
        .select()
        .from(documentAnalyses)
        .where(and(
          eq(documentAnalyses.userId, user.id),
          isNull(documentAnalyses.deletedAt)
        ))
        .orderBy(desc(documentAnalyses.createdAt))
        .limit(10);
      
      console.log(`   📄 Found ${userAnalyses.length} analyses`);
      
      userAnalyses.forEach((analysis, index) => {
        console.log(`   Analysis ${index + 1}:`);
        console.log(`     ID: ${analysis.id}`);
        console.log(`     Title: ${analysis.title}`);
        console.log(`     Credits Used: ${analysis.creditsUsed} (type: ${typeof analysis.creditsUsed})`);
        console.log(`     AI Provider: "${analysis.aiProvider}"`);
        console.log(`     AI Model: "${analysis.aiModel}"`);
        console.log(`     Analysis Type: ${analysis.analysisType}`);
        console.log(`     Status: ${analysis.status}`);
        console.log(`     Created: ${analysis.createdAt}`);
        
        // Test the calculation
        const timeSaved = (analysis.creditsUsed || 0) * 0.5;
        console.log(`     Time Saved: ${timeSaved}h`);
      });
      
      // Test the dashboard calculation for this user
      const totalTimeSaved = Math.round(userAnalyses.reduce((acc, analysis) => acc + ((analysis.creditsUsed || 0) * 0.5), 0) * 10) / 10;
      console.log(`   ⏱️  Total Time Saved for ${user.email}: ${totalTimeSaved}h`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging user analyses:', error);
  } finally {
    await sql.end();
  }
}

debugUserAnalyses();
