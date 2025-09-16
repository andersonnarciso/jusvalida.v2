import { db } from '../db';
import { costModels } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

interface CostCalculation {
  inputTokenCost: number;
  outputTokenCost: number;
  totalCost: number;
  creditsRequired: number;
  profitMargin: number;
  operationalCosts: number;
}

export class CostCalculator {
  private static costCache = new Map<string, any>();
  private static cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Calculate credits required for a given provider/model and token usage
   */
  static async calculateCredits(
    provider: string, 
    model: string, 
    tokenUsage: TokenUsage
  ): Promise<CostCalculation> {
    const cacheKey = `${provider}-${model}`;
    const cached = this.costCache.get(cacheKey);
    
    // Use cache if available and not expired
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return this.computeCredits(cached.model, tokenUsage);
    }

    // Fetch cost model from database
    const costModel = await db
      .select()
      .from(costModels)
      .where(and(
        eq(costModels.provider, provider),
        eq(costModels.model, model),
        eq(costModels.isActive, true)
      ))
      .limit(1);

    if (!costModel.length) {
      throw new Error(`Cost model not found for ${provider}/${model}`);
    }

    // Cache the result
    this.costCache.set(cacheKey, {
      model: costModel[0],
      timestamp: Date.now()
    });

    return this.computeCredits(costModel[0], tokenUsage);
  }

  /**
   * Compute actual credits based on cost model and token usage
   */
  private static computeCredits(costModel: any, tokenUsage: TokenUsage): CostCalculation {
    const inputCost = Number(costModel.inputTokenCost) * tokenUsage.inputTokens;
    const outputCost = Number(costModel.outputTokenCost) * tokenUsage.outputTokens;
    const baseCost = inputCost + outputCost;

    // Apply operational multiplier and profit margin
    const operationalCosts = baseCost * (Number(costModel.operationalMultiplier) - 1);
    const totalCost = baseCost * Number(costModel.operationalMultiplier);
    const profitMargin = totalCost * Number(costModel.profitMargin);
    const finalCost = totalCost + profitMargin;

    // Calculate credits (each credit = R$ 0.10, so R$ 2.50-3.00 = 25-30 credits per analysis)
    const creditsRequired = Math.ceil(finalCost / 0.10); // Convert to credits

    return {
      inputTokenCost: inputCost,
      outputTokenCost: outputCost,
      totalCost: finalCost,
      creditsRequired,
      profitMargin,
      operationalCosts
    };
  }

  /**
   * Estimate credits for a document analysis based on content length
   */
  static estimateCreditsForDocument(content: string, provider: string, model: string): Promise<CostCalculation> {
    // Rough estimation: 4 characters ≈ 1 token
    const estimatedInputTokens = Math.ceil(content.length / 4);
    // Assume output is about 20% of input for document analysis
    const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.2);

    return this.calculateCredits(provider, model, {
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens
    });
  }

  /**
   * Get current pricing for a provider/model
   */
  static async getCurrentPricing(provider: string, model: string) {
    const costModel = await db
      .select()
      .from(costModels)
      .where(and(
        eq(costModels.provider, provider),
        eq(costModels.model, model),
        eq(costModels.isActive, true)
      ))
      .limit(1);

    if (!costModel.length) {
      return null;
    }

    const model_data = costModel[0];
    return {
      provider,
      model,
      inputTokenCost: Number(model_data.inputTokenCost),
      outputTokenCost: Number(model_data.outputTokenCost),
      creditsPerInputToken: Number(model_data.creditsPerInputToken),
      creditsPerOutputToken: Number(model_data.creditsPerOutputToken),
      profitMargin: Number(model_data.profitMargin),
      operationalMultiplier: Number(model_data.operationalMultiplier),
      lastUpdated: model_data.lastUpdated
    };
  }

  /**
   * Initialize cost models with current market rates (call this during app startup)
   */
  static async initializeCostModels() {
    const models = [
      {
        provider: 'openai',
        model: 'gpt-4',
        inputTokenCost: 0.00003, // $0.03 per 1K tokens (current as of Sept 2024)
        outputTokenCost: 0.00006, // $0.06 per 1K tokens
        profitMargin: 0.35, // 35% profit margin
        operationalMultiplier: 1.25, // 25% operational costs
        notes: 'OpenAI GPT-4 pricing as of September 2024'
      },
      {
        provider: 'openai',
        model: 'gpt-4-turbo',
        inputTokenCost: 0.00001, // $0.01 per 1K tokens
        outputTokenCost: 0.00003, // $0.03 per 1K tokens
        profitMargin: 0.35,
        operationalMultiplier: 1.25,
        notes: 'OpenAI GPT-4 Turbo pricing as of September 2024'
      },
      {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        inputTokenCost: 0.000003, // $0.003 per 1K tokens
        outputTokenCost: 0.000015, // $0.015 per 1K tokens
        profitMargin: 0.35,
        operationalMultiplier: 1.25,
        notes: 'Anthropic Claude 3 Sonnet pricing as of September 2024'
      },
      {
        provider: 'anthropic',
        model: 'claude-3-haiku',
        inputTokenCost: 0.00000025, // $0.00025 per 1K tokens
        outputTokenCost: 0.00000125, // $0.00125 per 1K tokens
        profitMargin: 0.35,
        operationalMultiplier: 1.25,
        notes: 'Anthropic Claude 3 Haiku pricing as of September 2024'
      },
      {
        provider: 'gemini',
        model: 'gemini-pro',
        inputTokenCost: 0.0000005, // $0.0005 per 1K tokens
        outputTokenCost: 0.0000015, // $0.0015 per 1K tokens
        profitMargin: 0.35,
        operationalMultiplier: 1.25,
        notes: 'Google Gemini Pro pricing as of September 2024'
      }
    ];

    for (const model of models) {
      // Calculate credits per token based on cost + margin + operations
      const finalInputCost = model.inputTokenCost * model.operationalMultiplier * (1 + model.profitMargin);
      const finalOutputCost = model.outputTokenCost * model.operationalMultiplier * (1 + model.profitMargin);
      
      // Convert USD to BRL (approximately 5.5 exchange rate) and then to credits (R$ 0.10 per credit)
      const exchangeRate = 5.5;
      const creditValue = 0.10; // Each credit = R$ 0.10
      
      const creditsPerInputToken = (finalInputCost * exchangeRate) / creditValue;
      const creditsPerOutputToken = (finalOutputCost * exchangeRate) / creditValue;

      try {
        await db.insert(costModels).values({
          provider: model.provider,
          model: model.model,
          inputTokenCost: model.inputTokenCost.toString(),
          outputTokenCost: model.outputTokenCost.toString(),
          creditsPerInputToken: creditsPerInputToken.toString(),
          creditsPerOutputToken: creditsPerOutputToken.toString(),
          profitMargin: model.profitMargin.toString(),
          operationalMultiplier: model.operationalMultiplier.toString(),
          notes: model.notes,
          isActive: true
        }).onConflictDoNothing(); // Don't insert if already exists
      } catch (error) {
        console.log(`Cost model for ${model.provider}/${model.model} already exists or error:`, error);
      }
    }

    console.log('✅ Cost models initialized');
  }

  /**
   * Validate pricing sustainability - check if R$ 2.50-3.00 per analysis is sustainable
   */
  static async validatePricingSustainability() {
    const targetCreditRange = { min: 25, max: 30 }; // R$ 2.50 - R$ 3.00
    const averageDocumentSize = 5000; // characters
    
    const providers = ['openai', 'anthropic', 'gemini'];
    const models = ['gpt-4', 'claude-3-sonnet', 'gemini-pro'];
    
    console.log('\n📊 PRICING SUSTAINABILITY ANALYSIS\n');
    console.log('Target: R$ 2.50 - R$ 3.00 per analysis (25-30 credits)\n');
    
    for (const provider of providers) {
      for (const model of models) {
        try {
          const estimate = await this.estimateCreditsForDocument(
            'x'.repeat(averageDocumentSize), 
            provider, 
            model
          );
          
          const sustainable = estimate.creditsRequired >= targetCreditRange.min && 
                             estimate.creditsRequired <= targetCreditRange.max;
          
          console.log(`${provider}/${model}:`);
          console.log(`  Credits Required: ${estimate.creditsRequired}`);
          console.log(`  Cost: R$ ${(estimate.creditsRequired * 0.10).toFixed(2)}`);
          console.log(`  Sustainable: ${sustainable ? '✅' : '❌'}`);
          console.log(`  Profit Margin: R$ ${estimate.profitMargin.toFixed(4)}`);
          console.log(`  Operational Costs: R$ ${estimate.operationalCosts.toFixed(4)}`);
          console.log('');
          
        } catch (error) {
          console.log(`${provider}/${model}: Model not found`);
        }
      }
    }
  }
}