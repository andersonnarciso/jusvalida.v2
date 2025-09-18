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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="mr-2 h-4 w-4" />
              Usuários
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
