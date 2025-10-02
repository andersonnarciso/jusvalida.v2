import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { documentAnalyses } from '../../shared/schema.ts';
import { eq, isNull } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function fixCreditsUsed() {
  try {
    console.log('🔍 Checking for analyses with missing creditsUsed...');
    
    // Find analyses where creditsUsed is null or undefined
    const problematicAnalyses = await db
      .select()
      .from(documentAnalyses)
      .where(isNull(documentAnalyses.creditsUsed));
    
    console.log(`📊 Found ${problematicAnalyses.length} analyses with missing creditsUsed`);
    
    if (problematicAnalyses.length === 0) {
      console.log('✅ All analyses have creditsUsed values');
      return;
    }
    
    console.log('🔧 Fixing missing creditsUsed values...');
    
    // Update each analysis with a default creditsUsed value based on provider
    for (const analysis of problematicAnalyses) {
      let defaultCredits = 1; // Default fallback
      
      // Set credits based on provider (matching the logic in ai.ts)
      if (analysis.aiProvider === 'openai' && analysis.aiModel === 'gpt-4') {
        defaultCredits = 2;
      } else if (analysis.aiProvider === 'openai' && analysis.aiModel === 'gpt-5') {
        defaultCredits = 3;
      } else if (analysis.aiProvider === 'anthropic' && analysis.aiModel === 'claude') {
        defaultCredits = 3;
      } else if (analysis.aiProvider === 'gemini' && analysis.aiModel === 'pro') {
        defaultCredits = 1;
      } else if (analysis.aiProvider === 'gemini' && analysis.aiModel === 'flash') {
        defaultCredits = 1;
      } else if (analysis.aiProvider === 'openrouter') {
        defaultCredits = 2;
      } else if (analysis.aiProvider === 'free') {
        defaultCredits = 0;
      }
      
      // Apply analysis type multiplier
      const tierMultipliers = {
        'general': 1.0,
        'contract': 1.5,
        'legal': 1.5,
        'compliance': 2.0,
        'template': 1.8
      };
      
      const multiplier = tierMultipliers[analysis.analysisType] || 1.0;
      const finalCredits = Math.ceil(defaultCredits * multiplier);
      
      await db
        .update(documentAnalyses)
        .set({ creditsUsed: finalCredits })
        .where(eq(documentAnalyses.id, analysis.id));
      
      console.log(`✅ Fixed analysis ${analysis.id}: ${finalCredits} credits (${analysis.aiProvider}-${analysis.aiModel}, ${analysis.analysisType})`);
    }
    
    console.log('🎉 All missing creditsUsed values have been fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing creditsUsed:', error);
  } finally {
    await sql.end();
  }
}

fixCreditsUsed();
