import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BatchJob, BatchStatistics, Template } from "@shared/schema";
import { Upload, FileText, X, Play, Calculator, AlertCircle, CheckCircle2, Clock, FileWarning } from "lucide-react";

interface BatchUploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}


export default function BatchProcessingPage() {
  const [selectedFiles, setSelectedFiles] = useState<BatchUploadFile[]>([]);
  const [batchName, setBatchName] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const [analysisType, setAnalysisType] = useState("");
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4");
  const [templateId, setTemplateId] = useState("");
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's batch jobs
  const { data: batchJobs = [], isLoading: loadingJobs } = useQuery<BatchJob[]>({
    queryKey: ['/api/batch/jobs'],
    enabled: true
  });

  // Fetch templates for dropdown
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/templates']
  });

  // Fetch batch statistics
  const { data: statistics } = useQuery<BatchStatistics>({
    queryKey: ['/api/batch/statistics']
  });

  // Calculate credits when files or settings change
  const calculateCredits = useCallback(() => {
    if (selectedFiles.length === 0 || !aiProvider || !aiModel) {
      setEstimatedCredits(0);
      return;
    }

    // Credit calculation based on provider and model
    const creditsPerDocument = getProviderCredits(`${aiProvider}-${aiModel}`);
    setEstimatedCredits(creditsPerDocument * selectedFiles.length);
  }, [selectedFiles.length, aiProvider, aiModel]);

  // Helper function to get credits per document (matches backend logic)
  const getProviderCredits = (providerModel: string): number => {
    const creditMap: Record<string, number> = {
      'openai-gpt-4': 5,
      'openai-gpt-3.5-turbo': 2,
      'anthropic-claude-3-opus': 6,
      'anthropic-claude-3-sonnet': 4,
      'gemini-gemini-pro': 3,
      'free-basic': 1
    };
    return creditMap[providerModel] || 1;
  };

  // Recalculate credits when dependencies change
  useEffect(() => {
    calculateCredits();
  }, [calculateCredits]);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: BatchUploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    calculateCredits();
    
    toast({
      title: "Files added",
      description: `Added ${acceptedFiles.length} files to batch`
    });
  }, [calculateCredits, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB per file
    maxFiles: 25, // UPDATED: Match backend limit (was 50)
    multiple: true
  });

  // Remove file from batch
  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    calculateCredits();
  };

  // Create batch job mutation
  const createBatchMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('POST', '/api/batch/create', data);
    },
    onSuccess: (result) => {
      toast({
        title: "Batch job created",
        description: `Batch "${batchName}" created successfully with ${selectedFiles.length} documents`
      });
      
      // Reset form
      setSelectedFiles([]);
      setBatchName("");
      setBatchDescription("");
      setAnalysisType("");
      setTemplateId("");
      
      // Refresh batch jobs list
      queryClient.invalidateQueries({ queryKey: ['/api/batch/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batch/statistics'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create batch job",
        description: error.message || "An error occurred while creating the batch job"
      });
    }
  });

  // Submit batch job
  const handleSubmit = async () => {
    if (!batchName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a batch name"
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select at least one file"
      });
      return;
    }

    if (!analysisType) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select an analysis type"
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', batchName);
    formData.append('description', batchDescription);
    formData.append('analysisType', analysisType);
    formData.append('aiProvider', aiProvider);
    formData.append('aiModel', aiModel);
    if (templateId && templateId !== "no-template") {
      formData.append('templateId', templateId);
    }

    selectedFiles.forEach(({ file }) => {
      formData.append('files', file);
    });

    createBatchMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed_with_errors':
        return <FileWarning className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed_with_errors':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Análise em Massa</h1>
        <p className="text-muted-foreground mt-2">
          Processe múltiplos documentos simultaneamente com análise de IA
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Lotes</CardDescription>
              <CardTitle className="text-2xl" data-testid="text-total-batches">{statistics.totalBatches}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concluídos</CardDescription>
              <CardTitle className="text-2xl text-green-600" data-testid="text-completed-batches">{statistics.completedBatches}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Documentos Processados</CardDescription>
              <CardTitle className="text-2xl" data-testid="text-documents-processed">{statistics.totalDocumentsProcessed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tempo Médio de Processamento</CardDescription>
              <CardTitle className="text-2xl" data-testid="text-avg-processing-time">
                {statistics.averageProcessingTime ? `${Math.round(statistics.averageProcessingTime)}s` : '0s'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Criar Novo Lote
            </CardTitle>
            <CardDescription>
              Faça upload de múltiplos documentos para processamento em lote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Batch Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="batch-name">Nome do Lote *</Label>
                <Input
                  id="batch-name"
                  data-testid="input-batch-name"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Digite o nome do lote"
                />
              </div>
              
              <div>
                <Label htmlFor="batch-description">Descrição</Label>
                <Textarea
                  id="batch-description"
                  data-testid="input-batch-description"
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  placeholder="Descrição opcional do lote"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="analysis-type">Tipo de Análise *</Label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger data-testid="select-analysis-type">
                      <SelectValue placeholder="Selecione o tipo de análise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="risk_assessment">Avaliação de Risco</SelectItem>
                      <SelectItem value="compliance_check">Verificação de Conformidade</SelectItem>
                      <SelectItem value="contract_review">Revisão de Contrato</SelectItem>
                      <SelectItem value="legal_summary">Resumo Jurídico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="template">Modelo (Opcional)</Label>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger data-testid="select-template">
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-template">Sem modelo</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai-provider">Provedor de IA</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger data-testid="select-ai-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-model">Modelo de IA</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger data-testid="select-ai-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiProvider === 'openai' && (
                        <>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </>
                      )}
                      {aiProvider === 'anthropic' && (
                        <>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        </>
                      )}
                      {aiProvider === 'gemini' && (
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* File Upload */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
              data-testid="dropzone-upload"
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? 'Solte os arquivos aqui' : 'Fazer Upload de Documentos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Arraste e solte arquivos aqui, ou clique para selecionar arquivos
              </p>
              <p className="text-sm text-muted-foreground">
                Suporta arquivos PDF, DOC, DOCX, TXT de até 50MB cada
              </p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Arquivos Selecionados ({selectedFiles.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map(({ file, id, status }) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      data-testid={`file-item-${id}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(id)}
                        data-testid={`button-remove-file-${id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Estimation */}
            {selectedFiles.length > 0 && (
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Créditos Estimados: <strong>{estimatedCredits}</strong></span>
                    <span className="text-sm text-muted-foreground">
                      {getProviderCredits(`${aiProvider}-${aiModel}`)} créditos × {selectedFiles.length} arquivos
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || !batchName.trim() || !analysisType || createBatchMutation.isPending}
              className="w-full"
              data-testid="button-create-batch"
            >
              <Play className="h-4 w-4 mr-2" />
              {createBatchMutation.isPending ? 'Criando Lote...' : `Criar Lote (${estimatedCredits} créditos)`}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Batches */}
        <Card>
          <CardHeader>
            <CardTitle>Lotes Recentes</CardTitle>
            <CardDescription>
              Seus trabalhos de processamento em lote recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : batchJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum lote ainda</p>
                <p className="text-sm">Crie seu primeiro lote para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {batchJobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border rounded-lg space-y-2"
                    data-testid={`batch-job-${job.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{job.name}</h4>
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{job.totalDocuments} documentos</span>
                      <span>{job.totalCreditsUsed || job.totalCreditsEstimated} créditos</span>
                    </div>

                    {job.status === 'processing' && (
                      <Progress 
                        value={(job.processedDocuments / job.totalDocuments) * 100} 
                        className="h-2"
                      />
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Criado em {new Date(job.createdAt).toLocaleDateString()}</span>
                      <span>{job.processedDocuments}/{job.totalDocuments} processados</span>
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