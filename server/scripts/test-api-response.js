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

async function testApiResponse() {
  try {
    console.log('🔍 Testing API response simulation...');
    
    const userId = '28df4073-a5d7-4d23-9e38-b99fa1db061f';
    
    // Simulate the exact query from the API route
    const analyses = await db
      .select()
      .from(documentAnalyses)
      .where(and(
        eq(documentAnalyses.userId, userId),
        isNull(documentAnalyses.deletedAt)
      ))
      .orderBy(desc(documentAnalyses.createdAt))
      .limit(5);
    
    console.log('Raw database result:', JSON.stringify(analyses, null, 2));
    
    // Simulate JSON serialization/deserialization (like the API does)
    const jsonString = JSON.stringify(analyses);
    const deserializedAnalyses = JSON.parse(jsonString);
    
    console.log('After JSON round-trip:', JSON.stringify(deserializedAnalyses, null, 2));
    
    // Test the calculation with deserialized data
    const timeSaved = Math.round(deserializedAnalyses.reduce((acc, analysis) => acc + ((analysis.creditsUsed || 0) * 0.5), 0) * 10) / 10;
    console.log(`⏱️  Time Saved after JSON round-trip: ${timeSaved}h`);
    
    // Check for any issues with the data
    deserializedAnalyses.forEach((analysis, index) => {
      console.log(`Analysis ${index + 1}:`);
      console.log(`  creditsUsed: ${analysis.creditsUsed} (type: ${typeof analysis.creditsUsed})`);
      console.log(`  isNaN: ${isNaN(analysis.creditsUsed)}`);
      console.log(`  isNull: ${analysis.creditsUsed === null}`);
      console.log(`  isUndefined: ${analysis.creditsUsed === undefined}`);
      
      const individualTime = (analysis.creditsUsed || 0) * 0.5;
      console.log(`  individual time: ${individualTime}h`);
    });
    
  } catch (error) {
    console.error('❌ Error testing API response:', error);
  } finally {
    await sql.end();
  }
}

testApiResponse();
