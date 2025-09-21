import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Gavel } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="flex items-center justify-between h-16 max-w-7xl mx-auto px-4">
    {/* Logo (esquerda) */}
    <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
        <Gavel className="text-primary-foreground" size={16} />
      </div>
      <span className="text-xl font-bold text-primary">JusValida</span>
    </Link>

    {/* Menu (meio) */}
    <div className="hidden md:flex flex-1 justify-center">
      <ul className="flex space-x-8">
        <li>
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-features">Recursos</a>
        </li>
        <li>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-pricing">Preços</a>
        </li>
        <li>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-about">Sobre</a>
        </li>
        <li>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-contact">Contato</Link>
        </li>
      </ul>
    </div>

    {/* Botões (direita) */}
    <div className="flex items-center space-x-3">
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
