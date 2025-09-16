import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Cookie, 
  Settings, 
  Shield, 
  BarChart, 
  Cog, 
  ExternalLink,
  X
} from 'lucide-react';
import { Link } from 'wouter';
import { useCookiePreferences, CookiePreferences } from '@/hooks/use-cookie-preferences';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  enabled: boolean;
  details: string;
}

export function CookieBanner() {
  const { 
    showBanner, 
    hideBanner, 
    updatePreferences, 
    cookieSettingsOpen, 
    setCookieSettingsOpen,
    preferences 
  } = useCookiePreferences();
  
  const [cookieCategories, setCookieCategories] = useState<CookieCategory[]>([
    {
      id: 'essential',
      name: 'Cookies Essenciais',
      description: 'Necessários para o funcionamento básico do site.',
      details: 'Incluem cookies de sessão, autenticação e segurança. Não podem ser desabilitados.',
      icon: <Shield className="text-green-600" size={16} />,
      required: true,
      enabled: true,
    },
    {
      id: 'functional',
      name: 'Cookies Funcionais',
      description: 'Melhoram a experiência com funcionalidades personalizadas.',
      details: 'Salvam suas preferências como tema, idioma e configurações da interface.',
      icon: <Cog className="text-blue-600" size={16} />,
      required: false,
      enabled: false,
    },
    {
      id: 'analytics',
      name: 'Cookies de Análise',
      description: 'Coletam informações sobre uso do site para melhorias.',
      details: 'Ajudam a entender como você usa o site para oferecermos uma experiência melhor.',
      icon: <BarChart className="text-purple-600" size={16} />,
      required: false,
      enabled: false,
    },
  ]);

  // Initialize categories based on current preferences
  useEffect(() => {
    if (preferences) {
      setCookieCategories(prev => prev.map(category => ({
        ...category,
        enabled: category.required || Boolean(preferences[category.id as keyof Omit<CookiePreferences, 'timestamp' | 'version'>])
      })));
    }
  }, [preferences]);

  const handleCategoryToggle = (categoryId: string, enabled: boolean) => {
    setCookieCategories(prev => 
      prev.map(category => 
        category.id === categoryId 
          ? { ...category, enabled }
          : category
      )
    );
  };

  const savePreferences = (prefs?: Partial<CookiePreferences>) => {
    const finalPreferences: Partial<CookiePreferences> = {
      functional: prefs?.functional ?? cookieCategories.find(c => c.id === 'functional')?.enabled ?? false,
      analytics: prefs?.analytics ?? cookieCategories.find(c => c.id === 'analytics')?.enabled ?? false,
    };

    updatePreferences(finalPreferences);
    
    // Update local categories
    setCookieCategories(prev => prev.map(category => ({
      ...category,
      enabled: category.required || Boolean(finalPreferences[category.id as keyof CookiePreferences] ?? false)
    })));
  };

  const handleAcceptAll = () => {
    savePreferences({
      functional: true,
      analytics: true
    });
  };

  const handleAcceptEssential = () => {
    savePreferences({
      functional: false,
      analytics: false
    });
  };

  const handleSaveCustom = () => {
    savePreferences();
  };

  const handleRejectAll = () => {
    // Show only essential cookies
    setCookieCategories(prev => prev.map(category => ({
      ...category,
      enabled: category.required
    })));
    savePreferences({
      functional: false,
      analytics: false
    });
  };

  // Don't render if banner shouldn't be shown
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" data-testid="cookie-banner">
      <Card className="max-w-6xl mx-auto border-2 shadow-xl bg-background/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Cookie className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" data-testid="text-banner-title">
                  Consentimento de Cookies
                </h3>
                <p className="text-sm text-muted-foreground">
                  Conforme a LGPD (Lei Geral de Proteção de Dados)
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={hideBanner}
              className="h-8 w-8 p-0"
              data-testid="button-close-banner"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Main Message */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-muted-foreground" data-testid="text-banner-description">
                Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar 
                o uso do site. Você pode escolher quais categorias aceitar ou configurar suas 
                preferências detalhadamente.
              </p>
              
              {/* Quick Category Overview */}
              <div className="flex flex-wrap gap-2">
                {cookieCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={category.enabled ? "default" : "secondary"}
                    className="text-xs flex items-center space-x-1"
                  >
                    {category.icon}
                    <span>{category.name}</span>
                    {category.required && <span className="text-xs opacity-75">(Obrigatório)</span>}
                  </Badge>
                ))}
              </div>
              
              {/* Links */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link href="/cookie-policy" className="text-primary hover:underline flex items-center space-x-1" data-testid="link-cookie-policy">
                  <span>Política de Cookies</span>
                  <ExternalLink size={12} />
                </Link>
                <Link href="/privacy-policy" className="text-primary hover:underline flex items-center space-x-1" data-testid="link-privacy-policy">
                  <span>Política de Privacidade</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleAcceptAll}
                className="w-full"
                data-testid="button-accept-all"
              >
                Aceitar Todos
              </Button>
              
              <Button 
                onClick={handleAcceptEssential}
                variant="outline"
                className="w-full"
                data-testid="button-accept-essential"
              >
                Apenas Essenciais
              </Button>
              
              <Dialog open={cookieSettingsOpen} onOpenChange={setCookieSettingsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-center space-x-2"
                    data-testid="button-customize"
                  >
                    <Settings size={16} />
                    <span>Personalizar</span>
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Cookie className="text-primary" size={20} />
                      <span>Configurações de Cookies</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Sobre cookies:</strong> Pequenos arquivos que armazenamos no seu navegador 
                        para melhorar sua experiência. Você pode controlar quais tipos aceitar.
                      </p>
                    </div>
                    
                    {cookieCategories.map((category) => (
                      <div key={category.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {category.icon}
                            <div>
                              <h4 className="font-medium">{category.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {category.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {category.required && (
                              <Badge variant="outline" className="text-xs">
                                Sempre Ativo
                              </Badge>
                            )}
                            <Switch
                              checked={category.enabled}
                              onCheckedChange={(enabled) => handleCategoryToggle(category.id, enabled)}
                              disabled={category.required}
                              data-testid={`switch-${category.id}-detailed`}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {category.details}
                        </p>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between space-x-3">
                      <Button 
                        onClick={handleRejectAll}
                        variant="outline"
                        data-testid="button-reject-all-detailed"
                      >
                        Rejeitar Opcionais
                      </Button>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleSaveCustom}
                          data-testid="button-save-custom"
                        >
                          Salvar Configurações
                        </Button>
                        
                        <Button 
                          onClick={handleAcceptAll}
                          variant="secondary"
                          data-testid="button-accept-all-detailed"
                        >
                          Aceitar Todos
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded text-center">
                      <p className="text-xs text-muted-foreground">
                        Suas preferências serão salvas e aplicadas imediatamente. 
                        Você pode alterá-las a qualquer momento na nossa 
                        <Link href="/cookie-policy" className="text-primary hover:underline ml-1">
                          Política de Cookies
                        </Link>.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

