import { useState } from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Gavel, Bot, Upload, Shield, CreditCard, Headphones, ChartLine, Check, Play, Rocket } from 'lucide-react';

interface PlatformStats {
  totalDocuments: number;
  analysisAccuracy: number;
  activeLawyers: number;
  totalUsers: number;
  totalCreditsUsed: number;
  avgAnalysisTime: number;
}

export default function Landing() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
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
  
  const { data: platformStats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/platform-stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm.email, loginForm.password);
      setLocation('/dashboard');
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
      await register(registerForm);
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao JusValida! Você recebeu 10 créditos gratuitos.",
        variant: "default",
      });
      setTimeout(() => setLocation('/dashboard'), 500);
    } catch (error: any) {
      toast({
        title: "Erro no Cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Gavel className="text-primary-foreground" size={16} />
              </div>
              <span className="text-xl font-bold text-primary">JusValida</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Recursos</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Preços</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">Sobre</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-contact">Contato</a>
          </div>
          
          <div className="flex items-center space-x-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" data-testid="button-login">Entrar</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="dialog-login">
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
                      data-testid="input-login-email"
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
                        data-testid="input-login-password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                        data-testid="button-toggle-login-password"
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
                        data-testid="checkbox-remember"
                      />
                      <Label htmlFor="remember" className="text-sm">Lembrar-me</Label>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">Esqueceu a senha?</a>
                  </div>
                  
                  <Button type="submit" className="w-full" data-testid="button-submit-login">
                    Entrar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-register">Começar Grátis</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="dialog-register">
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
                        data-testid="input-first-name"
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
                        data-testid="input-last-name"
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
                      data-testid="input-username"
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
                      data-testid="input-register-email"
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
                        data-testid="input-register-password"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword({ ...showPassword, register: !showPassword.register })}
                        data-testid="button-toggle-register-password"
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
                      data-testid="checkbox-save-data"
                    />
                    <Label htmlFor="saveData" className="text-sm">Salvar dados de login</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={registerForm.acceptTerms}
                      onCheckedChange={(checked) => setRegisterForm({ ...registerForm, acceptTerms: !!checked })}
                      data-testid="checkbox-accept-terms"
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      Aceito os <a href="#" className="text-primary hover:underline">termos de uso</a> e <a href="#" className="text-primary hover:underline">política de privacidade</a>
                    </Label>
                  </div>
                  
                  <Button type="submit" className="w-full" data-testid="button-submit-register">
                    Criar Conta
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-float mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                <Bot className="text-primary-foreground" size={32} />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" data-testid="text-hero-title">
              Validação Jurídica com IA
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
              Analise contratos, peças e documentos jurídicos com precisão. Nossa IA identifica falhas, 
              brechas e sugere melhorias para seus documentos legais.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-4 text-lg" data-testid="button-start-now">
                  <Rocket className="mr-2" size={20} />
                  Começar Agora
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg" data-testid="button-demo">
                <Play className="mr-2" size={20} />
                Ver Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-stat-documents">
                  {statsLoading ? (
                    <div className="animate-pulse bg-primary/20 rounded w-24 h-9 mx-auto"></div>
                  ) : (
                    `${platformStats?.totalDocuments?.toLocaleString() || '0'}+`
                  )}
                </div>
                <div className="text-muted-foreground">Documentos Analisados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-stat-accuracy">
                  {statsLoading ? (
                    <div className="animate-pulse bg-primary/20 rounded w-16 h-9 mx-auto"></div>
                  ) : (
                    `${Math.round(platformStats?.analysisAccuracy || 0)}%`
                  )}
                </div>
                <div className="text-muted-foreground">Precisão na Análise</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-stat-lawyers">
                  {statsLoading ? (
                    <div className="animate-pulse bg-primary/20 rounded w-20 h-9 mx-auto"></div>
                  ) : (
                    `${platformStats?.activeLawyers?.toLocaleString() || '0'}+`
                  )}
                </div>
                <div className="text-muted-foreground">Advogados Ativos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6" data-testid="text-features-title">Recursos Avançados</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-description">
              Plataforma completa para validação e análise de documentos jurídicos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: Bot,
                title: "IA Multimodal",
                description: "Integração com OpenAI, Google Gemini, Anthropic Claude e outros provedores de IA.",
                features: ["Múltiplos provedores", "APIs personalizadas", "Comparação de custos"]
              },
              {
                icon: Upload,
                title: "Upload Inteligente",
                description: "Drag & drop para PDFs, DOCs ou cole o texto diretamente na plataforma.",
                features: ["Múltiplos formatos", "Validação automática", "Preview em tempo real"]
              },
              {
                icon: Shield,
                title: "Análise Completa",
                description: "Detecta falhas, brechas legais e sugere melhorias nos seus documentos.",
                features: ["Detecção de falhas", "Análise de riscos", "Sugestões de melhoria"]
              },
              {
                icon: CreditCard,
                title: "Sistema de Créditos",
                description: "Pague apenas pelo que usar com nosso sistema flexível de créditos.",
                features: ["Integração Stripe", "Planos flexíveis", "Histórico detalhado"]
              },
              {
                icon: Headphones,
                title: "Suporte 24/7",
                description: "Sistema completo de tickets para suporte técnico e jurídico.",
                features: ["Chat em tempo real", "Base de conhecimento", "Suporte especializado"]
              },
              {
                icon: ChartLine,
                title: "Analytics Avançado",
                description: "Dashboard completo com histórico, estatísticas e insights.",
                features: ["Relatórios detalhados", "Métricas de uso", "Exportação de dados"]
              }
            ].map((feature, index) => (
              <Card key={index} className="p-8 shadow-lg hover:shadow-xl transition-all" data-testid={`card-feature-${index}`}>
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-6">
                    <feature.icon className="text-primary-foreground" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-muted-foreground mb-4" data-testid={`text-feature-description-${index}`}>
                    {feature.description}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center" data-testid={`text-feature-item-${index}-${itemIndex}`}>
                        <Check className="text-primary mr-2" size={16} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6" data-testid="text-pricing-title">Planos e Preços</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-description">
              Escolha o plano ideal para suas necessidades jurídicas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8" data-testid="card-plan-free">
              <CardContent className="p-0">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4" data-testid="text-plan-free-title">Gratuito</h3>
                  <div className="text-4xl font-bold text-primary mb-2" data-testid="text-plan-free-price">R$ 0</div>
                  <div className="text-muted-foreground">por mês</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {[
                    "2 validações por dia",
                    "Documentos até 5 páginas",
                    "IA gratuita",
                    "Suporte por email"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center" data-testid={`text-plan-free-feature-${index}`}>
                      <Check className="text-primary mr-3" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/register">
                  <Button variant="outline" className="w-full" data-testid="button-plan-free">
                    Começar Grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Professional Plan */}
            <Card className="p-8 bg-gradient-to-br from-primary to-accent text-primary-foreground relative transform scale-105" data-testid="card-plan-professional">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </span>
              </div>
              
              <CardContent className="p-0">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4" data-testid="text-plan-pro-title">Profissional</h3>
                  <div className="text-4xl font-bold mb-2" data-testid="text-plan-pro-price">R$ 97</div>
                  <div className="opacity-90">100 créditos</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {[
                    "100 validações",
                    "Documentos ilimitados",
                    "Todas as IAs premium",
                    "API keys próprias",
                    "Suporte prioritário"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center" data-testid={`text-plan-pro-feature-${index}`}>
                      <Check className="mr-3" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/checkout?plan=professional">
                  <Button className="w-full bg-white text-primary hover:bg-gray-100" data-testid="button-plan-professional">
                    Assinar Agora
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="p-8" data-testid="card-plan-enterprise">
              <CardContent className="p-0">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4" data-testid="text-plan-enterprise-title">Empresarial</h3>
                  <div className="text-4xl font-bold text-primary mb-2" data-testid="text-plan-enterprise-price">R$ 297</div>
                  <div className="text-muted-foreground">500 créditos</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {[
                    "500 validações",
                    "Múltiplos usuários",
                    "Relatórios avançados",
                    "Integração API",
                    "Suporte dedicado"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center" data-testid={`text-plan-enterprise-feature-${index}`}>
                      <Check className="text-primary mr-3" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full" data-testid="button-plan-enterprise">
                  Contatar Vendas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
