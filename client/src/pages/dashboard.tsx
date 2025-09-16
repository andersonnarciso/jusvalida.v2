import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { AIProviderSelector } from '@/components/ui/ai-provider-selector';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FileText, AlertTriangle, Clock, Coins, Eye, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { AiProviderConfig } from '@shared/schema';

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

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [currentTab, setCurrentTab] = useState('upload');

  if (!user) {
    setLocation('/login');
    return null;
  }

  const { data: recentAnalyses = [], isLoading: analysesLoading } = useQuery<DocumentAnalysis[]>({
    queryKey: ['/api/analyses'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analyses?limit=5');
      return response.json();
    }
  });

  const { data: aiProviderConfigs = [] } = useQuery<AiProviderConfig[]>({
    queryKey: ['/api/ai-provider-configs'],
  });

  // Set default selectedProvider when aiProviderConfigs loads
  useEffect(() => {
    if (aiProviderConfigs.length > 0 && !selectedProvider) {
      // Prefer free providers, then popular ones, then first active one
      const freeProvider = aiProviderConfigs.find(config => config.isFree && config.isActive);
      const popularProvider = aiProviderConfigs.find(config => config.isPopular && config.isActive);
      const firstActiveProvider = aiProviderConfigs.find(config => config.isActive);
      
      const defaultProvider = freeProvider || popularProvider || firstActiveProvider;
      if (defaultProvider) {
        setSelectedProvider(defaultProvider.providerId);
      }
    }
  }, [aiProviderConfigs, selectedProvider]);

  // Function to get selected provider's credit cost dynamically
  const getSelectedProviderCredits = () => {
    const providerConfig = aiProviderConfigs.find(config => config.providerId === selectedProvider);
    return providerConfig ? providerConfig.credits : 0;
  };

  const analyzeDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/analyze', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Análise Concluída!",
        description: `Documento analisado com sucesso. ${data.creditsUsed} créditos utilizados.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      // Reset form
      setSelectedFile(null);
      setTextContent('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro na Análise",
        description: error.message || "Erro ao analisar documento",
        variant: "destructive",
      });
    }
  });

  const handleAnalyze = () => {
    if (!selectedFile && !textContent.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo ou cole o texto do documento",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name);
    } else {
      formData.append('content', textContent);
      formData.append('title', `Análise de Texto - ${new Date().toLocaleDateString()}`);
    }
    
    formData.append('analysisType', analysisType);
    formData.append('aiProvider', selectedProvider.split('-')[0]);
    formData.append('aiModel', selectedProvider.split('-').slice(1).join('-'));

    analyzeDocumentMutation.mutate(formData);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskLevelBg = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome-title">
            Bem-vindo de volta, {user.firstName}!
          </h1>
          <p className="text-muted-foreground" data-testid="text-welcome-description">
            Analise seus documentos jurídicos com inteligência artificial avançada.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Documentos Analisados</p>
                  <p className="text-2xl font-bold" data-testid="text-stat-documents">
                    {recentAnalyses.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Falhas Críticas</p>
                  <p className="text-2xl font-bold text-destructive" data-testid="text-stat-critical-flaws">
                    {recentAnalyses.reduce((acc, analysis) => acc + (analysis.result?.criticalFlaws?.length || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Tempo Economizado</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-stat-time-saved">
                    {Math.round(recentAnalyses.reduce((acc, analysis) => acc + (analysis.creditsUsed * 0.5), 0) * 10) / 10}h
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-green-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Créditos Restantes</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-stat-credits">
                    {user.credits}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Coins className="text-primary" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle data-testid="text-analyze-title">Analisar Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Provider Selection */}
            <AIProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              userCredits={user.credits}
            />

            {/* Upload Tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList>
                <TabsTrigger value="upload" data-testid="tab-upload">
                  Upload de Arquivo
                </TabsTrigger>
                <TabsTrigger value="paste" data-testid="tab-paste">
                  Colar Texto
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-6">
                <FileUpload
                  selectedFile={selectedFile || undefined}
                  onFileSelect={setSelectedFile}
                  onFileRemove={() => setSelectedFile(null)}
                />
              </TabsContent>
              
              <TabsContent value="paste" className="mt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Cole o texto do seu documento aqui..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="min-h-64 resize-none"
                    data-testid="textarea-content"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Máximo 10.000 caracteres para usuários gratuitos</span>
                    <span data-testid="text-character-count">
                      {textContent.length} / 10,000
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Analysis Options */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Tipo de Análise</Label>
              <RadioGroup value={analysisType} onValueChange={setAnalysisType}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="general" id="general" />
                    <div>
                      <Label htmlFor="general" className="font-medium cursor-pointer">
                        Análise Geral
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Verificação completa de falhas, brechas e melhorias
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="contract" id="contract" />
                    <div>
                      <Label htmlFor="contract" className="font-medium cursor-pointer">
                        Contrato Específico
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Análise focada em cláusulas contratuais
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="legal" id="legal" />
                    <div>
                      <Label htmlFor="legal" className="font-medium cursor-pointer">
                        Peça Jurídica
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Verificação de petições e documentos processuais
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="compliance" id="compliance" />
                    <div>
                      <Label htmlFor="compliance" className="font-medium cursor-pointer">
                        Conformidade Legal
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Análise de adequação à legislação vigente
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={handleAnalyze}
              disabled={analyzeDocumentMutation.isPending || (!selectedFile && !textContent.trim())}
              className="w-full md:w-auto"
              data-testid="button-analyze"
            >
              {analyzeDocumentMutation.isPending ? (
                "Analisando..."
              ) : (
                `Analisar Documento (${getSelectedProviderCredits()} créditos)`
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle data-testid="text-recent-title">Análises Recentes</CardTitle>
              <Link href="/analyses">
                <Button variant="ghost" size="sm" data-testid="button-view-all">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {analysesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border border-border rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-analyses">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma análise encontrada</p>
                <p className="text-sm">Faça upload do seu primeiro documento para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    data-testid={`card-analysis-${analysis.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="text-primary" size={20} />
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`text-analysis-title-${analysis.id}`}>
                          {analysis.title}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-analysis-meta-${analysis.id}`}>
                          {formatDate(analysis.createdAt)} • {analysis.aiProvider} {analysis.aiModel}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {analysis.result?.criticalFlaws?.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {analysis.result.criticalFlaws.length} críticas
                          </Badge>
                        )}
                        {analysis.result?.warnings?.length > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            {analysis.result.warnings.length} alertas
                          </Badge>
                        )}
                        {analysis.result?.improvements?.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {analysis.result.improvements.length} melhorias
                          </Badge>
                        )}
                        {analysis.result?.riskLevel && (
                          <Badge className={`text-xs ${getRiskLevelBg(analysis.result.riskLevel)}`}>
                            {analysis.result.riskLevel === 'low' && 'Baixo risco'}
                            {analysis.result.riskLevel === 'medium' && 'Médio risco'}
                            {analysis.result.riskLevel === 'high' && 'Alto risco'}
                            {analysis.result.riskLevel === 'critical' && 'Crítico'}
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`button-view-analysis-${analysis.id}`}>
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
