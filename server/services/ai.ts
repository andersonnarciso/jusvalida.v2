import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from "@google/genai";
import { storage } from '../storage';
import type { DocumentTemplate, LegalClause, TemplatePrompt, TemplateAnalysisRule } from '@shared/schema';

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
  // Template-specific analysis results
  templateAnalysis?: {
    templateId: string;
    templateName: string;
    missingClauses: Array<{
      clauseId: string;
      name: string;
      importance: 'required' | 'recommended';
      description: string;
    }>;
    identifiedClauses: Array<{
      clauseId: string;
      name: string;
      status: 'complete' | 'incomplete' | 'problematic';
      issues?: string[];
    }>;
    validationResults: Array<{
      ruleName: string;
      status: 'passed' | 'failed' | 'warning';
      message: string;
      recommendation?: string;
    }>;
    templateSpecificRisks: Array<{
      category: string;
      level: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      mitigation: string;
    }>;
    complianceScore: number;
  };
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

  private async getTemplateSpecificPrompt(
    templateData: {
      template: DocumentTemplate;
      prompts: TemplatePrompt[];
      analysisRules: TemplateAnalysisRule[];
      requiredClauses: LegalClause[];
      optionalClauses: LegalClause[];
    },
    aiProvider: string
  ): Promise<string> {
    const { template, prompts, analysisRules, requiredClauses, optionalClauses } = templateData;
    
    // Find prompts for this AI provider
    const applicablePrompts = prompts.filter(p => 
      p.aiProvider === aiProvider || p.aiProvider === 'all'
    ).sort((a, b) => a.priority - b.priority);

    let templatePrompt = `You are analyzing a ${template.name} document. This analysis requires specialized attention to specific clauses and validation rules.

DOCUMENT TYPE: ${template.category} - ${template.subcategory}
DESCRIPTION: ${template.description}

REQUIRED CLAUSES CHECKLIST:
${requiredClauses.map(clause => `- ${clause.name}: ${clause.description}`).join('\n')}

RECOMMENDED CLAUSES:
${optionalClauses.map(clause => `- ${clause.name}: ${clause.description}`).join('\n')}

VALIDATION RULES TO APPLY:
${analysisRules.map(rule => `- ${rule.ruleName}: ${rule.errorMessage}`).join('\n')}

TEMPLATE-SPECIFIC ANALYSIS REQUIREMENTS:
${applicablePrompts.map(prompt => prompt.promptText).join('\n\n')}

Return analysis in JSON format with the following enhanced structure that includes template-specific findings:
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
  "riskLevel": "medium",
  "templateAnalysis": {
    "templateId": "${template.templateId}",
    "templateName": "${template.name}",
    "missingClauses": [
      {
        "clauseId": "clause_id",
        "name": "Clause Name",
        "importance": "required|recommended",
        "description": "Why this clause is important"
      }
    ],
    "identifiedClauses": [
      {
        "clauseId": "clause_id", 
        "name": "Clause Name",
        "status": "complete|incomplete|problematic",
        "issues": ["Any issues found with this clause"]
      }
    ],
    "validationResults": [
      {
        "ruleName": "Rule Name",
        "status": "passed|failed|warning", 
        "message": "Validation result message",
        "recommendation": "How to fix if failed"
      }
    ],
    "templateSpecificRisks": [
      {
        "category": "Risk Category",
        "level": "low|medium|high|critical",
        "description": "Risk description",
        "mitigation": "How to mitigate this risk"
      }
    ],
    "complianceScore": 85
  }
}`;

    return templatePrompt;
  }

  async loadTemplateData(templateId: string, aiProvider: string): Promise<{
    template: DocumentTemplate;
    prompts: TemplatePrompt[];
    analysisRules: TemplateAnalysisRule[];
    requiredClauses: LegalClause[];
    optionalClauses: LegalClause[];
  } | null> {
    try {
      const templateData = await storage.getTemplateWithPrompts(templateId, aiProvider);
      return templateData || null;
    } catch (error) {
      console.error(`Error loading template data for ${templateId}:`, error);
      return null;
    }
  }

  async analyzeWithOpenAI(content: string, analysisType: string, apiKey?: string, templateData?: any): Promise<AnalysisResult> {
    const client = apiKey ? new OpenAI({ apiKey }) : this.openai;
    if (!client) throw new Error("OpenAI API key not configured");

    // Use template-specific prompt if available, otherwise use standard prompt
    const systemPrompt = templateData 
      ? await this.getTemplateSpecificPrompt(templateData, 'openai')
      : this.getSystemPrompt(analysisType);

    const response = await client.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        {
          role: "system",
          content: systemPrompt
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

  async analyzeWithAnthropic(content: string, analysisType: string, apiKey?: string, templateData?: any): Promise<AnalysisResult> {
    const client = apiKey ? new Anthropic({ apiKey }) : this.anthropic;
    if (!client) throw new Error("Anthropic API key not configured");

    // Use template-specific prompt if available, otherwise use standard prompt
    const systemPrompt = templateData 
      ? await this.getTemplateSpecificPrompt(templateData, 'anthropic')
      : this.getSystemPrompt(analysisType);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514", // newest Anthropic model
      system: systemPrompt,
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

  async analyzeWithGemini(content: string, analysisType: string, apiKey?: string, templateData?: any): Promise<AnalysisResult> {
    const client = apiKey ? new GoogleGenAI({ apiKey }) : this.gemini;
    if (!client) throw new Error("Gemini API key not configured");

    // Use template-specific prompt if available, otherwise use standard prompt
    const systemPrompt = templateData 
      ? await this.getTemplateSpecificPrompt(templateData, 'gemini')
      : this.getSystemPrompt(analysisType);

    const response = await client.models.generateContent({
      model: "gemini-2.5-pro", // newest Gemini model
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: `Please analyze the following legal document:\n\n${content}`,
    });

    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResult;
  }

  async analyzeWithFreeAI(content: string, analysisType: string, templateData?: any): Promise<AnalysisResult> {
    // Simplified analysis for free tier with basic template support
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    const wordCount = content.split(' ').length;
    const hasContracts = content.toLowerCase().includes('contrato') || content.toLowerCase().includes('contract');
    const hasLegalTerms = /\b(lei|artigo|parágrafo|cláusula|disposição)\b/i.test(content);
    
    let baseResult = {
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
      riskLevel: wordCount > 3000 ? 'medium' : 'low' as 'low' | 'medium' | 'high' | 'critical'
    };

    // Add basic template analysis if template data is provided
    if (templateData) {
      baseResult.summary += ` Análise baseada no template: ${templateData.template.name}.`;
      (baseResult as any).templateAnalysis = {
        templateId: templateData.template.templateId,
        templateName: templateData.template.name,
        missingClauses: [], // Free tier doesn't provide detailed clause analysis
        identifiedClauses: [],
        validationResults: [{
          ruleName: "Análise Básica",
          status: "warning",
          message: "Análise básica realizada. Use análise premium para validação completa de template.",
          recommendation: "Upgrade para análise detalhada com validação de cláusulas específicas"
        }],
        templateSpecificRisks: [{
          category: "Limitações da Análise Gratuita",
          level: "medium",
          description: "Análise gratuita não incluiu validação específica de template",
          mitigation: "Considere upgrade para análise premium com validação completa"
        }],
        complianceScore: 50
      };
    }

    return baseResult as AnalysisResult;
  }

  getProviderCredits(provider: string, analysisType: string = 'general'): number {
    // Tiered pricing structure based on analysis complexity
    const tierMultipliers = {
      'general': 1.0,       // Basic analysis
      'contract': 1.5,      // Advanced contract analysis  
      'legal': 1.5,         // Advanced legal document analysis
      'compliance': 2.0,    // Most complex compliance analysis
      'template': 1.8       // Template-specific analysis with validation
    };

    const baseCredits = {
      'openai-gpt4': 2,
      'openai-gpt5': 3,
      'anthropic-claude': 3,
      'gemini-pro': 1,
      'gemini-flash': 1,
      'openrouter': 2,
      'free': 0
    };

    const base = baseCredits[provider as keyof typeof baseCredits] || 1;
    const multiplier = tierMultipliers[analysisType as keyof typeof tierMultipliers] || 1.0;
    
    // Calculate final credits and round up to ensure we always cover costs
    const finalCredits = Math.ceil(base * multiplier);
    
    return finalCredits;
  }

  async analyzeDocument(
    content: string,
    analysisType: string,
    provider: string,
    model: string,
    apiKey?: string,
    templateId?: string
  ): Promise<AnalysisResult> {
    try {
      // Load template data if templateId is provided
      let templateData = null;
      if (templateId) {
        templateData = await this.loadTemplateData(templateId, provider);
        // Use template analysis type for pricing calculation
        analysisType = 'template';
      }

      switch (provider) {
        case 'openai':
          return await this.analyzeWithOpenAI(content, analysisType, apiKey, templateData);
        case 'anthropic':
          return await this.analyzeWithAnthropic(content, analysisType, apiKey, templateData);
        case 'gemini':
          return await this.analyzeWithGemini(content, analysisType, apiKey, templateData);
        case 'free':
          return await this.analyzeWithFreeAI(content, analysisType, templateData);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error: any) {
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
  }

  // Helper method to get analysis type display name and description
  getAnalysisTypeInfo(analysisType: string): { name: string; description: string; credits: string } {
    const typeInfo = {
      'general': {
        name: 'Análise Geral',
        description: 'Análise básica de documentos jurídicos',
        credits: 'Baixo custo'
      },
      'contract': {
        name: 'Análise de Contratos',
        description: 'Análise detalhada de cláusulas e termos contratuais',
        credits: 'Custo médio'
      },
      'legal': {
        name: 'Análise Jurídica',
        description: 'Análise especializada de petições e documentos legais',
        credits: 'Custo médio'
      },
      'compliance': {
        name: 'Análise de Conformidade',
        description: 'Verificação completa de compliance regulatório',
        credits: 'Alto custo'
      },
      'template': {
        name: 'Análise com Template',
        description: 'Validação específica baseada em modelo predefinido',
        credits: 'Custo premium'
      }
    };

    return typeInfo[analysisType as keyof typeof typeInfo] || typeInfo.general;
  }
}

export const aiService = new AIService();
