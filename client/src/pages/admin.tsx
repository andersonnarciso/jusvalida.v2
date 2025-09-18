import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Settings,
  Mail,
  Bell,
  Plus,
  Edit2,
  Trash2,
  TestTube,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import {
  insertSiteConfigSchema,
  insertSmtpConfigSchema,
  insertAdminNotificationSchema,
  insertStripeConfigSchema,
  type SiteConfig,
  type SmtpConfig,
  type AdminNotification,
  type StripeConfig,
  type InsertSiteConfig,
  type InsertSmtpConfig,
  type InsertAdminNotification,
  type InsertStripeConfig,
} from "@shared/schema";

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

// Site Config Form Component
function SiteConfigForm({ 
  configs, 
  onSave, 
  onUpdate, 
  isLoading 
}: {
  configs: SiteConfig[];
  onSave: (data: InsertSiteConfig) => void;
  onUpdate: ({ id, data }: { id: string; data: Partial<InsertSiteConfig> }) => void;
  isLoading: boolean;
}) {
  const form = useForm<InsertSiteConfig>({
    resolver: zodResolver(insertSiteConfigSchema),
    defaultValues: {
      section: "footer",
      key: "",
      value: "",
      dataType: "string",
      isActive: true,
    },
  });

  // Get specific config values
  const getConfigValue = (section: string, key: string) => {
    return configs.find(c => c.section === section && c.key === key)?.value || "";
  };

  const updateConfig = (section: string, key: string, value: string) => {
    const existingConfig = configs.find(c => c.section === section && c.key === key);
    
    if (existingConfig) {
      onUpdate({ id: existingConfig.id, data: { value } });
    } else {
      onSave({ section, key, value, dataType: "string", isActive: true });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações da Empresa</h3>
        
        <div className="space-y-2">
          <Label htmlFor="siteName">Nome do Site</Label>
          <Input
            id="siteName"
            placeholder="JusValida"
            defaultValue={getConfigValue("company", "siteName")}
            onBlur={(e) => updateConfig("company", "siteName", e.target.value)}
            data-testid="input-site-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">E-mail de Contato</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="contato@jusvalida.com"
            defaultValue={getConfigValue("contact", "contactEmail")}
            onBlur={(e) => updateConfig("contact", "contactEmail", e.target.value)}
            data-testid="input-contact-email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone">Telefone de Contato</Label>
          <Input
            id="contactPhone"
            placeholder="(11) 99999-9999"
            defaultValue={getConfigValue("contact", "contactPhone")}
            onBlur={(e) => updateConfig("contact", "contactPhone", e.target.value)}
            data-testid="input-contact-phone"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço da Empresa</h3>
        
        <div className="space-y-2">
          <Label htmlFor="companyAddress">Endereço Completo</Label>
          <Textarea
            id="companyAddress"
            placeholder="Rua dos Advogados, 123 - Centro, São Paulo - SP"
            defaultValue={getConfigValue("company", "companyAddress")}
            onBlur={(e) => updateConfig("company", "companyAddress", e.target.value)}
            data-testid="textarea-company-address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footerText">Texto do Rodapé</Label>
          <Textarea
            id="footerText"
            placeholder="© 2024 JusValida. Todos os direitos reservados."
            defaultValue={getConfigValue("footer", "footerText")}
            onBlur={(e) => updateConfig("footer", "footerText", e.target.value)}
            data-testid="textarea-footer-text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="socialLinks">Links das Redes Sociais (JSON)</Label>
          <Textarea
            id="socialLinks"
            placeholder='{"facebook": "https://facebook.com/...", "linkedin": "https://linkedin.com/..."}'
            defaultValue={getConfigValue("social", "socialLinks")}
            onBlur={(e) => updateConfig("social", "socialLinks", e.target.value)}
            data-testid="textarea-social-links"
          />
        </div>
      </div>
    </div>
  );
}

// SMTP Config Form Component
function SmtpConfigForm({ 
  config, 
  onSave, 
  onTest, 
  isSaving, 
  isTesting 
}: {
  config?: SmtpConfig;
  onSave: (data: InsertSmtpConfig) => void;
  onTest: (testEmail: string) => void;
  isSaving: boolean;
  isTesting: boolean;
}) {
  const form = useForm<InsertSmtpConfig>({
    resolver: zodResolver(insertSmtpConfigSchema),
    defaultValues: {
      host: config?.host || "",
      port: config?.port || 587,
      secure: config?.secure || false,
      username: config?.username || "",
      password: "", // Never pre-fill password
      fromEmail: config?.fromEmail || "",
      fromName: config?.fromName || "",
      isActive: config?.isActive ?? true,
    },
  });

  const [testEmail, setTestEmail] = useState("");

  const onSubmit = (data: InsertSmtpConfig) => {
    onSave(data);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servidor SMTP</FormLabel>
                <FormControl>
                  <Input
                    placeholder="smtp.gmail.com"
                    data-testid="input-smtp-host"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="587"
                    data-testid="input-smtp-port"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuário</FormLabel>
                <FormControl>
                  <Input
                    placeholder="seu-email@gmail.com"
                    data-testid="input-smtp-username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="sua-senha-de-app"
                    data-testid="input-smtp-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fromEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail do Remetente</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="noreply@jusvalida.com"
                    data-testid="input-smtp-from-email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fromName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Remetente</FormLabel>
                <FormControl>
                  <Input
                    placeholder="JusValida"
                    data-testid="input-smtp-from-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secure"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Conexão Segura (SSL/TLS)</FormLabel>
                  <FormDescription>
                    Use true para porta 465, false para outras portas
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-smtp-secure"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Configuração Ativa</FormLabel>
                  <FormDescription>
                    Habilitar ou desabilitar esta configuração SMTP
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-smtp-active"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="md:col-span-2 flex gap-4">
            <Button 
              type="submit" 
              disabled={isSaving}
              data-testid="button-save-smtp"
            >
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Test SMTP Configuration */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Testar Configuração</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="testEmail">E-mail para Teste</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="teste@exemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              data-testid="input-test-email"
            />
          </div>
          <Button
            onClick={() => onTest(testEmail)}
            disabled={isTesting || !testEmail}
            data-testid="button-test-smtp"
          >
            <TestTube className="mr-2 h-4 w-4" />
            {isTesting ? "Testando..." : "Testar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Stripe Config Form Component
function StripeConfigForm({ 
  config, 
  onSave, 
  onTest, 
  isSaving, 
  isTesting 
}: {
  config?: StripeConfig;
  onSave: (data: InsertStripeConfig) => void;
  onTest: (operationMode: 'test' | 'live') => void;
  isSaving: boolean;
  isTesting: boolean;
}) {
  const form = useForm<InsertStripeConfig>({
    resolver: zodResolver(insertStripeConfigSchema),
    defaultValues: {
      testSecretKey: "", // Never pre-fill sensitive keys
      liveSecretKey: "", // Never pre-fill sensitive keys
      publicKey: config?.publicKey || "",
      webhookSecret: "", // Never pre-fill sensitive keys
      isActive: config?.isActive ?? true,
      operationMode: config?.operationMode || "test",
    },
  });

  const [selectedMode, setSelectedMode] = useState<'test' | 'live'>(config?.operationMode || 'test');
  const watchedOperationMode = form.watch('operationMode');

  useEffect(() => {
    setSelectedMode(watchedOperationMode as 'test' | 'live');
  }, [watchedOperationMode]);

  const onSubmit = (data: InsertStripeConfig) => {
    onSave(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Configurações do Stripe</h3>
          <p className="text-sm text-muted-foreground">
            Configure as chaves API do Stripe para processar pagamentos
          </p>
        </div>
        <Badge 
          variant={selectedMode === 'live' ? 'destructive' : 'secondary'}
          data-testid="badge-stripe-mode"
        >
          Modo: {selectedMode === 'live' ? 'Produção' : 'Teste'}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="testSecretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave Secreta (Teste)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="sk_test_..."
                      data-testid="input-stripe-test-secret"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Chave secreta do Stripe para ambiente de teste
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="liveSecretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave Secreta (Produção)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="sk_live_..."
                      data-testid="input-stripe-live-secret"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Chave secreta do Stripe para ambiente de produção
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave Pública</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="pk_test_... ou pk_live_..."
                      data-testid="input-stripe-public-key"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Chave pública do Stripe (visível no frontend)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Secret</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="whsec_..."
                      data-testid="input-stripe-webhook-secret"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Segredo do webhook para validar eventos do Stripe
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="operationMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de Operação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stripe-mode">
                        <SelectValue placeholder="Selecionar modo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="test">Teste</SelectItem>
                      <SelectItem value="live">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Modo de operação do Stripe (teste ou produção)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativar Stripe</FormLabel>
                    <FormDescription>
                      Habilitar ou desabilitar integração com Stripe
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-stripe-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isSaving}
              data-testid="button-save-stripe"
            >
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Test Stripe Configuration */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Testar Configuração</h3>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              Teste a conexão com o Stripe no modo selecionado: <strong>{selectedMode}</strong>
            </p>
          </div>
          <Button
            onClick={() => onTest(selectedMode)}
            disabled={isTesting}
            data-testid="button-test-stripe"
          >
            <TestTube className="mr-2 h-4 w-4" />
            {isTesting ? "Testando..." : "Testar Conexão"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Notifications List Component
function NotificationsList({
  notifications,
  onEdit,
  onDelete,
  isDeleting
}: {
  notifications: AdminNotification[];
  onEdit: (notification: AdminNotification) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const getTypeVariant = (type: string) => {
    switch (type) {
      case "error": return "destructive";
      case "warning": return "secondary";
      case "success": return "default";
      case "info": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma notificação encontrada
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className="border rounded-lg p-4 space-y-3"
            data-testid={`notification-card-${notification.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium" data-testid={`notification-title-${notification.id}`}>
                    {notification.title}
                  </h4>
                  <Badge variant={getTypeVariant(notification.type)}>
                    {notification.type}
                  </Badge>
                  {notification.priority > 0 && (
                    <Badge variant="secondary">
                      Prioridade: {notification.priority}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`notification-message-${notification.id}`}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Público: {notification.targetAudience}</span>
                  {notification.expiresAt && (
                    <span>Expira: {format(new Date(notification.expiresAt), "dd/MM/yyyy HH:mm")}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(notification)}
                  data-testid={`button-edit-notification-${notification.id}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(notification.id)}
                  disabled={isDeleting}
                  data-testid={`button-delete-notification-${notification.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Notification Form Component
function NotificationForm({
  notification,
  onSave,
  onCancel,
  isLoading
}: {
  notification?: AdminNotification | null;
  onSave: (data: InsertAdminNotification) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const form = useForm<InsertAdminNotification>({
    resolver: zodResolver(insertAdminNotificationSchema),
    defaultValues: {
      title: notification?.title || "",
      message: notification?.message || "",
      type: notification?.type || "info",
      targetAudience: notification?.targetAudience || "all",
      priority: notification?.priority || 0,
      isActive: notification?.isActive ?? true,
      showOnDashboard: notification?.showOnDashboard ?? true,
      showOnLogin: notification?.showOnLogin ?? false,
      expiresAt: notification?.expiresAt || undefined,
      createdBy: "", // Will be set by backend
    },
  });

  const onSubmit = (data: InsertAdminNotification) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Título da notificação"
                    data-testid="input-notification-title"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-notification-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="announcement">Anúncio</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Conteúdo da notificação"
                  data-testid="textarea-notification-message"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Público Alvo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-notification-audience">
                      <SelectValue placeholder="Selecione o público" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="premium">Usuários premium</SelectItem>
                    <SelectItem value="trial">Usuários em período de teste</SelectItem>
                    <SelectItem value="admins">Apenas administradores</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="10"
                    data-testid="input-notification-priority"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Números maiores indicam maior prioridade (0-10)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Expiração (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  data-testid="input-notification-expires"
                  {...field}
                  value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Ativa</FormLabel>
                  <FormDescription className="text-sm">
                    Notificação está ativa
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-notification-active"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showOnDashboard"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Dashboard</FormLabel>
                  <FormDescription className="text-sm">
                    Mostrar no dashboard
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-notification-dashboard"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showOnLogin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Login</FormLabel>
                  <FormDescription className="text-sm">
                    Mostrar no login
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-notification-login"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading} data-testid="button-save-notification">
            {isLoading ? "Salvando..." : "Salvar Notificação"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-notification">
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
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

  // Fetch site configurations
  const { data: siteConfigs, isLoading: siteConfigsLoading } =
    useQuery<SiteConfig[]>({
      queryKey: ["/api/admin/site-config"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/site-config");
        return response.json();
      },
      enabled: !loading && isAdmin,
    });

  // Fetch SMTP configuration
  const { data: smtpConfig, isLoading: smtpConfigLoading } =
    useQuery<SmtpConfig>({
      queryKey: ["/api/admin/smtp-config"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/smtp-config");
        return response.json();
      },
      enabled: !loading && isAdmin,
    });

  // Fetch admin notifications
  const { data: adminNotifications, isLoading: notificationsLoading } =
    useQuery<AdminNotification[]>({
      queryKey: ["/api/admin/notifications"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/notifications");
        return response.json();
      },
      enabled: !loading && isAdmin,
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

  // Site configuration mutations
  const createSiteConfigMutation = useMutation({
    mutationFn: (data: InsertSiteConfig) => apiRequest("POST", "/api/admin/site-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-config"] });
      toast({ title: "Sucesso", description: "Configuração salva com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar configuração",
        variant: "destructive",
      });
    },
  });

  const updateSiteConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertSiteConfig> }) => 
      apiRequest("PUT", `/api/admin/site-config/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-config"] });
      toast({ title: "Sucesso", description: "Configuração atualizada com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar configuração",
        variant: "destructive",
      });
    },
  });

  // SMTP configuration mutations
  const saveSmtpConfigMutation = useMutation({
    mutationFn: (data: InsertSmtpConfig) => {
      if (smtpConfig?.id) {
        return apiRequest("PUT", `/api/admin/smtp-config/${smtpConfig.id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/smtp-config", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smtp-config"] });
      toast({ title: "Sucesso", description: "Configuração SMTP salva com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar configuração SMTP",
        variant: "destructive",
      });
    },
  });

  // SMTP test mutation
  const testSmtpMutation = useMutation({
    mutationFn: (testEmail: string) => 
      apiRequest("POST", "/api/admin/smtp-test", { testEmail }),
    onSuccess: () => {
      toast({ title: "Sucesso", description: "E-mail de teste enviado com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar e-mail de teste",
        variant: "destructive",
      });
    },
  });

  // Fetch Stripe configuration
  const { data: stripeConfig, isLoading: stripeConfigLoading } =
    useQuery<StripeConfig>({
      queryKey: ["/api/admin/stripe-config"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/admin/stripe-config");
        return response.json();
      },
      enabled: !loading && isAdmin,
    });

  // Stripe configuration mutations
  const saveStripeConfigMutation = useMutation({
    mutationFn: (data: InsertStripeConfig) => {
      if (stripeConfig?.id) {
        return apiRequest("PUT", `/api/admin/stripe-config/${stripeConfig.id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/stripe-config", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe-config"] });
      toast({ title: "Sucesso", description: "Configuração do Stripe salva com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar configuração do Stripe",
        variant: "destructive",
      });
    },
  });

  // Stripe test mutation
  const testStripeMutation = useMutation({
    mutationFn: (operationMode: 'test' | 'live') => 
      apiRequest("POST", "/api/admin/stripe-test", { operationMode }),
    onSuccess: (response: any) => {
      toast({ 
        title: "Sucesso", 
        description: response.message || "Configuração do Stripe testada com sucesso" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao testar configuração do Stripe",
        variant: "destructive",
      });
    },
  });

  // Admin notifications mutations
  const createNotificationMutation = useMutation({
    mutationFn: (data: InsertAdminNotification) => 
      apiRequest("POST", "/api/admin/notifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Sucesso", description: "Notificação criada com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar notificação",
        variant: "destructive",
      });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAdminNotification> }) => 
      apiRequest("PUT", `/api/admin/notifications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Sucesso", description: "Notificação atualizada com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar notificação",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Sucesso", description: "Notificação excluída com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir notificação",
        variant: "destructive",
      });
    },
  });

  // State for new tabs
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

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
          <TabsList className="grid w-full grid-cols-9">
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
            <TabsTrigger value="site-settings" data-testid="tab-site-settings">
              <Settings className="mr-2 h-4 w-4" />
              Configurações do Site
            </TabsTrigger>
            <TabsTrigger value="smtp-settings" data-testid="tab-smtp-settings">
              <Mail className="mr-2 h-4 w-4" />
              Configurações SMTP
            </TabsTrigger>
            <TabsTrigger value="stripe-settings" data-testid="tab-stripe-settings">
              <CreditCard className="mr-2 h-4 w-4" />
              Configurações Stripe
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notificações
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

          {/* Site Settings Tab */}
          <TabsContent value="site-settings" data-testid="content-site-settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Site</CardTitle>
                <CardDescription>
                  Configure as informações do rodapé e contato do site
                </CardDescription>
              </CardHeader>
              <CardContent>
                {siteConfigsLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <SiteConfigForm 
                    configs={siteConfigs || []}
                    onSave={createSiteConfigMutation.mutate}
                    onUpdate={updateSiteConfigMutation.mutate}
                    isLoading={createSiteConfigMutation.isPending || updateSiteConfigMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMTP Settings Tab */}
          <TabsContent value="smtp-settings" data-testid="content-smtp-settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações SMTP</CardTitle>
                <CardDescription>
                  Configure as configurações de e-mail para envio de notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                {smtpConfigLoading ? (
                  <div className="space-y-4">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <SmtpConfigForm 
                    config={smtpConfig}
                    onSave={saveSmtpConfigMutation.mutate}
                    onTest={testSmtpMutation.mutate}
                    isSaving={saveSmtpConfigMutation.isPending}
                    isTesting={testSmtpMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stripe Settings Tab */}
          <TabsContent value="stripe-settings" data-testid="content-stripe-settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Stripe</CardTitle>
                <CardDescription>
                  Configure as chaves API do Stripe para processar pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stripeConfigLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <StripeConfigForm 
                    config={stripeConfig}
                    onSave={saveStripeConfigMutation.mutate}
                    onTest={testStripeMutation.mutate}
                    isSaving={saveStripeConfigMutation.isPending}
                    isTesting={testStripeMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" data-testid="content-notifications">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Notificações do Sistema</CardTitle>
                    <CardDescription>
                      Gerencie notificações para usuários da plataforma
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedNotification(null);
                      setShowNotificationForm(true);
                    }}
                    data-testid="button-create-notification"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Notificação
                  </Button>
                </CardHeader>
                <CardContent>
                  {notificationsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <NotificationsList 
                      notifications={adminNotifications || []}
                      onEdit={(notification) => {
                        setSelectedNotification(notification);
                        setShowNotificationForm(true);
                      }}
                      onDelete={deleteNotificationMutation.mutate}
                      isDeleting={deleteNotificationMutation.isPending}
                    />
                  )}
                </CardContent>
              </Card>

              {showNotificationForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedNotification ? 'Editar' : 'Criar'} Notificação
                    </CardTitle>
                    <CardDescription>
                      {selectedNotification 
                        ? 'Edite os detalhes da notificação'
                        : 'Crie uma nova notificação para os usuários'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NotificationForm 
                      notification={selectedNotification}
                      onSave={(data) => {
                        if (selectedNotification) {
                          updateNotificationMutation.mutate({ 
                            id: selectedNotification.id, 
                            data 
                          });
                        } else {
                          createNotificationMutation.mutate(data);
                        }
                        setShowNotificationForm(false);
                        setSelectedNotification(null);
                      }}
                      onCancel={() => {
                        setShowNotificationForm(false);
                        setSelectedNotification(null);
                      }}
                      isLoading={
                        createNotificationMutation.isPending || 
                        updateNotificationMutation.isPending
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
