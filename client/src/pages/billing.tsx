import { useQuery } from '@tanstack/react-query';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { CreditCard, Plus, ArrowUpRight, ArrowDownRight, Receipt, Coins, Calendar, ExternalLink, BarChart3, TrendingUp, Activity } from 'lucide-react';

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number;
  description: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

interface CreditAnalytics {
  summary: {
    totalSpent: number;
    totalPurchased: number;
    currentBalance: number;
    totalAnalyses: number;
  };
  providerSpending: Array<{
    provider: string;
    amount: number;
  }>;
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
  recentTransactions: CreditTransaction[];
}

export default function Billing() {
  const { user } = useSupabaseAuth();

  const { data: transactions = [], isLoading } = useQuery<CreditTransaction[]>({
    queryKey: ['/api/credit-transactions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/credit-transactions');
      return response.json();
    }
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<CreditAnalytics>({
    queryKey: ['/api/credit-analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/credit-analytics');
      return response.json();
    }
  });

  // Load user profile data including credits
  const { data: userProfile } = useQuery<{userProfile: {credits: number}}>({
    queryKey: ['/api/user/profile'],
    enabled: !!user // Only run when user is authenticated
  });

  if (!user) return null;

  const totalPurchased = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalUsed = transactions
    .filter(t => t.type === 'usage')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ArrowUpRight className="text-green-600" size={16} />;
      case 'usage': return <ArrowDownRight className="text-red-600" size={16} />;
      case 'refund': return <ArrowUpRight className="text-blue-600" size={16} />;
      default: return <Receipt size={16} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-600';
      case 'usage': return 'text-red-600';
      case 'refund': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Compra';
      case 'usage': return 'Uso';
      case 'refund': return 'Reembolso';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-billing-title">
            Financeiro
          </h1>
          <p className="text-muted-foreground" data-testid="text-billing-description">
            Gerencie seus créditos e visualize o histórico de transações
          </p>
        </div>

        {/* Credit Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Créditos Atuais</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-current-credits">
                    {userProfile?.userProfile?.credits || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Coins className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Comprado</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-total-purchased">
                    {totalPurchased}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Utilizado</p>
                  <p className="text-3xl font-bold text-orange-600" data-testid="text-total-used">
                    {totalUsed}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ArrowDownRight className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Transações</p>
                  <p className="text-3xl font-bold" data-testid="text-total-transactions">
                    {transactions.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Receipt size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="text-buy-credits-title">
                <Coins className="mr-2" size={20} />
                Comprar Créditos
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Adquira mais créditos para continuar analisando documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/checkout">
                <Button className="w-full bg-white text-primary hover:bg-gray-100" data-testid="button-buy-credits">
                  <Plus className="mr-2" size={16} />
                  Comprar Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="text-subscription-title">
                <Calendar className="mr-2" size={20} />
                Planos Mensais
              </CardTitle>
              <CardDescription>
                Economize com nossos planos de assinatura mensal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/checkout?type=subscription">
                <Button variant="outline" className="w-full" data-testid="button-view-plans">
                  <ExternalLink className="mr-2" size={16} />
                  Ver Planos
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="text-payment-methods-title">
                <CreditCard className="mr-2" size={20} />
                Métodos de Pagamento
              </CardTitle>
              <CardDescription>
                Gerencie seus cartões e métodos de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled data-testid="button-manage-payment">
                Em Breve
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Credit Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center" data-testid="text-provider-spending-title">
                  <BarChart3 className="mr-2" size={20} />
                  Gastos por Provedor de IA
                </CardTitle>
                <CardDescription>
                  Distribuição de créditos utilizados por cada provedor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-muted rounded-full" />
                          <div className="h-4 bg-muted rounded w-24" />
                        </div>
                        <div className="h-4 bg-muted rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : analytics.providerSpending.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum uso registrado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.providerSpending.map((provider, index) => (
                      <div key={provider.provider} className="flex items-center justify-between" data-testid={`provider-spending-${provider.provider}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }} />
                          <span className="font-medium">{provider.provider}</span>
                        </div>
                        <span className="text-sm font-bold">{provider.amount} créditos</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center" data-testid="text-monthly-trends-title">
                  <TrendingUp className="mr-2" size={20} />
                  Tendência Mensal
                </CardTitle>
                <CardDescription>
                  Uso de créditos ao longo dos últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-4 bg-muted rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : analytics.monthlySpending.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum histórico mensal disponível</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.monthlySpending.slice(-6).map((month) => (
                      <div key={month.month} className="flex items-center justify-between" data-testid={`monthly-spending-${month.month}`}>
                        <span className="text-sm">{new Date(month.month + '-01').toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })}</span>
                        <span className="font-bold">{month.amount} créditos</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-transaction-history-title">Histórico de Transações</CardTitle>
            <CardDescription>
              Visualize todas as suas transações de créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-lg" />
                      <div>
                        <div className="h-4 bg-muted rounded w-32 mb-2" />
                        <div className="h-3 bg-muted rounded w-24" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-muted rounded w-16 mb-2" />
                      <div className="h-3 bg-muted rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="text-no-transactions">
                <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
                <p className="mb-4">Você ainda não realizou nenhuma compra de créditos</p>
                <Link href="/checkout">
                  <Button data-testid="button-first-purchase">
                    <Plus className="mr-2" size={16} />
                    Fazer Primeira Compra
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                    data-testid={`card-transaction-${transaction.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`text-transaction-description-${transaction.id}`}>
                          {transaction.description}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <span data-testid={`text-transaction-date-${transaction.id}`}>
                            {formatDate(transaction.createdAt)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getTransactionLabel(transaction.type)}
                          </Badge>
                          {transaction.stripePaymentIntentId && (
                            <Badge variant="outline" className="text-xs">
                              Stripe
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold ${getTransactionColor(transaction.type)}`} data-testid={`text-transaction-amount-${transaction.id}`}>
                        {transaction.type === 'usage' ? '-' : '+'}{Math.abs(transaction.amount)} créditos
                      </div>
                      {transaction.stripePaymentIntentId && (
                        <div className="text-xs text-muted-foreground">
                          ID: {transaction.stripePaymentIntentId.slice(-8)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {transactions.length >= 20 && (
                  <div className="text-center pt-6">
                    <Button variant="outline" data-testid="button-load-more">
                      Carregar Mais Transações
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
