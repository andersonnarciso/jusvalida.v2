import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIconComponent } from '@/lib/iconMapping';
import { useQuery } from '@tanstack/react-query';
import type { AiProviderConfig } from '@shared/schema';

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
  const { data: aiProviders = [], isLoading } = useQuery<AiProviderConfig[]>({
    queryKey: ['/api/ai-provider-configs'],
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-sm font-medium mb-3" data-testid="text-provider-title">
          Provedor de IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium mb-3" data-testid="text-provider-title">
          Provedor de IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiProviders.map((provider) => {
            const isSelected = selectedProvider === provider.providerId;
            const canAfford = userCredits >= provider.credits;
            const isDisabled = !canAfford && !provider.isFree;
            const IconComponent = getIconComponent(provider.iconName);

            return (
              <Card
                key={provider.providerId}
                className={cn(
                  "cursor-pointer transition-all relative",
                  isSelected 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-border hover:border-primary",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && onProviderChange(provider.providerId)}
                data-testid={`card-provider-${provider.providerId}`}
              >
                {provider.isPopular && (
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
                      provider.isFree 
                        ? "bg-green-500" 
                        : isSelected 
                          ? "bg-primary" 
                          : "bg-accent"
                    )}>
                      <IconComponent 
                        className={cn(
                          provider.isFree || isSelected 
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
                  
                  <div className="text-sm font-semibold mb-1" data-testid={`text-provider-name-${provider.providerId}`}>
                    {provider.name} {provider.model}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2" data-testid={`text-provider-description-${provider.providerId}`}>
                    {provider.description}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium",
                      provider.isFree ? "text-green-600" : "text-muted-foreground"
                    )} data-testid={`text-provider-credits-${provider.providerId}`}>
                      {provider.credits === 0 ? "Gratuito" : `${provider.credits} créditos`}
                    </span>
                    
                    {!canAfford && !provider.isFree && (
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
