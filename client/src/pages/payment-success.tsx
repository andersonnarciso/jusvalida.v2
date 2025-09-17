import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, ArrowRight, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentSuccess() {
  const { user } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(10);

  // Get payment intent ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentIntentId = urlParams.get('payment_intent');
  const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');

  // Fetch updated user profile to show new credit balance
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
    refetchInterval: 2000, // Refresh every 2 seconds to catch webhook updates
    staleTime: 0, // Always fetch fresh data
  });

  // Auto redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setLocation('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pagamento Realizado com Sucesso!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Obrigado por confiar na JusValida
          </p>
        </div>

        {/* Payment Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Detalhes do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentIntentId && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600 dark:text-gray-400">ID da Transação:</span>
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {paymentIntentId.slice(0, 20)}...
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md text-sm font-medium">
                Aprovado
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 dark:text-gray-400">Saldo Atual de Créditos:</span>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userProfile?.credits || 0}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Seus créditos foram adicionados</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  O processamento pode levar alguns segundos. Seus créditos aparecerão automaticamente no dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Comece a analisar documentos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Acesse o dashboard para fazer upload e análise de seus documentos legais.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Download className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Recibo por email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Você receberá um recibo detalhado por email em alguns minutos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            onClick={() => setLocation('/dashboard')} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            data-testid="button-goto-dashboard"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Ir para o Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setLocation('/billing')}
            className="flex-1"
            data-testid="button-view-billing"
          >
            Ver Histórico de Pagamentos
          </Button>
        </div>

        {/* Auto Redirect Notice */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Redirecionando automaticamente para o dashboard em {countdown} segundos...
          <br />
          <button 
            onClick={() => setLocation('/dashboard')} 
            className="underline hover:text-blue-600 dark:hover:text-blue-400 mt-1"
            data-testid="link-skip-countdown"
          >
            Pular contagem regressiva
          </button>
        </div>
      </div>
    </div>
  );
}