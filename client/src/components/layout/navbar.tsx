import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Gavel } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center relative px-4">
        {/* Logo à esquerda absoluta */}
        <Link href="/" className="flex items-center space-x-2 absolute left-4" data-testid="link-home">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Gavel className="text-primary-foreground" size={16} />
          </div>
          <span className="text-xl font-bold text-primary">JusValida</span>
        </Link>
        
        {/* Menu centralizado na tela inteira */}
        <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-features">
            Recursos
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-pricing">
            Preços
          </a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-about">
            Sobre
          </a>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-contact">
            Contato
          </Link>
        </div>
        
        {/* Botões à direita absoluta */}
        <div className="flex items-center space-x-3 absolute right-4">
          <Link href="/login">
            <Button variant="ghost" data-testid="button-login">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button data-testid="button-register">Começar Grátis</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
