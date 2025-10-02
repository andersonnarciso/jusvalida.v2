import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUser } from '@/hooks/use-user';
import { Gavel, Coins, ChevronDown, User, CreditCard, Headphones, LogOut, Settings, Trash2, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface ProtectedHeaderProps {
  onLogout?: () => void;
}

export function ProtectedHeader({ onLogout }: ProtectedHeaderProps) {
  const { user, supabaseUser, signOut, isAdmin, isSupport } = useUser();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Debug logs para verificar se o admin está sendo detectado
  console.log('ProtectedHeader Debug:');
  console.log('- user:', user);
  console.log('- user.role:', user?.role);
  console.log('- isAdmin:', isAdmin);
  console.log('- isSupport:', isSupport);


  const handleLogout = async () => {
    await signOut();
    onLogout?.();
    setLocation('/');
  };

  const userInitials = user ? `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() : 
    supabaseUser ? `${supabaseUser.user_metadata?.first_name?.[0] || ''}${supabaseUser.user_metadata?.last_name?.[0] || ''}`.toUpperCase() : 
    'U';

  // Função para fechar o menu mobile após clicar em um item
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" onClick={closeMobileMenu}>
            <a className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Gavel className="text-primary-foreground" size={16} />
              </div>
              <span className="text-xl font-bold text-primary">JusValida</span>
            </a>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            </Link>
            <Link href="/analyses">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Análises</a>
            </Link>
            <Link href="/batch">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Análise em Massa</a>
            </Link>
            <Link href="/support">
              <a className="text-muted-foreground hover:text-foreground transition-colors">Suporte</a>
            </Link>
          </nav>

          {/* User Menu e Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            {/* TODO: Need to implement credits system with Supabase */}
            {/* <div className="hidden md:flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-lg">
              <Coins className="text-primary" size={16} />
              <span className="font-medium">
                {user?.credits || 0} créditos
              </span>
            </div> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-semibold">
                      {userInitials}
                    </span>
                  </div>
                  <span className="hidden md:inline">
                    {user ? `${user.firstName} ${user.lastName}` : 
                     supabaseUser ? `${supabaseUser.user_metadata?.first_name || ''} ${supabaseUser.user_metadata?.last_name || ''}`.trim() :
                     supabaseUser?.email?.split('@')[0] || 'Usuário'}
                  </span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" onClick={closeMobileMenu}>
                    <a className="flex items-center">
                      <User className="mr-2" size={16} />
                      Perfil
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/billing" onClick={closeMobileMenu}>
                    <a className="flex items-center">
                      <CreditCard className="mr-2" size={16} />
                      Financeiro
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/support" onClick={closeMobileMenu}>
                    <a className="flex items-center">
                      <Headphones className="mr-2" size={16} />
                      Suporte
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/trash" onClick={closeMobileMenu}>
                    <a className="flex items-center">
                      <Trash2 className="mr-2" size={16} />
                      Lixeira
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                {(isAdmin || isSupport) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" onClick={closeMobileMenu}>
                        <a className="flex items-center">
                          <Settings className="mr-2" size={16} />
                          Administração
                        </a>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2" size={16} />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <Link href="/dashboard" onClick={closeMobileMenu}>
                <a className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
              </Link>
              <Link href="/analyses" onClick={closeMobileMenu}>
                <a className="text-muted-foreground hover:text-foreground transition-colors">Análises</a>
              </Link>
              <Link href="/batch" onClick={closeMobileMenu}>
                <a className="text-muted-foreground hover:text-foreground transition-colors">Análise em Massa</a>
              </Link>
              <Link href="/support" onClick={closeMobileMenu}>
                <a className="text-muted-foreground hover:text-foreground transition-colors">Suporte</a>
              </Link>
              {/* TODO: Need to implement credits system with Supabase */}
              {/* <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-lg">
                <Coins className="text-primary" size={16} />
                <span className="font-medium">
                  {user?.credits || 0} créditos
                </span>
              </div> */}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}