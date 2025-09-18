import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Activity,
  TrendingUp,
  Zap,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: "user" | "admin" | "support";
  credits: number;
  stripeCustomerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  users: User[];
  total: number;
}

interface PlatformAnalytics {
  totalUsers: number;
  totalAnalyses: number;
  totalCreditsUsed: number;
  totalCreditsPurchased: number;
  totalRevenue: number;
  userGrowth: Array<{ date: string; count: number }>;
  analysisGrowth: Array<{ date: string; count: number }>;
  supportTicketsStats: {
    open: number;
    pending: number;
    resolved: number;
    closed: number;
  };
}

interface AiUsageAnalytics {
  providerUsage: Array<{
    provider: string;
    model: string;
    count: number;
    totalCredits: number;
  }>;
  analysisTypes: Array<{ type: string; count: number }>;
  errorRates: Array<{ provider: string; model: string; successRate: number }>;
}

interface FinancialDetails {
  dailyTransactions: Array<{
    date: string;
    type: string;
    amount: number;
    count: number;
  }>;
  packagePopularity: Array<{ name: string; sales: number }>;
  userStatistics: {
    totalUsers: number;
    averageCredits: number;
    maxCredits: number;
    usersWithCredits: number;
  };
  recentTransactions: Array<{
    id: string;
    userId: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
    userEmail: string;
    userName: string;
  }>;
  totalPackages: number;
  activePackages: number;
}

