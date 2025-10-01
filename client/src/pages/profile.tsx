import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Eye, EyeOff, Key, Save, Trash2, Plus, CreditCard, AlertTriangle } from 'lucide-react';

interface AIProviderConfig {
  id: string;
  provider: string;
  apiKey: string;
  isActive: boolean;
}

interface UserProfile {
  userProfile: {
    credits: number;
    stripeMode: 'test' | 'live';
  };
}

function StripeModeSetting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user profile data including stripe mode
  const { data: userProfile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile']
  });

  const updateStripeModeMutation = useMutation({
    mutationFn: async (stripeMode: 'test' | 'live') => {
      const response = await apiRequest('PATCH', '/api/user/stripe-mode', { stripeMode });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Modo Stripe Atualizado",
        description: `Agora você está no modo ${data.stripeMode === 'test' ? 'teste' : 'produção'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar modo Stripe",
        variant: "destructive",
      });
    }
  });

  const currentMode = userProfile?.userProfile?.stripeMode || 'test';
  const isLiveMode = currentMode === 'live';

  const handleToggleMode = () => {
    const newMode = isLiveMode ? 'test' : 'live';
    updateStripeModeMutation.mutate(newMode);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <CreditCard className="text-primary" size={20} />
          <div>
            <h3 className="font-medium" data-testid="text-stripe-mode-title">
              Modo do Stripe
            </h3>
            <p className="text-sm text-muted-foreground">
              {isLiveMode ? 'Pagamentos reais ativados' : 'Modo de teste ativado'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Label htmlFor="stripe-mode" className="text-sm font-medium">
            {isLiveMode ? 'Produção' : 'Teste'}
          </Label>
          <Switch
            id="stripe-mode"
            checked={isLiveMode}
            onCheckedChange={handleToggleMode}
            disabled={updateStripeModeMutation.isPending}
            data-testid="switch-stripe-mode"
          />
        </div>
      </div>

      {isLiveMode && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 mt-0.5" size={16} />
            <div>
              <h4 className="font-medium text-red-900 mb-1">⚠️ Modo Produção Ativo</h4>
              <p className="text-sm text-red-800">
                Você está no modo produção. Todos os pagamentos serão reais e processados através do Stripe live. 
                Certifique-se de que as chaves de produção estão configuradas corretamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLiveMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CreditCard className="text-blue-600 mt-0.5" size={16} />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">🧪 Modo Teste Ativo</h4>
              <p className="text-sm text-blue-800">
                Você está no modo teste. Use cartões de teste do Stripe para simular pagamentos sem custos reais. 
                Cartão de teste: 4242 4242 4242 4242 com qualquer data futura.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">💡 Sobre os Modos</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li><strong>Teste:</strong> Use para desenvolvimento e testes. Pagamentos simulados.</li>
          <li><strong>Produção:</strong> Use para processar pagamentos reais de clientes.</li>
          <li>Você pode alternar entre os modos a qualquer momento.</li>
        </ul>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [newProvider, setNewProvider] = useState({ provider: '', apiKey: '' });

  const { data: aiProviders = [], isLoading } = useQuery<AIProviderConfig[]>({
    queryKey: ['/api/ai-providers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai-providers');
      return response.json();
    }
  });

  // Load user profile data including credits
  const { data: userProfile } = useQuery<{userProfile: {credits: number}}>({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/profile');
      return response.json();
    },
    enabled: !!user // Only run when user is authenticated
  });

  const saveProviderMutation = useMutation({
    mutationFn: async (data: { provider: string; apiKey: string }) => {
      const response = await apiRequest('POST', '/api/ai-providers', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Salva",
        description: "Sua chave de API foi salva com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-providers'] });
      setNewProvider({ provider: '', apiKey: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar API key",
        variant: "destructive",
      });
    }
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/ai-providers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Removida",
        description: "Sua chave de API foi removida com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover API key",
        variant: "destructive",
      });
    }
  });

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSaveProvider = () => {
    if (!newProvider.provider || !newProvider.apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um provedor e insira a chave de API",
        variant: "destructive",
      });
      return;
    }
    saveProviderMutation.mutate(newProvider);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'gemini': return '✨';
      case 'openrouter': return '🛤️';
      default: return '🔧';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic Claude';
      case 'gemini': return 'Google Gemini';
      case 'openrouter': return 'OpenRouter';
      default: return provider;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-profile-title">
            Perfil do Usuário
          </h1>
          <p className="text-muted-foreground" data-testid="text-profile-description">
            Gerencie suas informações pessoais e configurações de IA
          </p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="personal" data-testid="tab-personal">
              Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="ai-keys" data-testid="tab-ai-keys">
              Chaves de API
            </TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment">
              Pagamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-personal-info-title">Informações Pessoais</CardTitle>
                <CardDescription>
                  Visualize suas informações de conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={user.user_metadata?.first_name || ''}
                      disabled
                      data-testid="input-first-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={user.user_metadata?.last_name || ''}
                      disabled
                      data-testid="input-last-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      value={user.user_metadata?.username || user.email?.split('@')[0] || ''}
                      disabled
                      data-testid="input-username"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium" data-testid="text-account-status">Status da Conta</h3>
                      <p className="text-sm text-muted-foreground">
                        Conta ativa com {userProfile?.userProfile?.credits || 0} créditos disponíveis
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary" data-testid="text-credits-display">
                        {userProfile?.userProfile?.credits || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">créditos</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-keys">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-api-keys-title">Chaves de API Configuradas</CardTitle>
                  <CardDescription>
                    Use suas próprias chaves de API para reduzir custos e ter controle total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border border-border rounded-lg">
                          <div className="w-10 h-10 bg-muted rounded-lg" />
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : aiProviders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground" data-testid="text-no-api-keys">
                      <Key size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Nenhuma chave de API configurada</p>
                      <p className="text-sm">Configure suas chaves para usar seus próprios créditos de IA</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiProviders.map((provider) => (
                        <div
                          key={provider.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                          data-testid={`card-provider-${provider.provider}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-lg">
                              {getProviderIcon(provider.provider)}
                            </div>
                            <div>
                              <div className="font-medium" data-testid={`text-provider-name-${provider.provider}`}>
                                {getProviderName(provider.provider)}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center space-x-2">
                                <span>API Key:</span>
                                {showApiKeys[provider.id] ? (
                                  <code className="bg-muted px-2 py-1 rounded text-xs">
                                    {provider.apiKey}
                                  </code>
                                ) : (
                                  <span>••••••••••••</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleApiKeyVisibility(provider.id)}
                                  data-testid={`button-toggle-key-${provider.provider}`}
                                >
                                  {showApiKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProviderMutation.mutate(provider.id)}
                            disabled={deleteProviderMutation.isPending}
                            data-testid={`button-delete-${provider.provider}`}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-add-api-key-title">Adicionar Nova Chave de API</CardTitle>
                  <CardDescription>
                    Configure uma nova chave de API para usar com seus próprios créditos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="provider">Provedor de IA</Label>
                      <Select value={newProvider.provider} onValueChange={(value) => setNewProvider({ ...newProvider, provider: value })}>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue placeholder="Selecione um provedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai" data-testid="option-openai">
                            🤖 OpenAI (GPT-4, GPT-5)
                          </SelectItem>
                          <SelectItem value="anthropic" data-testid="option-anthropic">
                            🧠 Anthropic (Claude)
                          </SelectItem>
                          <SelectItem value="gemini" data-testid="option-gemini">
                            ✨ Google (Gemini)
                          </SelectItem>
                          <SelectItem value="openrouter" data-testid="option-openrouter">
                            🛤️ OpenRouter
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="apiKey">Chave de API</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="sk-..."
                        value={newProvider.apiKey}
                        onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                        data-testid="input-api-key"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSaveProvider}
                    disabled={saveProviderMutation.isPending || !newProvider.provider || !newProvider.apiKey.trim()}
                    data-testid="button-save-api-key"
                  >
                    <Plus className="mr-2" size={16} />
                    {saveProviderMutation.isPending ? "Salvando..." : "Adicionar Chave"}
                  </Button>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Dica de Economia</h4>
                    <p className="text-sm text-blue-800">
                      Ao usar suas próprias chaves de API, você paga diretamente aos provedores de IA (OpenAI, Anthropic, etc.) 
                      e economiza nos custos de análise. As tarifas são geralmente muito mais baixas do que usar nossos créditos.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">🔒 Segurança</h4>
                    <p className="text-sm text-yellow-800">
                      Suas chaves de API são criptografadas e armazenadas com segurança. Elas só são usadas para fazer 
                      requisições de análise quando você escolher o provedor correspondente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-payment-settings-title">Configurações de Pagamento</CardTitle>
                <CardDescription>
                  Configure o modo do Stripe para testes ou pagamentos reais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <StripeModeSetting />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
