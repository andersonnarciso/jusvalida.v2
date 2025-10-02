import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { documentAnalyses } from '../../shared/schema.ts';
import { eq, isNull, desc } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function debugAnalyses() {
  try {
    console.log('🔍 Debugging recent analyses...');
    
    // Get recent analyses (same query as in the API)
    const analyses = await db
      .select()
      .from(documentAnalyses)
      .where(isNull(documentAnalyses.deletedAt))
      .orderBy(desc(documentAnalyses.createdAt))
      .limit(5);
    
    console.log(`📊 Found ${analyses.length} recent analyses`);
    
    analyses.forEach((analysis, index) => {
      console.log(`\n📄 Analysis ${index + 1}:`);
      console.log(`   ID: ${analysis.id}`);
      console.log(`   Title: ${analysis.title}`);
      console.log(`   Credits Used: ${analysis.creditsUsed} (type: ${typeof analysis.creditsUsed})`);
      console.log(`   AI Provider: ${analysis.aiProvider}`);
      console.log(`   AI Model: ${analysis.aiModel}`);
      console.log(`   Analysis Type: ${analysis.analysisType}`);
      console.log(`   Status: ${analysis.status}`);
      console.log(`   Created: ${analysis.createdAt}`);
      
      // Test the calculation that's causing NaN
      const timeSaved = Math.round(analyses.reduce((acc, a) => acc + ((a.creditsUsed || 0) * 0.5), 0) * 10) / 10;
      console.log(`   Time Saved Calculation: ${timeSaved}h`);
    });
    
    // Test the specific calculation from the dashboard
    const totalTimeSaved = Math.round(analyses.reduce((acc, analysis) => acc + ((analysis.creditsUsed || 0) * 0.5), 0) * 10) / 10;
    console.log(`\n⏱️  Total Time Saved: ${totalTimeSaved}h`);
    
  } catch (error) {
    console.error('❌ Error debugging analyses:', error);
  } finally {
    await sql.end();
  }
}

debugAnalyses();
