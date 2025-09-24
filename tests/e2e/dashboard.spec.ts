import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in a real test, you'd set up proper auth
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should display welcome message for authenticated user', async ({ page }) => {
    // Mock successful authentication
    await page.addInitScript(() => {
      // Mock user data
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if welcome message is displayed
    await expect(page.getByTestId('text-welcome-title')).toBeVisible();
    await expect(page.getByTestId('text-welcome-description')).toBeVisible();
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if statistics cards are displayed
    await expect(page.getByTestId('text-stat-documents')).toBeVisible();
    await expect(page.getByTestId('text-stat-critical-flaws')).toBeVisible();
    await expect(page.getByTestId('text-stat-time-saved')).toBeVisible();
    await expect(page.getByTestId('text-stat-credits')).toBeVisible();
  });

  test('should display document analysis form', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if analysis form is present
    await expect(page.getByTestId('text-analyze-title')).toBeVisible();
    
    // Check if upload tabs are present
    await expect(page.getByTestId('tab-upload')).toBeVisible();
    await expect(page.getByTestId('tab-paste')).toBeVisible();
  });

  test('should allow file upload', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Switch to upload tab
    await page.getByTestId('tab-upload').click();
    
    // Check if file upload component is present
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('should allow text input', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Switch to paste tab
    await page.getByTestId('tab-paste').click();
    
    // Check if textarea is present
    await expect(page.getByTestId('textarea-content')).toBeVisible();
    
    // Test text input
    const textarea = page.getByTestId('textarea-content');
    await textarea.fill('Sample legal document text for testing');
    
    // Check character count
    await expect(page.getByTestId('text-character-count')).toBeVisible();
  });

  test('should display AI provider selection', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if AI provider selector is present
    const providerSelector = page.locator('[data-testid="ai-provider-selector"]');
    await expect(providerSelector).toBeVisible();
  });

  test('should display template selector', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if template selector is present
    await expect(page.getByTestId('template-selector')).toBeVisible();
  });

  test('should allow analysis type selection', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if analysis type options are present
    const generalOption = page.locator('input[value="general"]');
    const contractOption = page.locator('input[value="contract"]');
    const legalOption = page.locator('input[value="legal"]');
    const complianceOption = page.locator('input[value="compliance"]');
    
    await expect(generalOption).toBeVisible();
    await expect(contractOption).toBeVisible();
    await expect(legalOption).toBeVisible();
    await expect(complianceOption).toBeVisible();
    
    // Test selecting different analysis types
    await contractOption.click();
    await expect(contractOption).toBeChecked();
    
    await legalOption.click();
    await expect(legalOption).toBeChecked();
  });

  test('should display analyze button', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if analyze button is present
    await expect(page.getByTestId('button-analyze')).toBeVisible();
    await expect(page.getByTestId('button-analyze')).toContainText('Analisar Documento');
  });

  test('should display recent analyses section', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if recent analyses section is present
    await expect(page.getByTestId('text-recent-title')).toBeVisible();
    await expect(page.getByTestId('text-recent-title')).toHaveText('Análises Recentes');
    
    // Check if view all button is present
    await expect(page.getByTestId('button-view-all')).toBeVisible();
  });

  test('should handle empty state for recent analyses', async ({ page }) => {
    // Mock user authentication with no analyses
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    // Mock empty analyses response
    await page.route('**/api/analyses*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/dashboard');
    
    // Check if empty state is displayed
    await expect(page.getByTestId('text-no-analyses')).toBeVisible();
  });

  test('should display recent analyses when available', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    // Mock analyses response
    await page.route('**/api/analyses*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Test Document',
            content: 'Sample content',
            aiProvider: 'openai',
            aiModel: 'gpt-4',
            analysisType: 'general',
            result: {
              criticalFlaws: ['Issue 1'],
              warnings: ['Warning 1'],
              improvements: ['Improvement 1'],
              riskLevel: 'medium'
            },
            creditsUsed: 1,
            status: 'completed',
            createdAt: new Date().toISOString()
          }
        ])
      });
    });
    
    await page.goto('/dashboard');
    
    // Check if analysis card is displayed
    await expect(page.getByTestId('card-analysis-1')).toBeVisible();
    await expect(page.getByTestId('text-analysis-title-1')).toHaveText('Test Document');
  });

  test('should navigate to analysis details', async ({ page }) => {
    // Mock user authentication and analyses
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.route('**/api/analyses*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Test Document',
            content: 'Sample content',
            aiProvider: 'openai',
            aiModel: 'gpt-4',
            analysisType: 'general',
            result: {
              criticalFlaws: ['Issue 1'],
              warnings: ['Warning 1'],
              improvements: ['Improvement 1'],
              riskLevel: 'medium'
            },
            creditsUsed: 1,
            status: 'completed',
            createdAt: new Date().toISOString()
          }
        ])
      });
    });
    
    await page.goto('/dashboard');
    
    // Click on view analysis button
    await page.getByTestId('button-view-analysis-1').click();
    
    // Should navigate to analysis details
    await expect(page).toHaveURL('/analyses/1');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if dashboard elements are still visible on mobile
    await expect(page.getByTestId('text-welcome-title')).toBeVisible();
    await expect(page.getByTestId('text-analyze-title')).toBeVisible();
    
    // Check if statistics grid adapts to mobile
    const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-4');
    await expect(statsGrid).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    // Mock slow API response
    await page.route('**/api/analyses*', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }, 1000);
    });
    
    await page.goto('/dashboard');
    
    // Check if loading states are displayed
    const loadingSpinner = page.locator('.animate-spin');
    await expect(loadingSpinner).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-token');
    });
    
    // Mock API error
    await page.route('**/api/analyses*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/dashboard');
    
    // Should still display the dashboard without crashing
    await expect(page.getByTestId('text-welcome-title')).toBeVisible();
  });
});
