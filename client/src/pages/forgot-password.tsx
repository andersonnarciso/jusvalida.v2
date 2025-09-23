import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Gavel } from 'lucide-react';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { resetPassword } = useSupabaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, informe seu e-mail.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(formData.email);

      if (error) {
        toast({
          title: "Erro na recuperação",
          description: error.message || "Erro inesperado. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitted(true);
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para instruções de recuperação de senha.",
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Erro na recuperação",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Gavel className="text-primary-foreground" size={24} />
            </div>
          </div>
          {isSubmitted ? (
            <>
              <CardTitle className="text-2xl font-bold">Verifique seu e-mail</CardTitle>
              <CardDescription>
                Enviamos um link para redefinir sua senha para {formData.email}
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
              <CardDescription>
                Informe seu e-mail para receber instruções de recuperação de senha
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Não recebeu o e-mail? Verifique sua caixa de spam ou clique abaixo para reenviar.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Reenviando...' : 'Reenviar E-mail'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/login')}
                  className="w-full"
                >
                  Voltar para Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-reset-password"
              >
                {isLoading ? 'Enviando...' : 'Enviar Instruções'}
              </Button>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline" data-testid="link-back-to-login">
                  Voltar para login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}