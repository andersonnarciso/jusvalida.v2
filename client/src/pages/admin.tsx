import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Users, Activity, TrendingUp, Zap, DollarSign, FileText, AlertTriangle, CheckCircle, Plus, Edit, Trash2, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: 'user' | 'admin' | 'support';
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
  userGrowth: Array<{date: string, count: number}>;
  analysisGrowth: Array<{date: string, count: number}>;
  supportTicketsStats: {open: number, pending: number, resolved: number, closed: number};
}

interface AiUsageAnalytics {
  providerUsage: Array<{provider: string, model: string, count: number, totalCredits: number}>;
  analysisTypes: Array<{type: string, count: number}>;
  errorRates: Array<{provider: string, model: string, successRate: number}>;
}

interface FinancialDetails {
  dailyTransactions: Array<{date: string, type: string, amount: number, count: number}>;
  packagePopularity: Array<{name: string, sales: number}>;
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
  creditTrends: Array<{date: string, purchases: number, usage: number, net: number}>;
  topSpenders: Array<{
    userId: string;
    userEmail: string;
    userName: string;
    totalSpent: number;
    totalPurchased: number;
    transactionCount: number;
  }>;
  hourlyUsage: Array<{hour: number, transactions: number, credits: number}>;
  period: {days: number, startDate: string, endDate: string};
}

