import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUser } from '@/hooks/use-user';
import { Gavel, Coins, ChevronDown, User, CreditCard, Headphones, LogOut, Settings, Trash2 } from 'lucide-react';

export function DashboardHeader() {
  const { user, supabaseUser, signOut, isAdmin, isSupport } = useUser();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await signOut();
    setLocation('/');
  };

  if (!user) return null;

  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <a className="flex items-center space-x-2" data-testid="link-dashboard-home">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Gavel className="text-primary-foreground" size={16} />
              </div>
              <span className="text-xl font-bold text-primary">JusValida</span>
            </a>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* TODO: Need to implement credits system with Supabase */}
            {/* <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-lg">
              <Coins className="text-primary" size={16} />
              <span className="font-medium" data-testid="text-user-credits">
                {user?.credits || 0} créditos
              </span>
            </div> */}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-semibold">
                      {userInitials}
                    </span>
                  </div>
                  <span data-testid="text-user-name">{user?.firstName} {user?.lastName}</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-48" data-testid="menu-user-dropdown">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex items-center" data-testid="link-profile">
                      <User className="mr-2" size={16} />
                      Perfil
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/billing">
                    <a className="flex items-center" data-testid="link-billing">
                      <CreditCard className="mr-2" size={16} />
                      Financeiro
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/support">
                    <a className="flex items-center" data-testid="link-support">
                      <Headphones className="mr-2" size={16} />
                      Suporte
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/trash">
                    <a className="flex items-center" data-testid="link-trash">
                      <Trash2 className="mr-2" size={16} />
                      Lixeira
                    </a>
                  </Link>
                </DropdownMenuItem>
                
                {(isAdmin || isSupport) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <a className="flex items-center" data-testid="link-admin">
                          <Settings className="mr-2" size={16} />
                          Administração
                        </a>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-2" size={16} />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
