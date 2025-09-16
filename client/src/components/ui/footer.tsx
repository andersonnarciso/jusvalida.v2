import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Gavel, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Cookie, 
  FileText,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { Link } from 'wouter';
import { useCookiePreferences } from '@/hooks/use-cookie-preferences';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { openCookieSettings } = useCookiePreferences();
  
  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Gavel className="text-primary-foreground" size={16} />
              </div>
              <span className="text-xl font-bold text-primary">JusValida</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Análise jurídica inteligente com IA avançada. Transformando a revisão de documentos 
              jurídicos com tecnologia de ponta e expertise legal.
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin size={14} />
                <span>São Paulo, SP - Brasil</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail size={14} />
                <a href="mailto:contato@jusvalida.com.br" className="hover:text-primary transition-colors">
                  contato@jusvalida.com.br
                </a>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone size={14} />
                <a href="tel:+5511300000000" className="hover:text-primary transition-colors">
                  +55 (11) 3000-0000
                </a>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Plataforma</h3>
            <div className="space-y-2">
              <Link href="/dashboard">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  Dashboard
                </Button>
              </Link>
              <Link href="/analyses">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  Minhas Análises
                </Button>
              </Link>
              <Link href="/batch">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  Análise em Lote
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  Planos e Créditos
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  Suporte
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Legal Pages */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center space-x-2">
              <Shield size={16} />
              <span>Legal & Privacidade</span>
            </h3>
            <div className="space-y-2">
              <Link href="/privacy-policy">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  <FileText size={14} className="mr-2" />
                  Política de Privacidade
                </Button>
              </Link>
              <Link href="/cookie-policy">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  <Cookie size={14} className="mr-2" />
                  Política de Cookies
                </Button>
              </Link>
              
              <Button 
                variant="link" 
                className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start"
                onClick={openCookieSettings}
                data-testid="button-manage-cookies"
              >
                <Cookie size={14} className="mr-2" />
                Gerenciar Cookies
              </Button>
              <Link href="/terms-of-service">
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary text-sm justify-start">
                  <Gavel size={14} className="mr-2" />
                  Termos de Uso
                </Button>
              </Link>
              
              <Separator className="my-3" />
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground">Encarregado de Dados (DPO)</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Mail size={12} />
                    <a href="mailto:dpo@jusvalida.com.br" className="hover:text-primary transition-colors">
                      dpo@jusvalida.com.br
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={12} />
                    <a href="tel:+5511300000001" className="hover:text-primary transition-colors">
                      +55 (11) 3000-0001
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Company Details & Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Empresa</h3>
            
            <div className="space-y-3">
              {/* Company Legal Info */}
              <div className="bg-muted p-3 rounded-lg text-xs">
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">Razão Social:</strong></p>
                  <p>JusValida Análise Jurídica por IA Ltda.</p>
                  
                  <p className="pt-2"><strong className="text-foreground">CNPJ:</strong></p>
                  <p>12.345.678/0001-90</p>
                  
                  <p className="pt-2"><strong className="text-foreground">Endereço:</strong></p>
                  <p>Av. Paulista, 1000 - 10º andar<br />Bela Vista, São Paulo - SP<br />CEP 01310-100</p>
                </div>
              </div>
              
              {/* Social Media */}
              <div>
                <h4 className="font-medium text-sm text-foreground mb-3">Siga-nos</h4>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                    <Linkedin size={14} />
                  </Button>
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                    <Twitter size={14} />
                  </Button>
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                    <Instagram size={14} />
                  </Button>
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                    <Facebook size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="mb-6" />
        
        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* Copyright */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-sm text-muted-foreground">
            <p>© {currentYear} JusValida. Todos os direitos reservados.</p>
            <div className="hidden md:block">•</div>
            <p>Desenvolvido com ❤️ para advogados</p>
          </div>
          
          {/* Compliance Badges */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
              <Shield size={12} />
              <span>LGPD</span>
            </div>
            <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              <Gavel size={12} />
              <span>OAB</span>
            </div>
            <div className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
              <FileText size={12} />
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
        
        {/* Regulatory Notice */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="text-amber-600 mt-1 flex-shrink-0" size={16} />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Aviso Regulatório Importante</p>
                <p>
                  Os serviços do JusValida são ferramentas de apoio tecnológico e não substituem 
                  o aconselhamento jurídico profissional. As análises são geradas por inteligência 
                  artificial e podem conter limitações. Sempre consulte um advogado qualificado 
                  para decisões legais importantes. Este serviço está em conformidade com a LGPD 
                  (Lei 13.709/2018) e demais regulamentações aplicáveis.
                </p>
                
                <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <p className="font-medium">Ouvidoria ANPD</p>
                  <p>
                    Em caso de questões sobre proteção de dados: 
                    <a href="https://www.gov.br/anpd" className="underline hover:no-underline ml-1" target="_blank" rel="noopener noreferrer">
                      www.gov.br/anpd
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}