interface DocumentTemplate {
  id: string;
  templateId: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  requiredClauses: string[];
  optionalClauses: string[];
  validationRules: any;
  riskCriteria: any;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface LegalClause {
  id: string;
  clauseId: string;
  name: string;
  category: string;
  description: string;
  standardText: string;
  alternativeText?: string;
  legalBasis?: string;
  applicableTemplates: string[];
  riskLevel: string;
  isRequired: boolean;
  jurisdictions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Template form schemas
const templateFormSchema = z.object({
  templateId: z.string().min(1, 'Template ID é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().min(1, 'Subcategoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  requiredClauses: z.array(z.string()).default([]),
  optionalClauses: z.array(z.string()).default([]),
  validationRules: z.any().default({}),
  riskCriteria: z.any().default({}),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0)
});

const clauseFormSchema = z.object({
  clauseId: z.string().min(1, 'Clause ID é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  standardText: z.string().min(1, 'Texto padrão é obrigatório'),
  alternativeText: z.string().optional(),
  legalBasis: z.string().optional(),
  applicableTemplates: z.array(z.string()).default([]),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  isRequired: z.boolean().default(false),
  jurisdictions: z.array(z.string()).default(['BR']),
  isActive: z.boolean().default(true)
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;
type ClauseFormValues = z.infer<typeof clauseFormSchema>;

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userPage, setUserPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Redirect if not admin - use useEffect to avoid render-time navigation
  useEffect(() => {
    if (!user || !['admin', 'support'].includes(user.role)) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // Return null while redirecting to prevent flash
  if (!user || !['admin', 'support'].includes(user.role)) {
    return null;
  }

  // Fetch users with pagination
  const { data: usersData, isLoading: usersLoading } = useQuery<UserListResponse>({
    queryKey: ['/api/admin/users', userPage],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/users?page=${userPage}&limit=10`);
      return response.json();
    }
  });

  // Fetch platform analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<PlatformAnalytics>({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/analytics');
      return response.json();
    }
  });

  // Fetch AI usage analytics
  const { data: aiUsage, isLoading: aiUsageLoading } = useQuery<AiUsageAnalytics>({
    queryKey: ['/api/admin/ai-usage'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ai-usage');
      return response.json();
    }
  });

  // Fetch financial details
  const { data: financialDetails, isLoading: financialLoading } = useQuery<FinancialDetails>({
    queryKey: ['/api/admin/financial-details'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/financial-details');
      return response.json();
    }
  });

  // Fetch credit trends
  const { data: creditTrends, isLoading: trendsLoading } = useQuery<CreditTrends>({
    queryKey: ['/api/admin/credit-trends'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/credit-trends?days=30');
      return response.json();
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: { role?: string; credits?: number } }) =>
      apiRequest('PATCH', `/api/admin/users/${userId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User updated successfully" });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  });

  const handleUpdateUser = (userId: string, updates: { role?: string; credits?: number }) => {
    updateUserMutation.mutate({ userId, updates });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'support': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie usuários, monitore o uso de IA e visualize análises da plataforma</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="mr-2 h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="legal-clauses" data-testid="tab-legal-clauses">
              <Settings className="mr-2 h-4 w-4" />
              Cláusulas
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
                            <TableCell data-testid={`text-user-name-${user.id}`}>
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell data-testid={`text-user-email-${user.id}`}>
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
                            <TableCell data-testid={`text-user-credits-${user.id}`}>
                              {user.credits}
                            </TableCell>
                            <TableCell data-testid={`text-user-created-${user.id}`}>
                              {format(new Date(user.createdAt), 'dd/MM/yyyy')}
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
                        Mostrando {usersData?.users.length || 0} de {usersData?.total || 0} usuários
                      </p>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => Math.max(1, p - 1))}
                          disabled={userPage === 1}
                          data-testid="button-users-prev"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => p + 1)}
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
                        onValueChange={(role) => handleUpdateUser(selectedUser.id, { role })}
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
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
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

          {/* Template Management Tab */}
          <TabsContent value="templates" data-testid="content-templates">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Templates */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Templates de Documentos</CardTitle>
                      <CardDescription>
                        Gerencie templates de documentos jurídicos e suas configurações
                      </CardDescription>
                    </div>
                    <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => {
                            setSelectedTemplate(null);
                            templateForm.reset();
                          }}
                          data-testid="button-create-template"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedTemplate ? 'Editar Template' : 'Criar Novo Template'}
                          </DialogTitle>
                          <DialogDescription>
                            Configure os detalhes do template de documento jurídico
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...templateForm}>
                          <form onSubmit={templateForm.handleSubmit(selectedTemplate ? handleUpdateTemplate : handleCreateTemplate)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={templateForm.control}
                                name="templateId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ID do Template</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="employment_contract" data-testid="input-template-id" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={templateForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Contrato de Trabalho" data-testid="input-template-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={templateForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-template-category">
                                          <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="contract">Contratos</SelectItem>
                                        <SelectItem value="legal_document">Documentos Legais</SelectItem>
                                        <SelectItem value="compliance">Compliance</SelectItem>
                                        <SelectItem value="corporate">Empresarial</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={templateForm.control}
                                name="subcategory"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Subcategoria</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="employment" data-testid="input-template-subcategory" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={templateForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Descrição detalhada do template..." data-testid="textarea-template-description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={templateForm.control}
                                name="isActive"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Template Ativo</FormLabel>
                                      <FormDescription>
                                        Template disponível para uso
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        data-testid="checkbox-template-active"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={templateForm.control}
                                name="sortOrder"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ordem de Exibição</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        {...field} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        data-testid="input-template-sort-order" 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                                Cancelar
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                                data-testid="button-save-template"
                              >
                                {selectedTemplate ? 'Atualizar' : 'Criar'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {templatesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum template encontrado. Crie o primeiro template!
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Templates Disponíveis:</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {templates.map((template) => (
                              <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{template.name}</p>
                                    <Badge variant={getCategoryBadgeVariant(template.category)}>
                                      {template.category}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{template.description}</p>
                                  <p className="text-xs text-muted-foreground">ID: {template.templateId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={template.isActive ? "secondary" : "outline"}>
                                    {template.isActive ? "Ativo" : "Inativo"}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTemplate(template)}
                                    data-testid={`button-edit-template-${template.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        data-testid={`button-delete-template-${template.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir o template "{template.name}"? 
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteTemplate(template)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Template Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas de Templates</CardTitle>
                    <CardDescription>
                      Análise de uso e performance dos templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary" data-testid="text-active-templates">
                          {templatesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : templates.filter(t => t.isActive).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Templates Ativos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600" data-testid="text-total-templates">
                          {templatesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : templates.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total de Templates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600" data-testid="text-template-categories">
                          {templatesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : Object.keys(templatesByCategory).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Categorias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600" data-testid="text-legal-clauses">
                          {clausesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : legalClauses.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Cláusulas na Base</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Ferramentas de gestão e configuração do sistema de templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await apiRequest('POST', '/api/admin/seed-data');
                          const result = await response.json();
                          toast({
                            title: "Dados Inicializados",
                            description: `${result.aiProviderConfigs || 0} configurações e ${result.creditPackages || 0} pacotes criados.`,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Erro",
                            description: error.message || "Falha ao inicializar dados",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-seed-data"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Inicializar Dados
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/legal-clauses'] });
                        toast({
                          title: "Atualizado",
                          description: "Dados de templates atualizados!",
                        });
                      }}
                      data-testid="button-refresh-templates"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Atualizar Dados
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const activeTemplates = templates.filter(t => t.isActive);
                        const inactiveTemplates = templates.filter(t => !t.isActive);
                        toast({
                          title: "Validação Concluída",
                          description: `${activeTemplates.length} templates ativos, ${inactiveTemplates.length} inativos`,
                        });
                      }}
                      data-testid="button-validate-templates"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Validar Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Legal Clauses Management Tab */}
          <TabsContent value="legal-clauses" data-testid="content-legal-clauses">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Legal Clauses Management */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Base de Cláusulas Jurídicas</CardTitle>
                      <CardDescription>
                        Gerencie biblioteca de cláusulas e padrões legais
                      </CardDescription>
                    </div>
                    <Dialog open={showClauseDialog} onOpenChange={setShowClauseDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => {
                            setSelectedClause(null);
                            clauseForm.reset();
                          }}
                          data-testid="button-create-clause"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Cláusula
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedClause ? 'Editar Cláusula' : 'Criar Nova Cláusula'}
                          </DialogTitle>
                          <DialogDescription>
                            Configure os detalhes da cláusula legal
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...clauseForm}>
                          <form onSubmit={clauseForm.handleSubmit(selectedClause ? handleUpdateClause : handleCreateClause)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={clauseForm.control}
                                name="clauseId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ID da Cláusula</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="termination_clause" data-testid="input-clause-id" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={clauseForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Cláusula de Rescisão" data-testid="input-clause-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={clauseForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-clause-category">
                                          <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="termination">Rescisão</SelectItem>
                                        <SelectItem value="liability">Responsabilidade</SelectItem>
                                        <SelectItem value="payment">Pagamento</SelectItem>
                                        <SelectItem value="confidentiality">Confidencialidade</SelectItem>
                                        <SelectItem value="compliance">Compliance</SelectItem>
                                        <SelectItem value="intellectual_property">Propriedade Intelectual</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={clauseForm.control}
                                name="riskLevel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nível de Risco</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-clause-risk-level">
                                          <SelectValue placeholder="Selecione o nível de risco" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="low">Baixo</SelectItem>
                                        <SelectItem value="medium">Médio</SelectItem>
                                        <SelectItem value="high">Alto</SelectItem>
                                        <SelectItem value="critical">Crítico</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={clauseForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Descrição da cláusula..." rows={3} data-testid="textarea-clause-description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={clauseForm.control}
                              name="standardText"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Texto Padrão</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Texto padrão da cláusula..." rows={4} data-testid="textarea-clause-standard-text" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={clauseForm.control}
                              name="alternativeText"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Texto Alternativo (Opcional)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Texto alternativo da cláusula..." rows={3} data-testid="textarea-clause-alternative-text" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={clauseForm.control}
                              name="legalBasis"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Base Legal (Opcional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Art. 123 da Lei X..." data-testid="input-clause-legal-basis" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={clauseForm.control}
                                name="isRequired"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Cláusula Obrigatória</FormLabel>
                                      <FormDescription>
                                        Legalmente obrigatória
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        data-testid="checkbox-clause-required"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={clauseForm.control}
                                name="isActive"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Cláusula Ativa</FormLabel>
                                      <FormDescription>
                                        Disponível para uso
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        data-testid="checkbox-clause-active"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setShowClauseDialog(false)}>
                                Cancelar
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createClauseMutation.isPending || updateClauseMutation.isPending}
                                data-testid="button-save-clause"
                              >
                                {selectedClause ? 'Atualizar' : 'Criar'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clausesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : legalClauses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma cláusula encontrada. Crie a primeira cláusula!
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Cláusulas Disponíveis:</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {legalClauses.map((clause) => (
                              <div key={clause.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{clause.name}</p>
                                    <Badge variant="outline">{clause.category}</Badge>
                                    <Badge className={getRiskLevelColor(clause.riskLevel)}>
                                      {clause.riskLevel}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">{clause.description}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>ID: {clause.clauseId}</span>
                                    {clause.isRequired && <Badge variant="destructive" className="text-xs">Obrigatória</Badge>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={clause.isActive ? "secondary" : "outline"}>
                                    {clause.isActive ? "Ativa" : "Inativa"}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditClause(clause)}
                                    data-testid={`button-edit-clause-${clause.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        data-testid={`button-delete-clause-${clause.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Cláusula</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir a cláusula "{clause.name}"? 
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteClause(clause)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Clauses Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas de Cláusulas</CardTitle>
                    <CardDescription>
                      Análise da base de cláusulas jurídicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary" data-testid="text-active-clauses">
                          {clausesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : legalClauses.filter(c => c.isActive).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Cláusulas Ativas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600" data-testid="text-total-clauses">
                          {clausesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : legalClauses.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total de Cláusulas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600" data-testid="text-required-clauses">
                          {clausesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : legalClauses.filter(c => c.isRequired).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Cláusulas Obrigatórias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600" data-testid="text-critical-clauses">
                          {clausesLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : legalClauses.filter(c => c.riskLevel === 'critical').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Cláusulas Críticas</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Distribuição por Categoria:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(clausesByCategory).map(([category, clauses]) => (
                          <Badge key={category} variant="outline" className="justify-center">
                            {category} ({clauses.length})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions for Clauses */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas para Cláusulas</CardTitle>
                  <CardDescription>
                    Ferramentas de gestão da base de cláusulas jurídicas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/legal-clauses'] });
                        toast({
                          title: "Atualizado",
                          description: "Dados de cláusulas atualizados!",
                        });
                      }}
                      data-testid="button-refresh-clauses"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Atualizar Cláusulas
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const activeClauses = legalClauses.filter(c => c.isActive);
                        const requiredClauses = legalClauses.filter(c => c.isRequired);
                        toast({
                          title: "Validação Concluída",
                          description: `${activeClauses.length} cláusulas ativas, ${requiredClauses.length} obrigatórias`,
                        });
                      }}
                      data-testid="button-validate-clauses"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Validar Cláusulas
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const riskStats = legalClauses.reduce((acc, clause) => {
                          acc[clause.riskLevel] = (acc[clause.riskLevel] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        
                        const message = Object.entries(riskStats)
                          .map(([level, count]) => `${level}: ${count}`)
                          .join(', ');
                          
                        toast({
                          title: "Análise de Risco",
                          description: `Distribuição: ${message}`,
                        });
                      }}
                      data-testid="button-analyze-risk"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Analisar Riscos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Monitoring Tab */}
          <TabsContent value="ai-monitoring" data-testid="content-ai-monitoring">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-analyses">
                      {analyticsLoading ? <Skeleton className="h-6 w-16" /> : analytics?.totalAnalyses || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Créditos Utilizados</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-credits-used">
                      {analyticsLoading ? <Skeleton className="h-6 w-16" /> : analytics?.totalCreditsUsed || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-revenue">
                      {analyticsLoading ? <Skeleton className="h-6 w-16" /> : `R$ ${analytics?.totalRevenue.toFixed(2) || '0.00'}`}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Uso por Provedor de IA</CardTitle>
                  <CardDescription>Estatísticas de uso dos provedores de IA</CardDescription>
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
                        {aiUsage?.providerUsage.map((provider: { provider: string; model: string; count: number; totalCredits: number }, index: number) => {
                          const errorRate = aiUsage?.errorRates.find(
                            (e: { provider: string; model: string; successRate: number }) => e.provider === provider.provider && e.model === provider.model
                          );
                          return (
                            <TableRow key={index}>
                              <TableCell data-testid={`text-provider-${index}`}>
                                {provider.provider}
                              </TableCell>
                              <TableCell data-testid={`text-model-${index}`}>
                                {provider.model}
                              </TableCell>
                              <TableCell data-testid={`text-usage-count-${index}`}>
                                {provider.count}
                              </TableCell>
                              <TableCell data-testid={`text-credits-${index}`}>
                                {provider.totalCredits}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {errorRate && errorRate.successRate > 90 ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <span data-testid={`text-success-rate-${index}`}>
                                    {errorRate ? `${errorRate.successRate.toFixed(1)}%` : 'N/A'}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Análise</CardTitle>
                  <CardDescription>Distribuição dos tipos de análise solicitados</CardDescription>
                </CardHeader>
                <CardContent>
                  {aiUsageLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {aiUsage?.analysisTypes.map((type: { type: string; count: number }, index: number) => (
                        <div key={index} className="text-center">
                          <div className="text-2xl font-bold" data-testid={`text-analysis-type-count-${index}`}>
                            {type.count}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-analysis-type-name-${index}`}>
                            {type.type}
                          </div>
                        </div>
                      ))}
                    </div>
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
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-users">
                      {analyticsLoading ? <Skeleton className="h-6 w-16" /> : analytics?.totalUsers || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Análises Realizadas</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-platform-total-analyses">
                      {analyticsLoading ? <Skeleton className="h-6 w-16" /> : analytics?.totalAnalyses || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Créditos Comprados</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-credits-purchased">
                      {analyticsLoading ? <Skeleton className="h-6 w-16" /> : analytics?.totalCreditsPurchased || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-platform-revenue">
                      {analyticsLoading ? <Skeleton className="h-6 w-16" /> : `R$ ${analytics?.totalRevenue.toFixed(2) || '0.00'}`}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tickets de Suporte</CardTitle>
                  <CardDescription>Status atual dos tickets de suporte</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600" data-testid="text-tickets-open">
                          {analytics?.supportTicketsStats.open || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Abertos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600" data-testid="text-tickets-pending">
                          {analytics?.supportTicketsStats.pending || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600" data-testid="text-tickets-resolved">
                          {analytics?.supportTicketsStats.resolved || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Resolvidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600" data-testid="text-tickets-closed">
                          {analytics?.supportTicketsStats.closed || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Fechados</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Crescimento de Usuários (30 dias)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : analytics?.userGrowth.length ? (
                      <div className="space-y-2">
                        {analytics.userGrowth.slice(-7).map((day: { date: string; count: number }, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span data-testid={`text-user-growth-date-${index}`}>
                              {format(new Date(day.date), 'dd/MM')}
                            </span>
                            <span data-testid={`text-user-growth-count-${index}`}>
                              {day.count} novos usuários
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">Nenhum dado de crescimento disponível</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Crescimento de Análises (30 dias)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : analytics?.analysisGrowth.length ? (
                      <div className="space-y-2">
                        {analytics.analysisGrowth.slice(-7).map((day: { date: string; count: number }, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span data-testid={`text-analysis-growth-date-${index}`}>
                              {format(new Date(day.date), 'dd/MM')}
                            </span>
                            <span data-testid={`text-analysis-growth-count-${index}`}>
                              {day.count} análises
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">Nenhum dado de crescimento disponível</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Financial Analytics Tab */}
          <TabsContent value="financial" data-testid="content-financial">
            <div className="grid gap-6">
              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-financial-total-users">
                      {financialLoading ? <Skeleton className="h-6 w-16" /> : financialDetails?.userStatistics.totalUsers || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Média de Créditos</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-avg-credits">
                      {financialLoading ? <Skeleton className="h-6 w-16" /> : financialDetails?.userStatistics.averageCredits || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">por usuário</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-users-with-credits">
                      {financialLoading ? <Skeleton className="h-6 w-16" /> : financialDetails?.userStatistics.usersWithCredits || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">com créditos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pacotes Ativos</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-active-packages">
                      {financialLoading ? <Skeleton className="h-6 w-16" /> : financialDetails?.activePackages || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">de {financialDetails?.totalPackages || 0} total</p>
                  </CardContent>
                </Card>
              </div>

              {/* Package Popularity and Top Spenders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pacotes Mais Populares</CardTitle>
                    <CardDescription>Vendas por pacote de créditos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {financialLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : financialDetails?.packagePopularity.length ? (
                      <div className="space-y-3">
                        {financialDetails.packagePopularity.slice(0, 5).map((pkg, index) => (
                          <div key={pkg.name} className="flex items-center justify-between" data-testid={`package-popularity-${index}`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }} />
                              <span className="font-medium">{pkg.name}</span>
                            </div>
                            <span className="text-sm font-bold">{pkg.sales} vendas</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">Nenhuma venda registrada</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Maiores Gastadores</CardTitle>
                    <CardDescription>Usuários com maior uso de créditos (30 dias)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : creditTrends?.topSpenders.length ? (
                      <div className="space-y-3">
                        {creditTrends.topSpenders.slice(0, 5).map((spender, index) => (
                          <div key={spender.userId} className="flex items-center justify-between" data-testid={`top-spender-${index}`}>
                            <div>
                              <div className="font-medium text-sm">{spender.userName}</div>
                              <div className="text-xs text-muted-foreground">{spender.userEmail}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{spender.totalSpent} gastos</div>
                              <div className="text-xs text-muted-foreground">{spender.transactionCount} transações</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">Nenhum dado de gasto disponível</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Credit Trends and Recent Transactions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tendências de Créditos (30 dias)</CardTitle>
                    <CardDescription>Compras vs Uso diário</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : creditTrends?.creditTrends.length ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {creditTrends.creditTrends.slice(-10).map((trend, index) => (
                          <div key={trend.date} className="flex items-center justify-between text-sm" data-testid={`credit-trend-${index}`}>
                            <span>{new Date(trend.date).toLocaleDateString('pt-BR')}</span>
                            <div className="flex space-x-4">
                              <span className="text-green-600">+{trend.purchases}</span>
                              <span className="text-red-600">-{trend.usage}</span>
                              <span className="font-medium">{trend.net}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">Nenhum dado de tendência disponível</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transações Recentes</CardTitle>
                    <CardDescription>Últimas transações do sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {financialLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : financialDetails?.recentTransactions.length ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {financialDetails.recentTransactions.slice(0, 10).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between" data-testid={`recent-transaction-${transaction.id}`}>
                            <div>
                              <div className="font-medium text-sm">{transaction.userName}</div>
                              <div className="text-xs text-muted-foreground">{transaction.description}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-sm ${transaction.type === 'usage' ? 'text-red-600' : 'text-green-600'}`}>
                                {transaction.type === 'usage' ? '-' : '+'}{Math.abs(transaction.amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">Nenhuma transação recente</p>
                    )}
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