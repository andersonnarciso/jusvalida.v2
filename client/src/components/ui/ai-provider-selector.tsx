import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Check, Bot, Brain, Sparkles, Route, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProvider {
  id: string;
  name: string;
  model: string;
  credits: number;
  description: string;
  icon: React.ComponentType<any>;
  popular?: boolean;
  free?: boolean;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai-gpt5',
    name: 'OpenAI',
    model: 'GPT-5',
    credits: 3,
    description: 'Modelo mais avançado para análise jurídica detalhada',
    icon: Bot,
    popular: true,
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic',
    model: 'Claude Sonnet 4',
    credits: 3,
    description: 'Especializado em análise de documentos legais',
    icon: Brain,
  },
  {
    id: 'openai-gpt4',
    name: 'OpenAI',
    model: 'GPT-4',
    credits: 2,
    description: 'Análise confiável com boa precisão',
    icon: Bot,
  },
  {
    id: 'gemini-pro',
    name: 'Google',
    model: 'Gemini Pro',
    credits: 1,
    description: 'Análise rápida e eficiente',
    icon: Sparkles,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    model: 'Multiple Models',
    credits: 2,
    description: 'Acesso a múltiplos modelos de IA',
    icon: Route,
  },
  {
    id: 'free-ai',
    name: 'IA Gratuita',
    model: 'Basic Analysis',
    credits: 0,
    description: 'Análise básica para usuários gratuitos',
    icon: Gift,
    free: true,
  },
];

interface AIProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
  userCredits: number;
  className?: string;
}

export function AIProviderSelector({ 
  selectedProvider, 
  onProviderChange, 
  userCredits,
  className 
}: AIProviderSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium mb-3" data-testid="text-provider-title">
          Provedor de IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            const canAfford = userCredits >= provider.credits;
            const isDisabled = !canAfford && !provider.free;

            return (
              <Card
                key={provider.id}
                className={cn(
                  "cursor-pointer transition-all relative",
                  isSelected 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-border hover:border-primary",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && onProviderChange(provider.id)}
                data-testid={`card-provider-${provider.id}`}
              >
                {provider.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground" data-testid="badge-popular">
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      provider.free 
                        ? "bg-green-500" 
                        : isSelected 
                          ? "bg-primary" 
                          : "bg-accent"
                    )}>
                      <provider.icon 
                        className={cn(
                          provider.free || isSelected 
                            ? "text-white" 
                            : "text-accent-foreground"
                        )} 
                        size={16} 
                      />
                    </div>
                    {isSelected && (
                      <Check className="text-primary" size={16} data-testid="icon-selected" />
                    )}
                  </div>
                  
                  <div className="text-sm font-semibold mb-1" data-testid={`text-provider-name-${provider.id}`}>
                    {provider.name} {provider.model}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2" data-testid={`text-provider-description-${provider.id}`}>
                    {provider.description}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium",
                      provider.free ? "text-green-600" : "text-muted-foreground"
                    )} data-testid={`text-provider-credits-${provider.id}`}>
                      {provider.credits === 0 ? "Gratuito" : `${provider.credits} créditos`}
                    </span>
                    
                    {!canAfford && !provider.free && (
                      <Badge variant="destructive" className="text-xs" data-testid="badge-insufficient-credits">
                        Insuficiente
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      {userCredits < 3 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-800" data-testid="text-low-credits-warning">
            <strong>Créditos baixos:</strong> Você tem apenas {userCredits} créditos restantes. 
            Considere <a href="/checkout" className="underline font-medium">comprar mais créditos</a> para acessar todos os provedores.
          </div>
        </div>
      )}
    </div>
  );
}
