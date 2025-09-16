import { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Check, CreditCard, Zap, Crown, Building, ArrowLeft } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CREDIT_PACKAGES = [
  {
    id: 'credits_50',
    name: '50 Créditos',
    credits: 50,
    price: 47,
    popular: false,
    description: 'Ideal para uso básico',
    features: ['Análises básicas', 'Todos os provedores de IA', 'Suporte por email']
  },
  {
    id: 'credits_100',
    name: '100 Créditos',
    credits: 100,
    price: 87,
    popular: true,
    description: 'Melhor custo-benefício',
    features: ['Análises ilimitadas', 'Todos os provedores de IA', 'Suporte prioritário', '15% de desconto']
  },
  {
    id: 'credits_500',
    name: '500 Créditos',
    credits: 500,
    price: 397,
    popular: false,
    description: 'Para uso profissional',
    features: ['Volume profissional', 'Todos os provedores de IA', 'Suporte dedicado', '20% de desconto']
  }
];

interface CheckoutFormProps {
  selectedPackage: any;
  onPaymentSuccess: () => void;
}

function CheckoutForm({ selectedPackage, onPaymentSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/billing?success=true',
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Erro no Pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Pagamento Realizado!",
          description: `${selectedPackage.credits} créditos adicionados à sua conta`,
        });
        onPaymentSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro no Pagamento",
        description: error.message || "Erro inesperado no pagamento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-payment">
      <PaymentElement />
      
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Total:</span>
          <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
            R$ {selectedPackage.price}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{selectedPackage.credits} créditos</span>
          <span>R$ {(selectedPackage.price / selectedPackage.credits).toFixed(2)} por crédito</span>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-pay"
      >
        {isProcessing ? "Processando..." : `Pagar R$ ${selectedPackage.price}`}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]); // Default to popular
  const [clientSecret, setClientSecret] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const createPaymentIntent = async (packageData: any) => {
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        credits: packageData.credits,
        amount: packageData.price 
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
    }
  };

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowPayment(false);
    setClientSecret("");
  };

  const handleProceedToPayment = () => {
    createPaymentIntent(selectedPackage);
  };

  const handlePaymentSuccess = () => {
    setLocation('/billing?success=true');
  };

  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => setLocation('/billing')} className="mb-4" data-testid="button-back">
              <ArrowLeft className="mr-2" size={16} />
              Voltar para Financeiro
            </Button>
            
            <h1 className="text-3xl font-bold mb-2" data-testid="text-checkout-title">
              Comprar Créditos
            </h1>
            <p className="text-muted-foreground" data-testid="text-checkout-description">
              Escolha o pacote de créditos ideal para suas necessidades
            </p>
          </div>

          {!showPayment ? (
            <>
              {/* Package Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {CREDIT_PACKAGES.map((pkg) => (
                  <Card 
                    key={pkg.id} 
                    className={`cursor-pointer transition-all relative ${
                      selectedPackage.id === pkg.id 
                        ? 'border-2 border-primary shadow-lg' 
                        : 'border border-border hover:shadow-md'
                    } ${pkg.popular ? 'transform scale-105' : ''}`}
                    onClick={() => handlePackageSelect(pkg)}
                    data-testid={`card-package-${pkg.id}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl" data-testid={`text-package-name-${pkg.id}`}>
                          {pkg.name}
                        </CardTitle>
                        {pkg.id === 'credits_50' && <Zap className="text-blue-500" size={24} />}
                        {pkg.id === 'credits_100' && <Crown className="text-yellow-500" size={24} />}
                        {pkg.id === 'credits_500' && <Building className="text-purple-500" size={24} />}
                      </div>
                      <div className="text-3xl font-bold text-primary" data-testid={`text-package-price-${pkg.id}`}>
                        R$ {pkg.price}
                      </div>
                      <CardDescription data-testid={`text-package-description-${pkg.id}`}>
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="mb-4">
                        <div className="text-2xl font-bold mb-1" data-testid={`text-package-credits-${pkg.id}`}>
                          {pkg.credits} créditos
                        </div>
                        <div className="text-sm text-muted-foreground">
                          R$ {(pkg.price / pkg.credits).toFixed(2)} por crédito
                        </div>
                      </div>
                      
                      <ul className="space-y-2">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm" data-testid={`text-feature-${pkg.id}-${index}`}>
                            <Check className="text-green-600 mr-2" size={16} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Package Summary */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center" data-testid="text-selected-package-title">
                    <CreditCard className="mr-2" size={20} />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div>
                      <div className="font-medium" data-testid="text-selected-package-name">
                        {selectedPackage.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedPackage.credits} créditos • {selectedPackage.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary" data-testid="text-selected-package-price">
                        R$ {selectedPackage.price}
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Créditos atuais:</span>
                      <span data-testid="text-current-credits">{user.credits}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Créditos adicionais:</span>
                      <span data-testid="text-additional-credits">+{selectedPackage.credits}</span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span>Total após compra:</span>
                      <span className="text-primary" data-testid="text-total-credits">
                        {user.credits + selectedPackage.credits} créditos
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleProceedToPayment}
                    data-testid="button-proceed-payment"
                  >
                    Prosseguir para Pagamento
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Payment Form */
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center" data-testid="text-payment-title">
                  <CreditCard className="mr-2" size={20} />
                  Finalizar Pagamento
                </CardTitle>
                <CardDescription>
                  Complete os dados do cartão para finalizar a compra
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      selectedPackage={selectedPackage}
                      onPaymentSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto mt-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="text-white" size={16} />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-green-900 mb-1">Pagamento Seguro</h4>
                <p className="text-sm text-green-800">
                  Seus dados são protegidos com criptografia SSL de 256 bits. 
                  Processamento realizado pelo Stripe, certificado PCI DSS Level 1.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
