import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { FileText, AlertTriangle, Clock, CheckCircle, Eye, Coins } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface AnalysisResult {
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

interface DocumentAnalysis {
  id: string;
  title: string;
  content: string;
  aiProvider: string;
  aiModel: string;
  analysisType: string;
  result: AnalysisResult;
  creditsUsed: number;
  status: string;
  createdAt: string;
}

export default function Analyses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const { data: analyses = [], isLoading } = useQuery<DocumentAnalysis[]>({
    queryKey: ['/api/analyses'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analyses');
      return response.json();
    }
  });

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Todas as Análises
            </h1>
            <p className="text-muted-foreground mt-2">
              Histórico completo das suas análises de documentos jurídicos
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" data-testid="button-back-dashboard">
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma análise encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não fez nenhuma análise de documento. Comece agora!
              </p>
              <Link href="/dashboard">
                <Button data-testid="button-start-analysis">
                  Fazer Primeira Análise
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-md transition-shadow" data-testid={`card-analysis-${analysis.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 line-clamp-2" data-testid={`text-analysis-title-${analysis.id}`}>
                        {analysis.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} />
                        <span>{new Date(analysis.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <Badge 
                      className={getRiskBadgeColor(analysis.result.riskLevel)} 
                      data-testid={`badge-risk-${analysis.id}`}
                    >
                      {analysis.result.riskLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Resumo</p>
                      <p className="text-sm line-clamp-2" data-testid={`text-summary-${analysis.id}`}>
                        {analysis.result.summary}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Provedor:</span>
                        <span className="font-medium">{analysis.aiProvider}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{analysis.creditsUsed}</span>
                      </div>
                    </div>

                    {analysis.result.criticalFlaws.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertTriangle size={14} />
                        <span>{analysis.result.criticalFlaws.length} falha(s) crítica(s)</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-muted-foreground">
                            Score: {analysis.result.legalCompliance.score}%
                          </span>
                        </div>
                      </div>
                      
                      <Link href={`/analyses/${analysis.id}`}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-view-analysis-${analysis.id}`}
                        >
                          <Eye size={14} className="mr-1" />
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}