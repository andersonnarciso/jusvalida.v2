import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from "@google/genai";

/*
<important_code_snippet_instructions>
The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
If the user doesn't specify a model, always prefer using "claude-sonnet-4-20250514" as it is the latest model.
The newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
</important_code_snippet_instructions>
*/

export interface AnalysisResult {
  summary: string;
  criticalFlaws: string[];
  warnings: string[];
  improvements: string[];
  legalCompliance: {
    score: number;
    issues: string[];
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class AIService {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private gemini?: GoogleGenAI;

  constructor() {
    // Initialize with default API keys if available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  private getSystemPrompt(analysisType: string): string {
    const basePrompt = `You are JusValida, a specialized legal AI assistant for document validation and analysis. Your expertise covers Brazilian and international law, contract analysis, legal compliance, and document review.

Analyze the provided legal document and return a comprehensive analysis in JSON format with the following structure:
{
  "summary": "Brief summary of the document and main findings",
  "criticalFlaws": ["Critical legal flaws that must be addressed immediately"],
  "warnings": ["Important issues that need attention"],
  "improvements": ["Suggestions for enhancing the document"],
  "legalCompliance": {
    "score": 85,
    "issues": ["Specific compliance issues found"]
  },
  "recommendations": ["Specific actionable recommendations"],
  "riskLevel": "medium"
}`;

    const typeSpecificPrompts = {
      general: "Perform a comprehensive legal analysis covering all aspects of the document.",
      contract: "Focus on contractual clauses, terms, obligations, and potential loopholes. Pay special attention to termination clauses, liability limitations, and dispute resolution mechanisms.",
      legal: "Analyze as a legal petition or procedural document. Check for proper legal formatting, required elements, deadlines, and procedural compliance.",
      compliance: "Focus on regulatory compliance, legal requirements, and adherence to current legislation. Identify any regulatory gaps or non-compliance issues."
    };

    return basePrompt + "\n\n" + (typeSpecificPrompts[analysisType as keyof typeof typeSpecificPrompts] || typeSpecificPrompts.general);
  }

  async analyzeWithOpenAI(content: string, analysisType: string, apiKey?: string): Promise<AnalysisResult> {
    const client = apiKey ? new OpenAI({ apiKey }) : this.openai;
    if (!client) throw new Error("OpenAI API key not configured");

    const response = await client.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(analysisType)
        },
        {
          role: "user",
          content: `Please analyze the following legal document:\n\n${content}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as AnalysisResult;
  }

  async analyzeWithAnthropic(content: string, analysisType: string, apiKey?: string): Promise<AnalysisResult> {
    const client = apiKey ? new Anthropic({ apiKey }) : this.anthropic;
    if (!client) throw new Error("Anthropic API key not configured");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514", // newest Anthropic model
      system: this.getSystemPrompt(analysisType),
      messages: [
        {
          role: "user",
          content: `Please analyze the following legal document:\n\n${content}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in response');
    }
    const result = JSON.parse(textBlock.text);
    return result as AnalysisResult;
  }

  async analyzeWithGemini(content: string, analysisType: string, apiKey?: string): Promise<AnalysisResult> {
    const client = apiKey ? new GoogleGenAI({ apiKey }) : this.gemini;
    if (!client) throw new Error("Gemini API key not configured");

    const response = await client.models.generateContent({
      model: "gemini-2.5-pro", // newest Gemini model
      config: {
        systemInstruction: this.getSystemPrompt(analysisType),
        responseMimeType: "application/json",
      },
      contents: `Please analyze the following legal document:\n\n${content}`,
    });

    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResult;
  }

  async analyzeWithFreeAI(content: string, analysisType: string): Promise<AnalysisResult> {
    // Simplified analysis for free tier
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    const wordCount = content.split(' ').length;
    const hasContracts = content.toLowerCase().includes('contrato') || content.toLowerCase().includes('contract');
    const hasLegalTerms = /\b(lei|artigo|parágrafo|cláusula|disposição)\b/i.test(content);
    
    return {
      summary: `Documento analisado com ${wordCount} palavras. ${hasContracts ? 'Documento contratual identificado.' : ''} ${hasLegalTerms ? 'Termos legais detectados.' : ''}`,
      criticalFlaws: wordCount > 5000 ? ["Documento muito extenso para análise gratuita"] : [],
      warnings: hasLegalTerms ? [] : ["Poucos termos legais identificados no documento"],
      improvements: [
        "Considere usar análise premium para insights mais detalhados",
        "Revise a estrutura e formatação do documento"
      ],
      legalCompliance: {
        score: hasLegalTerms ? 70 : 50,
        issues: hasLegalTerms ? [] : ["Documento pode não seguir padrões legais adequados"]
      },
      recommendations: [
        "Utilize análise premium com IA especializada para resultados mais precisos",
        "Consulte um advogado para validação final"
      ],
      riskLevel: wordCount > 3000 ? 'medium' : 'low'
    };
  }

  getProviderCredits(provider: string): number {
    const credits = {
      'openai-gpt4': 2,
      'openai-gpt5': 3,
      'anthropic-claude': 3,
      'gemini-pro': 1,
      'gemini-flash': 1,
      'openrouter': 2,
      'free': 0
    };
    return credits[provider as keyof typeof credits] || 1;
  }

  async analyzeDocument(
    content: string,
    analysisType: string,
    provider: string,
    model: string,
    apiKey?: string
  ): Promise<AnalysisResult> {
    try {
      switch (provider) {
        case 'openai':
          return await this.analyzeWithOpenAI(content, analysisType, apiKey);
        case 'anthropic':
          return await this.analyzeWithAnthropic(content, analysisType, apiKey);
        case 'gemini':
          return await this.analyzeWithGemini(content, analysisType, apiKey);
        case 'free':
          return await this.analyzeWithFreeAI(content, analysisType);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error: any) {
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
  }
}

export const aiService = new AIService();
