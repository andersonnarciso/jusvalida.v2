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

async function testFrontendQuery() {
  try {
    console.log('🔍 Testing frontend query simulation...');
    
    // Simulate the exact query from the frontend
    const userId = '28df4073-a5d7-4d23-9e38-b99fa1db061f'; // andersonnarciso@gmail.com
    
    const recentAnalyses = await db
      .select()
      .from(documentAnalyses)
      .where(and(
        eq(documentAnalyses.userId, userId),
        isNull(documentAnalyses.deletedAt)
      ))
      .orderBy(desc(documentAnalyses.createdAt))
      .limit(5);
    
    console.log(`📊 Found ${recentAnalyses.length} recent analyses`);
    console.log('Raw data:', JSON.stringify(recentAnalyses, null, 2));
    
    // Test the exact calculation from the dashboard
    const timeSaved = Math.round(recentAnalyses.reduce((acc, analysis) => acc + ((analysis.creditsUsed || 0) * 0.5), 0) * 10) / 10;
    console.log(`⏱️  Time Saved: ${timeSaved}h`);
    
    // Test individual analysis calculations
    recentAnalyses.forEach((analysis, index) => {
      const individualTime = (analysis.creditsUsed || 0) * 0.5;
      console.log(`Analysis ${index + 1}: ${analysis.creditsUsed} credits = ${individualTime}h`);
    });
    
    // Test if any analysis has undefined creditsUsed
    const hasUndefinedCredits = recentAnalyses.some(analysis => analysis.creditsUsed === undefined || analysis.creditsUsed === null);
    console.log(`Has undefined credits: ${hasUndefinedCredits}`);
    
    // Test if any analysis has NaN creditsUsed
    const hasNaNCredits = recentAnalyses.some(analysis => isNaN(analysis.creditsUsed));
    console.log(`Has NaN credits: ${hasNaNCredits}`);
    
  } catch (error) {
    console.error('❌ Error testing frontend query:', error);
  } finally {
    await sql.end();
  }
}

testFrontendQuery();
