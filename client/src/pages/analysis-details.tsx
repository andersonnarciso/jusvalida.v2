import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Coins, AlertTriangle, CheckCircle, FileText, Download, Share, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
interface DocumentAnalysis {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  documentContent: string;
  analysisType: string;
  aiProvider: string;
  aiModel: string;
  creditsUsed: number;
  result: {
    riskLevel: string;
    summary: string;
    criticalFlaws: string[];
    recommendations: string[];
    legalCompliance: {
      score: number;
      details: string;
    };
  };
  createdAt: string;
}

export default function AnalysisDetails() {
  const [match, params] = useRoute("/analyses/:id");
  const [showFullText, setShowFullText] = useState(false);
  const analysisId = params?.id;

  const { data: analysis, isLoading, error } = useQuery<DocumentAnalysis>({
    queryKey: ['/api/analyses', analysisId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analyses/${analysisId}`);
      return response.json();
    },
    enabled: !!analysisId
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
      case 'baixo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium':
      case 'médio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high':
      case 'alto':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'critical':
      case 'crítico':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-40 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/analyses">
            <Button variant="ghost" className="mb-6" data-testid="button-back-analyses">
              <ArrowLeft size={16} className="mr-2" />
              Voltar para Análises
            </Button>
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Análise não encontrada</h2>
              <p className="text-muted-foreground">Esta análise não existe ou você não tem permissão para acessá-la.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/analyses">
            <Button variant="ghost" data-testid="button-back-analyses">
              <ArrowLeft size={16} className="mr-2" />
              Voltar para Análises
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-share-analysis">
              <Share size={14} className="mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm" data-testid="button-download-analysis">
              <Download size={14} className="mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>

        {/* Analysis Header Card */}
        <Card className="mb-6" data-testid="card-analysis-header">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2" data-testid="text-analysis-title">
                  {analysis.title}
                </CardTitle>
                <CardDescription className="text-base">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{new Date(analysis.createdAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Provedor:</span>
                      <span>{analysis.aiProvider} - {analysis.aiModel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span>{analysis.creditsUsed} créditos</span>
                    </div>
                  </div>
                </CardDescription>
              </div>
              <Badge 
                className={getRiskBadgeColor(analysis.result.riskLevel)}
                data-testid="badge-risk-level"
              >
                Risco: {analysis.result.riskLevel}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Original Document */}
        <Card className="mb-6" data-testid="card-original-document">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Documento Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <strong>Fonte:</strong> {analysis.fileName || 'Texto colado'} 
                  {analysis.fileSize && analysis.fileSize > 0 && (
                    <>
                      {' • '}
                      <strong>Tamanho:</strong> {Math.round(analysis.fileSize / 1024)} KB
                    </>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFullText(!showFullText)}
                  data-testid="button-toggle-document-text"
                >
                  {showFullText ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span className="ml-2">{showFullText ? 'Ocultar' : 'Ver'} Texto</span>
                </Button>
              </div>
              
              {showFullText && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <p className="text-sm font-mono whitespace-pre-wrap" data-testid="text-document-content">
                    {analysis.documentContent}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary */}
          <Card data-testid="card-summary">
            <CardHeader>
              <CardTitle>Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed" data-testid="text-summary">
                {analysis.result.summary}
              </p>
            </CardContent>
          </Card>

          {/* Legal Compliance */}
          <Card data-testid="card-compliance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Conformidade Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Score Geral</span>
                  <Badge variant="secondary" data-testid="badge-compliance-score">
                    {analysis.result.legalCompliance.score}%
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p data-testid="text-compliance-details">{analysis.result.legalCompliance.details}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Flaws */}
        {analysis.result.criticalFlaws.length > 0 && (
          <Card className="mt-6 border-red-200 dark:border-red-800" data-testid="card-critical-flaws">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Problemas Críticos ({analysis.result.criticalFlaws.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.result.criticalFlaws.map((flaw: string, index: number) => (
                  <div key={index} className="flex gap-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100" data-testid={`text-critical-flaw-${index}`}>
                        {flaw}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {analysis.result.recommendations.length > 0 && (
          <Card className="mt-6" data-testid="card-recommendations">
            <CardHeader>
              <CardTitle>Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.result.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm" data-testid={`text-recommendation-${index}`}>
                        {recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Details */}
        <Card className="mt-6" data-testid="card-technical-details">
          <CardHeader>
            <CardTitle>Detalhes Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo de Análise:</span>
                <p className="font-medium">{analysis.analysisType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Provedor IA:</span>
                <p className="font-medium">{analysis.aiProvider}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Modelo:</span>
                <p className="font-medium">{analysis.aiModel}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Créditos:</span>
                <p className="font-medium">{analysis.creditsUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}