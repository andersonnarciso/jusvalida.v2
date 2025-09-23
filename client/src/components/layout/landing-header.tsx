import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Eye, EyeOff, Gavel } from 'lucide-react';

interface LandingHeaderProps {
  onLoginSuccess?: () => void;
  onRegisterSuccess?: () => void;
}

export function LandingHeader({ onLoginSuccess, onRegisterSuccess }: LandingHeaderProps) {
  const { signIn, signUp } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState({ login: false, register: false });
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    saveData: false,
    acceptTerms: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      if (error) {
        throw error;
      }
      onLoginSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro no Login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.acceptTerms) {
      toast({
        title: "Erro no Cadastro",
        description: "Você deve aceitar os termos de uso",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await signUp(registerForm.email, registerForm.password, {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        username: registerForm.username
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao JusValida! Você recebeu 10 créditos gratuitos.",
        variant: "default",
      });
      onRegisterSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro no Cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Gavel className="text-primary-foreground" size={16} />
            </div>
            <span className="text-xl font-bold text-primary">JusValida</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">Sobre</a>
          <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a>
        </div>
        
        <div className="flex items-center space-x-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost">Entrar</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Entrar na Conta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword.login ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                    >
                      {showPassword.login ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={loginForm.remember}
                      onCheckedChange={(checked) => setLoginForm({ ...loginForm, remember: !!checked })}
                    />
                    <Label htmlFor="remember" className="text-sm">Lembrar-me</Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">Esqueceu a senha?</Link>
                </div>
                
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>Começar Grátis</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Conta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      placeholder="João"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      placeholder="Silva"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input
                    id="username"
                    placeholder="joaosilva"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword.register ? "text" : "password"}
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword({ ...showPassword, register: !showPassword.register })}
                    >
                      {showPassword.register ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mínimo 8 caracteres com letras e números
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveData"
                    checked={registerForm.saveData}
                    onCheckedChange={(checked) => setRegisterForm({ ...registerForm, saveData: !!checked })}
                  />
                  <Label htmlFor="saveData" className="text-sm">Salvar dados de login</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={registerForm.acceptTerms}
                    onCheckedChange={(checked) => setRegisterForm({ ...registerForm, acceptTerms: !!checked })}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    Aceito os <a href="#" className="text-primary hover:underline">termos de uso</a> e <a href="#" className="text-primary hover:underline">política de privacidade</a>
                  </Label>
                </div>
                
                <Button type="submit" className="w-full">
                  Criar Conta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  );
}