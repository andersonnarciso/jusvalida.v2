import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { Footer } from "@/components/ui/footer";
import { UserProvider, useUser } from "@/hooks/use-user";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import { CookieConsentProvider } from "@/hooks/use-cookie-preferences";
import { LandingHeader } from "@/components/layout/landing-header";
import { ProtectedHeader } from "@/components/layout/protected-header";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import LoginSupabase from "@/pages/login-supabase";
import RegisterSupabase from "@/pages/register-supabase";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Profile from "@/pages/profile";
import Billing from "@/pages/billing";
import Support from "@/pages/support";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import Analyses from "@/pages/analyses";
import AnalysisDetails from "@/pages/analysis-details";
import Trash from "@/pages/trash";
import BatchProcessing from "@/pages/batch";
import Admin from "@/pages/admin";
import PrivacyPolicy from "@/pages/privacy-policy";
import CookiePolicy from "@/pages/cookie-policy";
import TermsOfService from "@/pages/terms-of-service";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";

// Componente para renderizar o cabeçalho correto com base na rota e autenticação
function Header() {
  const [location] = useLocation();
  const { isAuthenticated } = useUser();
  
  // Rotas públicas que devem usar o cabeçalho de landing
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/privacy-policy', '/cookie-policy', '/terms-of-service', '/contact'];
  
  // Verifica se está em uma rota pública
  const isPublicRoute = publicRoutes.includes(location);
  
  if (isPublicRoute) {
    return <LandingHeader />;
  }
  
  // Para todas as outras rotas, mostrar o cabeçalho protegido se autenticado
  if (isAuthenticated) {
    return <ProtectedHeader />;
  }
  
  // Se não autenticado e não em rota pública, não mostrar cabeçalho
  return null;
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={LoginSupabase} />
          <Route path="/register" component={RegisterSupabase} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/billing" component={Billing} />
          <Route path="/support" component={Support} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/analyses/:id" component={AnalysisDetails} />
          <Route path="/analyses" component={Analyses} />
          <Route path="/trash" component={Trash} />
          <Route path="/batch" component={BatchProcessing} />
          <Route path="/admin" component={Admin} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/cookie-policy" component={CookiePolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/contact" component={Contact} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CookieConsentProvider>
        <SupabaseAuthProvider>
          <UserProvider>
            <TooltipProvider>
            <Toaster />
            <Router />
            </TooltipProvider>
          </UserProvider>
        </SupabaseAuthProvider>
      </CookieConsentProvider>
    </QueryClientProvider>
  );
}

export default App;
