import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Trash2, RotateCcw, Clock, Coins, AlertTriangle, FileText } from 'lucide-react';

interface DeletedAnalysis {
  id: string;
  title: string;
  content: string;
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
      issues: string[];
    };
  };
  createdAt: string;
  deletedAt: string;
}

export default function Trash() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const { data: deletedAnalyses = [], isLoading } = useQuery<DeletedAnalysis[]>({
    queryKey: ['/api/analyses/trash/list'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analyses/trash/list');
      return response.json();
    },
    enabled: !!user
  });

  const restoreAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await apiRequest('POST', `/api/analyses/${analysisId}/restore`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Análise Restaurada",
        description: "A análise foi restaurada com sucesso e está disponível novamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses/trash/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      setShowRestoreDialog(false);
      setSelectedAnalysisId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Restaurar",
        description: error.message || "Erro inesperado ao restaurar análise",
        variant: "destructive",
      });
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const sevenDaysLater = new Date(deletedDate);
    sevenDaysLater.setDate(deletedDate.getDate() + 7);
    
    const now = new Date();
    const diffTime = sevenDaysLater.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-trash-title">
            Lixeira
          </h1>
          <p className="text-muted-foreground" data-testid="text-trash-description">
            Análises excluídas são mantidas por 7 dias antes da exclusão permanente
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && deletedAnalyses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Trash2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Lixeira Vazia</h2>
              <p className="text-muted-foreground">
                Nenhuma análise excluída encontrada. Análises excluídas aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && deletedAnalyses.length > 0 && (
          <div className="space-y-4">
            {deletedAnalyses.map((analysis) => {
              const daysLeft = getDaysUntilPermanentDelete(analysis.deletedAt);
              return (
                <Card key={analysis.id} className="border-red-200 dark:border-red-800" data-testid={`card-deleted-analysis-${analysis.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg" data-testid={`text-analysis-title-${analysis.id}`}>
                            {analysis.title}
                          </h3>
                          <Badge 
                            className={getRiskBadgeColor(analysis.result.riskLevel)}
                            data-testid={`badge-risk-${analysis.id}`}
                          >
                            {analysis.result.riskLevel}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              <span>Excluído em: {formatDate(analysis.deletedAt)}</span>
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
                          
                          <div className="flex items-center gap-2 mt-2">
                            {daysLeft > 0 ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span className="text-orange-600 dark:text-orange-400 font-medium">
                                  Será excluída permanentemente em {daysLeft} dia{daysLeft > 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  Será excluída permanentemente em breve
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Dialog open={showRestoreDialog && selectedAnalysisId === analysis.id} onOpenChange={setShowRestoreDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAnalysisId(analysis.id)}
                            data-testid={`button-restore-${analysis.id}`}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          >
                            <RotateCcw size={14} className="mr-2" />
                            Restaurar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar Restauração</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja restaurar esta análise? Ela voltará para sua lista de análises ativas.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setShowRestoreDialog(false);
                                setSelectedAnalysisId(null);
                              }}
                              data-testid="button-cancel-restore"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              onClick={() => restoreAnalysisMutation.mutate(analysis.id)}
                              disabled={restoreAnalysisMutation.isPending}
                              data-testid="button-confirm-restore"
                            >
                              {restoreAnalysisMutation.isPending ? 'Restaurando...' : 'Restaurar Análise'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}