interface SystemApiKey {
  id: string;
  provider: string;
  maskedApiKey: string; // SECURITY: Never expose full API keys to frontend
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemApiKeysResponse {
  providers: SystemApiKey[];
  status: Array<{
    provider: string;
    configured: boolean;
    isActive: boolean;
    id: string | null;
    maskedApiKey: string; // SECURITY: Only masked keys in frontend
    createdAt: string | null;
    updatedAt: string | null;
  }>;
}

interface ApiTestResult {
  success: boolean;
  message: string;
  provider: string;
}

interface CreditTrends {
  creditTrends: Array<{
    date: string;
    purchases: number;
    usage: number;
    net: number;
  }>;
  topSpenders: Array<{
    userId: string;
    userEmail: string;
    userName: string;
    totalSpent: number;
    totalPurchased: number;
    transactionCount: number;
  }>;
  hourlyUsage: Array<{ hour: number; transactions: number; credits: number }>;
  period: { days: number; startDate: string; endDate: string };
}

export default function Admin() {
  const { isAdmin, isSupport, loading } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userPage, setUserPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users with pagination
  const { data: usersData, isLoading: usersLoading } =
    useQuery<UserListResponse>({
      queryKey: ["/api/admin/users", userPage],
      queryFn: async () => {
        const response = await apiRequest(
          "GET",
          `/api/admin/users?page=${userPage}&limit=10`,
        );
        return response.json();
      },
      enabled: !loading && (isAdmin || isSupport),
    });

  // Fetch platform analytics
  const { data: analytics, isLoading: analyticsLoading } =
    useQuery<PlatformAnalytics>({
      queryKey: ["/api/admin/analytics"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/analytics");
        return response.json();
      },
      enabled: !loading && (isAdmin || isSupport),
    });

  // Fetch AI usage analytics
  const { data: aiUsage, isLoading: aiUsageLoading } =
    useQuery<AiUsageAnalytics>({
      queryKey: ["/api/admin/ai-usage"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/ai-usage");
        return response.json();
      },
      enabled: !loading && (isAdmin || isSupport),
    });

  // Fetch financial details
  const { data: financialDetails, isLoading: financialLoading } =
    useQuery<FinancialDetails>({
      queryKey: ["/api/admin/financial-details"],
      queryFn: async () => {
        const response = await apiRequest(
          "GET",
          "/api/admin/financial-details",
        );
        return response.json();
      },
      enabled: !loading && (isAdmin || isSupport),
    });

  // Fetch credit trends
  const { data: creditTrends, isLoading: trendsLoading } =
    useQuery<CreditTrends>({
      queryKey: ["/api/admin/credit-trends"],
      queryFn: async () => {
        const response = await apiRequest(
          "GET",
          "/api/admin/credit-trends?days=30",
        );
        return response.json();
      },
      enabled: !loading && (isAdmin || isSupport),
    });

  // Fetch system API keys
  const { data: systemApiKeys, isLoading: systemKeysLoading } =
    useQuery<SystemApiKeysResponse>({
      queryKey: ["/api/admin/system-api-keys"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/system-api-keys");
        return response.json();
      },
      enabled: !loading && isAdmin, // Only admins can access system keys
    });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string;
      updates: { role?: string; credits?: number };
    }) => apiRequest("PATCH", `/api/admin/users/${userId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User updated successfully" });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // System API Keys management
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // Create or update system API key mutation
  const saveSystemApiKeyMutation = useMutation({
    mutationFn: ({ provider, apiKey, isActive }: { provider: string; apiKey: string; isActive: boolean }) => {
      const existingProvider = systemApiKeys?.providers.find(p => p.provider === provider);
      
      if (existingProvider) {
        // Update existing key
        return apiRequest("PUT", `/api/admin/system-api-keys/${existingProvider.id}`, {
          apiKey,
          isActive
        });
      } else {
        // Create new key
        return apiRequest("POST", "/api/admin/system-api-keys", {
          provider,
          apiKey,
          isActive
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-api-keys"] });
      toast({ title: "Sucesso", description: "Chave de API salva com sucesso" });
      setEditingProvider(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar chave de API",
        variant: "destructive",
      });
    },
  });

  // Delete system API key mutation
  const deleteSystemApiKeyMutation = useMutation({
    mutationFn: (providerId: string) => apiRequest("DELETE", `/api/admin/system-api-keys/${providerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-api-keys"] });
      toast({ title: "Sucesso", description: "Chave de API removida com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover chave de API",
        variant: "destructive",
      });
    },
  });

  // Test API key connectivity mutation
  const testApiKeyMutation = useMutation({
    mutationFn: async (providerId: string) => {
      setTestingProvider(providerId);
      const response = await apiRequest("POST", `/api/admin/system-api-keys/${providerId}/test`);
      // SECURITY FIX: Parse response.json() correctly
      return response.json();
    },
    onSuccess: (result: ApiTestResult, providerId: string) => {
      setTestingProvider(null);
      
      if (result.success) {
        toast({ 
          title: "Teste bem-sucedido", 
          description: result.message,
        });
      } else {
        toast({
          title: "Falha no teste",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setTestingProvider(null);
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao testar conectividade",
        variant: "destructive",
      });
    },
  });

  // Admin verification
  useEffect(() => {
    if (!loading && !isAdmin && !isSupport) {
      setLocation("/dashboard");
    }
  }, [isAdmin, isSupport, loading, setLocation]);

  // Admin verification
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAdmin && !isSupport) {
    return null;
  }

  const handleUpdateUser = (
    userId: string,
    updates: { role?: string; credits?: number },
  ) => {
    updateUserMutation.mutate({ userId, updates });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "support":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários, monitore o uso de IA e visualize análises da
            plataforma
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="mr-2 h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="system-keys" data-testid="tab-system-keys">
              <Zap className="mr-2 h-4 w-4" />
              Chaves do Sistema
            </TabsTrigger>
            <TabsTrigger value="ai-monitoring" data-testid="tab-ai-monitoring">
              <Activity className="mr-2 h-4 w-4" />
              Monitoramento IA
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Análises da Plataforma
            </TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">
              <DollarSign className="mr-2 h-4 w-4" />
              Análise Financeira
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" data-testid="content-users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Créditos</TableHead>
                          <TableHead>Cadastrado em</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersData?.users.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell
                              data-testid={`text-user-name-${user.id}`}
                            >
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell
                              data-testid={`text-user-email-${user.id}`}
                            >
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getRoleBadgeVariant(user.role)}
                                data-testid={`badge-user-role-${user.id}`}
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell
                              data-testid={`text-user-credits-${user.id}`}
                            >
                              {user.credits}
                            </TableCell>
                            <TableCell
                              data-testid={`text-user-created-${user.id}`}
                            >
                              {format(new Date(user.createdAt), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {usersData?.users.length || 0} de{" "}
                        {usersData?.total || 0} usuários
                      </p>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                          disabled={userPage === 1}
                          data-testid="button-users-prev"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage((p) => p + 1)}
                          disabled={!usersData || usersData.users.length < 10}
                          data-testid="button-users-next"
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Edit Modal */}
            {selectedUser && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Editar Usuário</CardTitle>
                  <CardDescription>
                    Editando: {selectedUser.firstName} {selectedUser.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        defaultValue={selectedUser.role}
                        onValueChange={(role) =>
                          handleUpdateUser(selectedUser.id, { role })
                        }
                      >
                        <SelectTrigger data-testid="select-user-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="credits">Créditos</Label>
                      <div className="flex gap-2">
                        <Input
                          id="credits"
                          type="number"
                          defaultValue={selectedUser.credits}
                          placeholder="Número de créditos"
                          data-testid="input-user-credits"
                        />
                        <Button
                          onClick={(e) => {
                            const input = e.currentTarget
                              .previousElementSibling as HTMLInputElement;
                            const credits = parseInt(input.value);
                            if (credits >= 0) {
                              handleUpdateUser(selectedUser.id, { credits });
                            }
                          }}
                          data-testid="button-update-credits"
                        >
                          Atualizar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    data-testid="button-cancel-edit"
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* System API Keys Tab */}
          <TabsContent value="system-keys" data-testid="content-system-keys">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chaves de API do Sistema</CardTitle>
                  <CardDescription>
                    Configure as chaves de API dos provedores de IA que serão usadas como fallback quando o usuário não tiver sua própria chave
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                {systemKeysLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  ['openai', 'anthropic', 'gemini'].map((providerType) => {
                    const providerStatus = systemApiKeys?.status.find(s => s.provider === providerType);
                    const providerData = systemApiKeys?.providers.find(p => p.provider === providerType);
                    const isConfigured = providerStatus?.configured || false;
                    const isActive = providerStatus?.isActive || false;
                    const isEditing = editingProvider === providerType;
                    const isTesting = testingProvider === providerData?.id;
                    
                    return (
                      <Card key={providerType}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {providerType === 'openai' && <Zap className="h-4 w-4 text-primary" />}
                                {providerType === 'anthropic' && <Activity className="h-4 w-4 text-primary" />}
                                {providerType === 'gemini' && <TrendingUp className="h-4 w-4 text-primary" />}
                              </div>
                              <div>
                                <CardTitle className="text-lg capitalize">
                                  {providerType === 'openai' ? 'OpenAI' : 
                                   providerType === 'anthropic' ? 'Anthropic' : 'Google Gemini'}
                                </CardTitle>
                                <CardDescription>
                                  Status: <Badge 
                                    variant={isConfigured && isActive ? "default" : isConfigured ? "secondary" : "outline"} 
                                    data-testid={`status-${providerType}`}
                                  >
                                    {isConfigured && isActive ? 'Ativo' : 
                                     isConfigured ? 'Configurado (Inativo)' : 'Não configurado'}
                                  </Badge>
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isConfigured && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={!isActive || isTesting}
                                  onClick={() => providerData && testApiKeyMutation.mutate(providerData.id)}
                                  data-testid={`button-test-${providerType}`}
                                >
                                  {isTesting ? (
                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  )}
                                  {isTesting ? 'Testando...' : 'Testar'}
                                </Button>
                              )}
                              <Button 
                                size="sm"
                                variant={isEditing ? "secondary" : "default"}
                                onClick={() => setEditingProvider(isEditing ? null : providerType)}
                                data-testid={`button-configure-${providerType}`}
                              >
                                {isEditing ? 'Cancelar' : (isConfigured ? 'Editar' : 'Configurar')}
                              </Button>
                              {isConfigured && (
                                <Button 
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => providerData && deleteSystemApiKeyMutation.mutate(providerData.id)}
                                  data-testid={`button-delete-${providerType}`}
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {isEditing && (
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid gap-2">
                                <Label htmlFor={`apikey-${providerType}`}>Chave de API</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id={`apikey-${providerType}`}
                                    type="password"
                                    placeholder={`Digite a chave de API do ${providerType === 'openai' ? 'OpenAI' : 
                                               providerType === 'anthropic' ? 'Anthropic' : 'Google Gemini'}`}
                                    data-testid={`input-apikey-${providerType}`}
                                  />
                                  <Button 
                                    variant="default"
                                    disabled={saveSystemApiKeyMutation.isPending}
                                    onClick={(e) => {
                                      const input = document.getElementById(`apikey-${providerType}`) as HTMLInputElement;
                                      const checkbox = document.getElementById(`active-${providerType}`) as HTMLInputElement;
                                      const apiKey = input?.value?.trim();
                                      const isActive = checkbox?.checked || false;
                                      
                                      if (apiKey) {
                                        saveSystemApiKeyMutation.mutate({
                                          provider: providerType,
                                          apiKey,
                                          isActive
                                        });
                                      }
                                    }}
                                    data-testid={`button-save-${providerType}`}
                                  >
                                    {saveSystemApiKeyMutation.isPending ? 'Salvando...' : 'Salvar'}
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  id={`active-${providerType}`}
                                  className="rounded"
                                  defaultChecked={isActive}
                                  data-testid={`checkbox-active-${providerType}`}
                                />
                                <Label htmlFor={`active-${providerType}`}>
                                  Ativar este provedor
                                </Label>
                              </div>
                            </div>
                          </CardContent>
                        )}
                        {!isEditing && isConfigured && (
                          <CardContent>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                <strong>Última atualização:</strong> {
                                  providerData?.updatedAt ? 
                                  format(new Date(providerData.updatedAt), "dd/MM/yyyy 'às' HH:mm") : 
                                  'Nunca'
                                }
                              </p>
                              <p>
                                <strong>Criado em:</strong> {
                                  providerData?.createdAt ? 
                                  format(new Date(providerData.createdAt), "dd/MM/yyyy 'às' HH:mm") : 
                                  'N/A'
                                }
                              </p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Instruções</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>OpenAI:</strong> Obtenha sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary hover:underline">platform.openai.com</a></p>
                    <p><strong>Anthropic:</strong> Obtenha sua chave em <a href="https://console.anthropic.com/" target="_blank" className="text-primary hover:underline">console.anthropic.com</a></p>
                    <p><strong>Google Gemini:</strong> Obtenha sua chave em <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary hover:underline">aistudio.google.com</a></p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Importante:</strong> Estas chaves serão usadas como fallback quando usuários não tiverem suas próprias chaves configuradas. Mantenha-as seguras e monitore o uso.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Monitoring Tab */}
          <TabsContent
            value="ai-monitoring"
            data-testid="content-ai-monitoring"
          >
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Análises
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-analyses"
                    >
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        analytics?.totalAnalyses || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Créditos Utilizados
                    </CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-credits-used"
                    >
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        analytics?.totalCreditsUsed || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita Total
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-revenue"
                    >
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        `R$ ${analytics?.totalRevenue.toFixed(2) || "0.00"}`
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Uso por Provedor de IA</CardTitle>
                  <CardDescription>
                    Estatísticas de uso dos provedores de IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiUsageLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provedor</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Usos</TableHead>
                          <TableHead>Créditos</TableHead>
                          <TableHead>Taxa de Sucesso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aiUsage?.providerUsage.map(
                          (
                            provider: {
                              provider: string;
                              model: string;
                              count: number;
                              totalCredits: number;
                            },
                            index: number,
                          ) => {
                            const errorRate = aiUsage?.errorRates.find(
                              (e: {
                                provider: string;
                                model: string;
                                successRate: number;
                              }) =>
                                e.provider === provider.provider &&
                                e.model === provider.model,
                            );
                            return (
                              <TableRow key={index}>
                                <TableCell
                                  data-testid={`text-provider-${index}`}
                                >
                                  {provider.provider}
                                </TableCell>
                                <TableCell data-testid={`text-model-${index}`}>
                                  {provider.model}
                                </TableCell>
                                <TableCell
                                  data-testid={`text-usage-count-${index}`}
                                >
                                  {provider.count}
                                </TableCell>
                                <TableCell
                                  data-testid={`text-credits-${index}`}
                                >
                                  {provider.totalCredits}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {errorRate && errorRate.successRate > 90 ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <span
                                      data-testid={`text-success-rate-${index}`}
                                    >
                                      {errorRate
                                        ? `${errorRate.successRate.toFixed(1)}%`
                                        : "N/A"}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          },
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Platform Analytics Tab */}
          <TabsContent value="analytics" data-testid="content-analytics">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Usuários
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-users"
                    >
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        analytics?.totalUsers || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Análises Realizadas
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-platform-total-analyses"
                    >
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        analytics?.totalAnalyses || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Créditos Comprados
                    </CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-credits-purchased"
                    >
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        analytics?.totalCreditsPurchased || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-revenue-2"
                    >
                      {analyticsLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        `R$ ${analytics?.totalRevenue.toFixed(2) || "0.00"}`
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Financial Analysis Tab */}
          <TabsContent value="financial" data-testid="content-financial">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Usuários Ativos
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-active-users"
                    >
                      {financialLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        financialDetails?.userStatistics.usersWithCredits || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Média de Créditos
                    </CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-avg-credits"
                    >
                      {financialLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        Math.round(
                          financialDetails?.userStatistics.averageCredits || 0,
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pacotes Ativos
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-active-packages"
                    >
                      {financialLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        `${financialDetails?.activePackages || 0}/${financialDetails?.totalPackages || 0}`
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Transações Recentes
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-recent-transactions"
                    >
                      {financialLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        financialDetails?.recentTransactions.length || 0
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
