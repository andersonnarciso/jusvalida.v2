import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Gavel, Eye, EyeOff } from 'lucide-react';

export default function RegisterSupabase() {
  const [, setLocation] = useLocation();
  const { signUp } = useSupabaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.username || 
        !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });

      if (error) {
        toast({
          title: "Erro no Cadastro",
          description: error.message === 'User already registered' 
            ? "Este email já está cadastrado."
            : "Erro inesperado. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
      });

      // Redirect to login
      setLocation('/login');
    } catch (error: any) {
      console.error('Register error:', error);
      toast({
        title: "Erro no Cadastro",
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
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Crie sua conta no JusValida para começar a analisar documentos jurídicos
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="João"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Silva"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                name="username"
                placeholder="joaosilva"
                value={formData.username}
                onChange={handleInputChange}
                required
                data-testid="input-username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="joao@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                data-testid="input-confirm-password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-register"
            >
              {isLoading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login">
              <a className="text-primary hover:underline" data-testid="link-login">
                Fazer login
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}