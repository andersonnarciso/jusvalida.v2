import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Gavel } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData.email, formData.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao JusValida",
      });
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md" data-testid="card-login">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <Gavel className="text-primary-foreground" size={24} />
          </div>
          <CardTitle className="text-2xl" data-testid="text-login-title">Entrar no JusValida</CardTitle>
          <CardDescription data-testid="text-login-description">
            Entre com suas credenciais para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked) => setFormData({ ...formData, remember: !!checked })}
                  data-testid="checkbox-remember"
                />
                <Label htmlFor="remember" className="text-sm">Lembrar-me</Label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                Esqueceu a senha?
              </a>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit">
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Link href="/register">
                <a className="text-primary hover:underline font-medium" data-testid="link-register">
                  Criar conta
                </a>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
