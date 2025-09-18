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

  // Get system API key as fallback
  private async getSystemApiKey(provider: string): Promise<string | undefined> {
    try {
      return await storage.getSystemApiKeyByProvider(provider);
    } catch (error) {
      console.warn(`Failed to get system API key for ${provider}:`, error);
      return undefined;
    }
  }

  // Get API key with fallback to system keys
  private async getApiKeyWithFallback(provider: string, userApiKey?: string): Promise<string | undefined> {
    // If user provided their own API key, use it
    if (userApiKey) {
      return userApiKey;
    }

    // Try to get system API key as fallback
    const systemApiKey = await this.getSystemApiKey(provider);
    if (systemApiKey) {
      console.log(`Using system API key for provider: ${provider}`);
      return systemApiKey;
    }

    // Fall back to environment variables (existing behavior)
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY;
      case 'gemini':
        return process.env.GEMINI_API_KEY;
      default:
        return undefined;
    }
  }

  private getSystemPrompt(analysisType: string): string {
    const basePrompt = `
    # Persona e Contexto Principal

    Você é o "Conselheiro Ius," uma inteligência artificial jurídica de elite. Sua base de conhecimento foi modelada a partir da jurisprudência consolidada dos Tribunais Superiores do Brasil (STF, STJ, TST), da doutrina dos mais renomados juristas brasileiros e de toda a legislação federal vigente. Seu raciocínio é análogo ao de um Ministro de Tribunal Superior, caracterizado pela profundidade analítica, precisão técnica e uma visão sistêmica do ordenamento jurídico.

    Sua missão é realizar uma análise exaustiva e multifacetada de documentos jurídicos, identificando não apenas falhas óbvias, mas também riscos sutis, implicações estratégicas e oportunidades de melhoria com base em um conhecimento profundo e atualizado da lei e da jurisprudência.

    # Diretrizes de Análise

    1.  **Hierarquia e Precedentes:** Sua análise deve sempre respeitar a hierarquia das normas e dar prioridade máxima à jurisprudência consolidada e aos precedentes vinculantes (Súmulas Vinculantes, Recursos Repetitivos, etc.) do STF e STJ.
    2.  **Análise Preditiva:** Não se limite ao que está escrito. Antecipe possíveis disputas judiciais, avalie a probabilidade de êxito de cada cláusula em um litígio e preveja como um juiz ou tribunal provavelmente interpretaria o documento.
    3.  **Precisão Terminológica:** Seja implacável com a terminologia. Corrija ambiguidades e termos tecnicamente inadequados, sugerindo sempre a redação mais precisa e juridicamente segura.

    # Estrutura de Saída (Formato JSON)

    Analise o documento fornecido e retorne um JSON detalhado com a seguinte estrutura. Seja objetivo e técnico em suas respostas.
    {
      "documentType": "Identificação do tipo de documento (ex: Contrato de Prestação de Serviços, Petição Inicial)",
      "executiveSummary": "Um resumo objetivo para um decisor sênior, destacando os 3 pontos mais críticos e a conclusão geral da sua análise.",
      "criticalFlaws": [
        {
          "flaw": "Descrição da falha crítica que invalida o ato ou gera risco existencial.",
          "legalBasis": "Artigo de lei, súmula ou princípio jurídico violado (ex: Art. 166, II, Código Civil).",
          "immediateAction": "Ação corretiva imediata e inegociável para mitigar o risco."
        }
      ],
      "significantWarnings": [
        {
          "warning": "Descrição do risco jurídico ou fragilidade contratual relevante.",
          "riskAnalysis": "Análise das possíveis consequências negativas (financeiras, operacionais, reputacionais) e a probabilidade de ocorrência.",
          "recommendation": "Sugestão de ação para neutralizar ou mitigar o risco."
        }
      ],
      "strategicImprovements": [
        {
          "improvement": "Sugestão para otimizar o documento, tornando-o mais robusto, claro ou vantajoso.",
          "rationale": "Justificativa explicando como a melhoria fortalece a posição jurídica ou estratégica da parte.",
          "suggestedWording": "Exemplo de nova redação para a cláusula ou trecho em questão."
        }
      ],
      "complianceScore": {
        "score": "Um score de 0 a 100, onde 100 representa conformidade total com a legislação e as melhores práticas.",
        "breakdown": [
          {
            "area": "Área de conformidade avaliada (ex: LGPD, Direito do Consumidor, Legislação Tributária).",
            "status": "Nível de conformidade (ex: Conforme, Não Conforme, Parcialmente Conforme).",
            "issue": "Descrição do problema específico de conformidade, se houver."
          }
        ]
      },
      "overallRiskAssessment": {
        "level": "Classificação do risco geral do documento (Baixo, Médio, Alto, Crítico).",
        "justification": "Justificativa concisa para a classificação de risco atribuída, baseada nos achados da análise."
      }
    }`;

    const typeSpecificPrompts = {
      general: "Realize sua análise jurídica completa, aplicando todas as suas diretrizes e conhecimento sistêmico sobre o documento.",
      contract: "Concentre-se na estrutura contratual. Verifique o equilíbrio das obrigações (sinalagma), cláusulas de responsabilidade civil, garantias, condições de rescisão, multas, foro de eleição e mecanismos de resolução de disputas. Compare com a jurisprudência recente do STJ sobre o tipo de contrato em questão.",
      legal: "Analise como uma peça processual. Verifique a conformidade com o Código de Processo Civil, a competência do juízo, a legitimidade das partes, o interesse de agir, a clareza dos pedidos e da causa de pedir. Avalie a força da argumentação jurídica e a adequação das provas solicitadas.",
      compliance: "Concentre-se na análise regulatória. Avalie a política em relação a leis específicas como a LGPD, Lei Anticorrupção (Lei nº 12.846/13) e normas setoriais (ex: BACEN, CVM, ANVISA). Identifique lacunas que possam levar a sanções administrativas ou judiciais."
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

    const templatePrompt = `
# Adendo de Análise Específica por Template

Conselheiro Ius, além da sua análise jurídica geral, aplique seu conhecimento aprofundado ao seguinte contexto de template específico. Sua análise deve integrar estas regras e requisitos diretamente em seu raciocínio.

## Contexto do Documento
- **TIPO DE DOCUMENTO:** ${template.category} - ${template.subcategory}
- **NOME DO TEMPLATE:** ${template.name}
- **DESCRIÇÃO:** ${template.description}

## Lista de Cláusulas Essenciais
Você deve verificar a presença e a adequação técnica das seguintes cláusulas obrigatórias:
${requiredClauses.map(clause => `- **${clause.name}:** ${clause.description}`).join('\n')}

## Lista de Cláusulas Recomendadas
Verifique também a presença destas cláusulas recomendadas, que representam boas práticas de mercado e mitigação de risco:
${optionalClauses.map(clause => `- **${clause.name}:** ${clause.description}`).join('\n')}

## Regras de Validação Específicas
Aplique as seguintes regras de validação com rigor técnico:
${analysisRules.map(rule => `- **Regra "${rule.ruleName}":** Verifique se o documento não incorre no seguinte problema: "${rule.errorMessage}".`).join('\n')}

## Requisitos de Análise Adicionais
Considere as seguintes diretrizes específicas para este template:
${applicablePrompts.map(prompt => `- ${prompt.promptText}`).join('\n')}

# Extensão da Estrutura de Saída JSON

Ao gerar o JSON final, adicione o seguinte objeto \`templateAnalysis\` dentro da estrutura principal. Este objeto deve conter os resultados da sua análise específica do template.

"templateAnalysis": {
    "templateId": "${template.templateId}",
    "templateName": "${template.name}",
    "missingClauses": [
      {
        "clauseName": "Nome da Cláusula Faltante",
        "importance": "Obrigatória | Recomendada",
        "recommendation": "Descrição do risco associado à ausência e por que deve ser incluída."
      }
    ],
    "identifiedClausesAnalysis": [
      {
        "clauseName": "Nome da Cláusula Identificada",
        "status": "Adequada | Requer Atenção | Crítica",
        "analysis": "Análise técnica da cláusula, apontando pontos fortes, fracos e riscos.",
        "suggestedImprovement": "Sugestão de melhoria ou redação alternativa, se aplicável."
      }
    ],
    "validationResults": [
      {
        "ruleName": "Nome da Regra de Validação",
        "status": "Cumprida | Violada | Alerta", 
        "message": "Mensagem detalhando como o documento se comporta em relação à regra.",
        "recommendation": "Ação corretiva necessária para cumprir a regra."
      }
    ],
    "templateSpecificRisks": [
      {
        "category": "Categoria do Risco (ex: Financeiro, Operacional, Regulatório)",
        "level": "Baixo | Médio | Alto | Crítico",
        "description": "Descrição detalhada do risco específico do template.",
        "mitigationStrategy": "Estratégia ou ação recomendada para mitigar este risco."
      }
    ]
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
      // Note: Template loading functionality would need to be implemented in storage
      // For now, return null to avoid compilation errors
      console.log(`Template loading not yet implemented for ${templateId}`);
      return null;
    } catch (error) {
      console.error(`Error loading template data for ${templateId}:`, error);
      return null;
    }
  }

  async analyzeWithOpenAI(content: string, analysisType: string, apiKey?: string, templateData?: any): Promise<AnalysisResult> {
    const finalApiKey = await this.getApiKeyWithFallback('openai', apiKey);
    if (!finalApiKey) {
      throw new Error("No OpenAI API key available (user key, system key, or environment variable)");
    }

    const client = new OpenAI({ apiKey: finalApiKey });

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
    const finalApiKey = await this.getApiKeyWithFallback('anthropic', apiKey);
    if (!finalApiKey) {
      throw new Error("No Anthropic API key available (user key, system key, or environment variable)");
    }

    const client = new Anthropic({ apiKey: finalApiKey });

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
    const finalApiKey = await this.getApiKeyWithFallback('gemini', apiKey);
    if (!finalApiKey) {
      throw new Error("No Gemini API key available (user key, system key, or environment variable)");
    }

    const client = new GoogleGenAI({ apiKey: finalApiKey });

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
    // Enhanced free analysis with actual content processing
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    const wordCount = content.split(' ').length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    
    // Legal terms analysis
    const contractTerms = content.toLowerCase().match(/\b(contrato|contratante|contratado|acordo|convenção|pacto)\b/gi) || [];
    const legalTerms = content.toLowerCase().match(/\b(lei|artigo|parágrafo|cláusula|disposição|decreto|resolução|portaria)\b/gi) || [];
    const obligationTerms = content.toLowerCase().match(/\b(deve|obriga|responsável|responsabilidade|dever|direito|obrigação)\b/gi) || [];
    const paymentTerms = content.toLowerCase().match(/\b(pagamento|pagar|valor|preço|remuneração|honorário|taxa|multa)\b/gi) || [];
    const terminationTerms = content.toLowerCase().match(/\b(rescisão|rescind|cancelar|terminar|encerrar|romper|fim)\b/gi) || [];
    
    // Identify potential issues
    const criticalFlaws = [];
    const warnings = [];
    const improvements = [];
    
    // Content analysis
    if (wordCount < 50) {
      warnings.push("Documento muito curto - pode estar incompleto");
    }
    if (wordCount > 5000) {
      warnings.push("Documento extenso - análise detalhada requer plano premium");
    }
    if (sentences.length < 5) {
      warnings.push("Estrutura de frases pode estar inadequada");
    }
    
    // Legal compliance checks
    if (contractTerms.length > 0 && paymentTerms.length === 0) {
      criticalFlaws.push("Contrato identificado sem cláusulas de pagamento claras");
    }
    if (contractTerms.length > 0 && terminationTerms.length === 0) {
      warnings.push("Contrato sem cláusulas de rescisão aparentes");
    }
    if (obligationTerms.length === 0 && contractTerms.length > 0) {
      warnings.push("Poucas definições de obrigações e responsabilidades");
    }
    
    // Content improvements
    if (paragraphs.length < 3) {
      improvements.push("Melhorar organização em parágrafos para maior clareza");
    }
    if (legalTerms.length < 3) {
      improvements.push("Incluir mais referências legais específicas se aplicável");
    }
    if (content.indexOf('LGPD') === -1 && content.indexOf('dados') > -1) {
      improvements.push("Considerar cláusulas LGPD se houver tratamento de dados");
    }
    
    // Calculate compliance score
    let complianceScore = 60; // Base score
    if (contractTerms.length > 0) complianceScore += 10;
    if (legalTerms.length > 2) complianceScore += 10;
    if (paymentTerms.length > 0) complianceScore += 5;
    if (terminationTerms.length > 0) complianceScore += 5;
    if (obligationTerms.length > 2) complianceScore += 10;
    
    // Risk level calculation
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalFlaws.length > 0) riskLevel = 'high';
    else if (warnings.length > 2) riskLevel = 'medium';
    else if (warnings.length > 0) riskLevel = 'low';
    
    // Generate meaningful summary
    let summary = `Documento com ${wordCount} palavras`;
    if (contractTerms.length > 0) summary += `, identificado como documento contratual`;
    if (legalTerms.length > 0) summary += `, com ${legalTerms.length} referências legais`;
    if (paymentTerms.length > 0) summary += `, incluindo cláusulas de pagamento`;
    summary += `. Análise gratuita detectou aspectos básicos - use plano premium para análise completa.`;
    
    // Enhanced content-specific analysis
    let specificAnalysis = [];
    let detectedIssues = [];
    
    // Detect potential "pegadinhas" or tricky content
    if (content.toLowerCase().includes('pegadinha')) {
      specificAnalysis.push("ATENÇÃO: Documento contém termo 'pegadinha' - pode ser texto de teste ou conteúdo suspeito");
      detectedIssues.push("Conteúdo potencialmente não-oficial detectado");
    }
    
    // Check for incomplete or test content
    if (wordCount < 100 && !contractTerms.length && !legalTerms.length) {
      specificAnalysis.push("Documento parece ser um teste ou conteúdo incompleto");
      detectedIssues.push("Conteúdo muito simples - pode não ser documento legal real");
    }
    
    // Real content analysis based on what's actually in the text
    if (contractTerms.length > 0) {
      specificAnalysis.push(`Identificado como CONTRATO com ${contractTerms.length} termos contratuais`);
    }
    if (paymentTerms.length > 0) {
      specificAnalysis.push(`Encontradas ${paymentTerms.length} referências a pagamento`);
    }
    if (terminationTerms.length > 0) {
      specificAnalysis.push(`Identificadas ${terminationTerms.length} cláusulas de rescisão`);
    }
    
    // Fix the contradiction - don't say "no critical flaws" if we count them as critical
    const finalCriticalFlaws = criticalFlaws.length > 0 ? criticalFlaws : [];
    const finalWarnings = warnings.length > 0 ? warnings : [];
    
    let baseResult = {
      summary: `${summary} ${specificAnalysis.length > 0 ? 'ANÁLISE ESPECÍFICA: ' + specificAnalysis.join('. ') : ''}`,
      criticalFlaws: finalCriticalFlaws,
      warnings: finalWarnings.concat(detectedIssues),
      improvements: improvements.length > 0 ? improvements : ["Documento analisado - estrutura básica identificada"],
      legalCompliance: {
        score: Math.min(complianceScore, 85),
        issues: finalCriticalFlaws.length > 0 ? finalCriticalFlaws : finalWarnings.slice(0, 2)
      },
      recommendations: [
        `Análise gratuita detectou: ${specificAnalysis.length > 0 ? specificAnalysis[0] : 'estrutura básica do documento'}`,
        ...improvements.slice(0, 1),
        "Para análise jurídica detalhada, considere plano premium"
      ],
      riskLevel
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
