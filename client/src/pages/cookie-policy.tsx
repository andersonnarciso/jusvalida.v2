import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cookie, Shield, BarChart, Cog, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  enabled: boolean;
  cookies: {
    name: string;
    purpose: string;
    duration: string;
    provider: string;
  }[];
}

export default function CookiePolicy() {
  const { toast } = useToast();
  
  const [cookieCategories, setCookieCategories] = useState<CookieCategory[]>([
    {
      id: 'essential',
      name: 'Cookies Essenciais',
      description: 'Necessários para o funcionamento básico do site. Não podem ser desabilitados.',
      icon: <Shield className="text-green-600" size={20} />,
      required: true,
      enabled: true,
      cookies: [
        {
          name: 'jusvalida_session',
          purpose: 'Manter sessão do usuário logado',
          duration: '24 horas',
          provider: 'JusValida'
        },
        {
          name: 'jusvalida_csrf',
          purpose: 'Proteção contra ataques CSRF',
          duration: 'Sessão',
          provider: 'JusValida'
        },
        {
          name: 'cookie_consent',
          purpose: 'Armazenar preferências de cookies',
          duration: '1 ano',
          provider: 'JusValida'
        }
      ]
    },
    {
      id: 'functional',
      name: 'Cookies Funcionais',
      description: 'Melhoram a experiência do usuário com funcionalidades personalizadas.',
      icon: <Cog className="text-blue-600" size={20} />,
      required: false,
      enabled: true,
      cookies: [
        {
          name: 'user_preferences',
          purpose: 'Salvar configurações de tema e idioma',
          duration: '6 meses',
          provider: 'JusValida'
        },
        {
          name: 'ai_provider_selection',
          purpose: 'Lembrar última seleção de provedor de IA',
          duration: '30 dias',
          provider: 'JusValida'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Cookies de Análise',
      description: 'Coletam informações sobre como os usuários utilizam o site para melhorias.',
      icon: <BarChart className="text-purple-600" size={20} />,
      required: false,
      enabled: false,
      cookies: [
        {
          name: 'jusvalida_analytics',
          purpose: 'Análise de uso e performance do site',
          duration: '2 anos',
          provider: 'JusValida'
        },
        {
          name: 'page_views',
          purpose: 'Contar visualizações de páginas',
          duration: '1 ano',
          provider: 'JusValida'
        }
      ]
    }
  ]);

  const handleCategoryToggle = (categoryId: string, enabled: boolean) => {
    setCookieCategories(prev => 
      prev.map(category => 
        category.id === categoryId 
          ? { ...category, enabled }
          : category
      )
    );
  };

  const handleSavePreferences = () => {
    // Save cookie preferences to localStorage
    const preferences = cookieCategories.reduce((acc, category) => {
      acc[category.id] = category.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    
    localStorage.setItem('cookie_preferences', JSON.stringify({
      ...preferences,
      timestamp: new Date().toISOString()
    }));
    
    toast({
      title: "Preferências Salvas",
      description: "Suas preferências de cookies foram atualizadas com sucesso.",
    });
  };

  const handleAcceptAll = () => {
    setCookieCategories(prev => 
      prev.map(category => ({ ...category, enabled: true }))
    );
    handleSavePreferences();
  };

  const handleRejectOptional = () => {
    setCookieCategories(prev => 
      prev.map(category => ({
        ...category,
        enabled: category.required
      }))
    );
    handleSavePreferences();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-back-home">
                <ArrowLeft size={16} />
                <span>Voltar ao Início</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Cookie className="text-primary" size={20} />
              <span className="text-lg font-semibold">Política de Cookies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-2" data-testid="text-policy-title">
                  <Cookie className="text-primary" />
                  <span>Política de Cookies</span>
                </CardTitle>
                <p className="text-muted-foreground">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Introduction */}
                <section>
                  <h2 className="text-xl font-semibold mb-3" data-testid="text-intro-section">O que são Cookies?</h2>
                  <p className="text-muted-foreground mb-4">
                    Cookies são pequenos arquivos de texto que são armazenados no seu navegador quando você 
                    visita nosso site. Eles nos ajudam a fornecer uma experiência melhor, lembrar suas 
                    preferências e entender como você usa nossa plataforma.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="text-blue-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Conformidade com LGPD</p>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                          Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD) 
                          e garante transparência sobre o uso de cookies em nossa plataforma.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Cookie Categories */}
                <section>
                  <h2 className="text-xl font-semibold mb-4" data-testid="text-categories-section">Categorias de Cookies</h2>
                  
                  <div className="space-y-6">
                    {cookieCategories.map((category) => (
                      <div key={category.id} className="border border-border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {category.icon}
                            <div>
                              <h3 className="font-semibold text-lg">{category.name}</h3>
                              <p className="text-muted-foreground text-sm">{category.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {category.required && (
                              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                            )}
                            <Switch
                              checked={category.enabled}
                              onCheckedChange={(enabled) => handleCategoryToggle(category.id, enabled)}
                              disabled={category.required}
                              data-testid={`switch-${category.id}`}
                            />
                          </div>
                        </div>
                        
                        {/* Cookie Details */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Cookies nesta categoria:</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {category.cookies.map((cookie, index) => (
                              <div key={index} className="bg-muted p-3 rounded border">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Nome:</span>
                                    <p className="text-muted-foreground">{cookie.name}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Finalidade:</span>
                                    <p className="text-muted-foreground">{cookie.purpose}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Duração:</span>
                                    <p className="text-muted-foreground">{cookie.duration}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Provedor:</span>
                                    <p className="text-muted-foreground">{cookie.provider}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator />

                {/* Third Party Cookies */}
                <section>
                  <h2 className="text-xl font-semibold mb-3" data-testid="text-third-party-section">Cookies de Terceiros</h2>
                  <p className="text-muted-foreground mb-4">
                    Nossa plataforma pode utilizar serviços de terceiros que definem seus próprios cookies:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="border border-border rounded p-4">
                      <h4 className="font-medium">Stripe (Pagamentos)</h4>
                      <p className="text-sm text-muted-foreground">
                        Para processamento seguro de pagamentos. 
                        <a href="https://stripe.com/privacy" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                          Ver política de privacidade
                        </a>
                      </p>
                    </div>
                    
                    <div className="border border-border rounded p-4">
                      <h4 className="font-medium">Replit (Infraestrutura)</h4>
                      <p className="text-sm text-muted-foreground">
                        Para hospedagem e funcionamento da plataforma.
                        <a href="https://replit.com/privacy" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                          Ver política de privacidade
                        </a>
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Managing Cookies */}
                <section>
                  <h2 className="text-xl font-semibold mb-3" data-testid="text-manage-section">Como Gerenciar Cookies</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">1. Através desta página</h4>
                      <p className="text-muted-foreground text-sm">
                        Use os controles acima para ativar/desativar categorias específicas de cookies.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">2. Configurações do navegador</h4>
                      <p className="text-muted-foreground text-sm mb-2">
                        Você pode gerenciar cookies diretamente nas configurações do seu navegador:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• <a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Chrome</a></li>
                        <li>• <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Firefox</a></li>
                        <li>• <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
                        <li>• <a href="https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Edge</a></li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Importante:</strong> Desabilitar cookies essenciais pode afetar o funcionamento 
                        da plataforma e impedir o acesso a certas funcionalidades.
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Contact */}
                <section>
                  <h2 className="text-xl font-semibold mb-3" data-testid="text-contact-section">Contato</h2>
                  <p className="text-muted-foreground">
                    Se você tiver dúvidas sobre esta política de cookies, entre em contato conosco:
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><strong>E-mail:</strong> dpo@jusvalida.com.br</p>
                    <p><strong>Telefone:</strong> +55 (11) 3000-0001</p>
                  </div>
                </section>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Cookie Controls */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" data-testid="text-preferences-title">Suas Preferências</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Quick Stats */}
                  <div className="bg-muted p-3 rounded text-center">
                    <p className="text-2xl font-bold text-primary">
                      {cookieCategories.filter(c => c.enabled).length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      de {cookieCategories.length} categorias ativas
                    </p>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Button 
                      onClick={handleAcceptAll}
                      className="w-full"
                      data-testid="button-accept-all"
                    >
                      Aceitar Todos
                    </Button>
                    
                    <Button 
                      onClick={handleRejectOptional}
                      variant="outline"
                      className="w-full"
                      data-testid="button-reject-optional"
                    >
                      Apenas Essenciais
                    </Button>
                    
                    <Button 
                      onClick={handleSavePreferences}
                      variant="secondary"
                      className="w-full"
                      data-testid="button-save-preferences"
                    >
                      Salvar Preferências
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  {/* Category Summary */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Resumo por categoria:</h4>
                    {cookieCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{category.name}</span>
                        <Badge variant={category.enabled ? "default" : "secondary"} className="text-xs">
                          {category.enabled ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}