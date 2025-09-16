import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { Footer } from "@/components/ui/footer";
import { AuthProvider } from "@/hooks/use-auth";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import { CookieConsentProvider } from "@/hooks/use-cookie-preferences";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import LoginSupabase from "@/pages/login-supabase";
import RegisterSupabase from "@/pages/register-supabase";
import Profile from "@/pages/profile";
import Billing from "@/pages/billing";
import Support from "@/pages/support";
import Checkout from "@/pages/checkout";
import Analyses from "@/pages/analyses";
import AnalysisDetails from "@/pages/analysis-details";
import Trash from "@/pages/trash";
import BatchProcessing from "@/pages/batch";
import Admin from "@/pages/admin";
import PrivacyPolicy from "@/pages/privacy-policy";
import CookiePolicy from "@/pages/cookie-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={LoginSupabase} />
          <Route path="/register" component={RegisterSupabase} />
          <Route path="/login-old" component={Login} />
          <Route path="/register-old" component={Register} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/billing" component={Billing} />
          <Route path="/support" component={Support} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/analyses/:id" component={AnalysisDetails} />
          <Route path="/analyses" component={Analyses} />
          <Route path="/trash" component={Trash} />
          <Route path="/batch" component={BatchProcessing} />
          <Route path="/admin" component={Admin} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/cookie-policy" component={CookiePolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
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
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </CookieConsentProvider>
    </QueryClientProvider>
  );
}

export default App;
