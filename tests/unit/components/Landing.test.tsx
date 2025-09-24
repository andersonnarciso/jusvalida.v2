import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from '@/pages/landing';

// Mock the hooks
jest.mock('@/hooks/use-supabase-auth');
jest.mock('@/hooks/use-toast');
jest.mock('wouter', () => ({
  useLocation: () => ['/', jest.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseSupabaseAuth = require('@/hooks/use-supabase-auth').useSupabaseAuth;
const mockUseToast = require('@/hooks/use-toast').useToast;

describe('Landing Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseSupabaseAuth.mockReturnValue({
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      user: null,
      loading: false,
      session: null,
      updateProfile: jest.fn(),
      resetPassword: jest.fn(),
    });

    mockUseToast.mockReturnValue({
      toast: jest.fn(),
      dismiss: jest.fn(),
      toasts: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Hero Section', () => {
    it('renders the main title', () => {
      renderWithProviders(<Landing />);
      
      expect(screen.getByTestId('text-hero-title')).toHaveTextContent('Validação Jurídica com IA');
    });

    it('renders the hero description', () => {
      renderWithProviders(<Landing />);
      
      expect(screen.getByTestId('text-hero-description')).toHaveTextContent(
        'Analise contratos, peças e documentos jurídicos com precisão'
      );
    });

    it('renders the start button', () => {
      renderWithProviders(<Landing />);
      
      const startButton = screen.getByTestId('button-start-now');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Começar Agora');
    });
  });

  describe('Statistics Section', () => {
    it('displays loading state for statistics', () => {
      renderWithProviders(<Landing />);
      
      // Should show loading skeletons
      expect(screen.getByTestId('text-stat-documents')).toBeInTheDocument();
      expect(screen.getByTestId('text-stat-accuracy')).toBeInTheDocument();
      expect(screen.getByTestId('text-stat-lawyers')).toBeInTheDocument();
    });

    it('displays statistics when data is loaded', async () => {
      // Mock the API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: () => Promise.resolve({
          totalDocuments: 1000,
          analysisAccuracy: 95,
          activeLawyers: 150,
        }),
      });

      renderWithProviders(<Landing />);

      await waitFor(() => {
        expect(screen.getByTestId('text-stat-documents')).toHaveTextContent('1,000+');
        expect(screen.getByTestId('text-stat-accuracy')).toHaveTextContent('95%');
        expect(screen.getByTestId('text-stat-lawyers')).toHaveTextContent('150+');
      });
    });
  });

  describe('Features Section', () => {
    it('renders all feature cards', () => {
      renderWithProviders(<Landing />);
      
      expect(screen.getByTestId('text-features-title')).toHaveTextContent('Recursos Avançados');
      expect(screen.getByTestId('text-features-description')).toBeInTheDocument();
      
      // Check for feature cards
      for (let i = 0; i < 6; i++) {
        expect(screen.getByTestId(`card-feature-${i}`)).toBeInTheDocument();
      }
    });

    it('displays feature information correctly', () => {
      renderWithProviders(<Landing />);
      
      // Check first feature card
      expect(screen.getByTestId('text-feature-title-0')).toHaveTextContent('IA Multimodal');
      expect(screen.getByTestId('text-feature-description-0')).toHaveTextContent(
        'Integração com OpenAI, Google Gemini, Anthropic Claude e outros provedores de IA.'
      );
    });
  });

  describe('Pricing Section', () => {
    it('renders all pricing plans', () => {
      renderWithProviders(<Landing />);
      
      expect(screen.getByTestId('text-pricing-title')).toHaveTextContent('Planos e Preços');
      
      // Check for all three plans
      expect(screen.getByTestId('card-plan-free')).toBeInTheDocument();
      expect(screen.getByTestId('card-plan-professional')).toBeInTheDocument();
      expect(screen.getByTestId('card-plan-enterprise')).toBeInTheDocument();
    });

    it('displays plan details correctly', () => {
      renderWithProviders(<Landing />);
      
      // Free plan
      expect(screen.getByTestId('text-plan-free-title')).toHaveTextContent('Gratuito');
      expect(screen.getByTestId('text-plan-free-price')).toHaveTextContent('R$ 0');
      
      // Professional plan
      expect(screen.getByTestId('text-plan-pro-title')).toHaveTextContent('Profissional');
      expect(screen.getByTestId('text-plan-pro-price')).toHaveTextContent('R$ 97');
      
      // Enterprise plan
      expect(screen.getByTestId('text-plan-enterprise-title')).toHaveTextContent('Empresarial');
      expect(screen.getByTestId('text-plan-enterprise-price')).toHaveTextContent('R$ 297');
    });

    it('has working plan buttons', () => {
      renderWithProviders(<Landing />);
      
      const freeButton = screen.getByTestId('button-plan-free');
      const proButton = screen.getByTestId('button-plan-professional');
      const enterpriseButton = screen.getByTestId('button-plan-enterprise');
      
      expect(freeButton).toBeInTheDocument();
      expect(proButton).toBeInTheDocument();
      expect(enterpriseButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles start button click', () => {
      renderWithProviders(<Landing />);
      
      const startButton = screen.getByTestId('button-start-now');
      fireEvent.click(startButton);
      
      // Should navigate to dashboard (mocked)
      expect(startButton.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('handles plan button clicks', () => {
      renderWithProviders(<Landing />);
      
      const freeButton = screen.getByTestId('button-plan-free');
      const proButton = screen.getByTestId('button-plan-professional');
      
      fireEvent.click(freeButton);
      expect(freeButton.closest('a')).toHaveAttribute('href', '/register');
      
      fireEvent.click(proButton);
      expect(proButton.closest('a')).toHaveAttribute('href', '/checkout?plan=professional');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithProviders(<Landing />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Validação Jurídica com IA');
      
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements).toHaveLength(3); // Features, Pricing, and other sections
    });

    it('has proper button labels', () => {
      renderWithProviders(<Landing />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('has proper link text', () => {
      renderWithProviders(<Landing />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });
});