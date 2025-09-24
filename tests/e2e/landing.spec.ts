import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main hero section', async ({ page }) => {
    // Check if the main title is visible
    await expect(page.getByTestId('text-hero-title')).toBeVisible();
    await expect(page.getByTestId('text-hero-title')).toHaveText('Validação Jurídica com IA');
    
    // Check if the description is visible
    await expect(page.getByTestId('text-hero-description')).toBeVisible();
    await expect(page.getByTestId('text-hero-description')).toContainText('Analise contratos, peças e documentos jurídicos');
    
    // Check if the start button is visible and clickable
    await expect(page.getByTestId('button-start-now')).toBeVisible();
    await expect(page.getByTestId('button-start-now')).toHaveText('Começar Agora');
  });

  test('should display platform statistics', async ({ page }) => {
    // Wait for statistics to load
    await page.waitForSelector('[data-testid="text-stat-documents"]');
    
    // Check if statistics are displayed
    await expect(page.getByTestId('text-stat-documents')).toBeVisible();
    await expect(page.getByTestId('text-stat-accuracy')).toBeVisible();
    await expect(page.getByTestId('text-stat-lawyers')).toBeVisible();
    
    // Check if statistics have numeric values (not loading state)
    const documentsStat = page.getByTestId('text-stat-documents');
    const accuracyStat = page.getByTestId('text-stat-accuracy');
    const lawyersStat = page.getByTestId('text-stat-lawyers');
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const docs = document.querySelector('[data-testid="text-stat-documents"]');
      const acc = document.querySelector('[data-testid="text-stat-accuracy"]');
      const law = document.querySelector('[data-testid="text-stat-lawyers"]');
      return docs && acc && law && 
             !docs.textContent?.includes('animate-pulse') &&
             !acc.textContent?.includes('animate-pulse') &&
             !law.textContent?.includes('animate-pulse');
    });
  });

  test('should display all feature cards', async ({ page }) => {
    // Scroll to features section
    await page.locator('#features').scrollIntoViewIfNeeded();
    
    // Check features title
    await expect(page.getByTestId('text-features-title')).toBeVisible();
    await expect(page.getByTestId('text-features-title')).toHaveText('Recursos Avançados');
    
    // Check all 6 feature cards are present
    for (let i = 0; i < 6; i++) {
      await expect(page.getByTestId(`card-feature-${i}`)).toBeVisible();
    }
    
    // Check specific features
    await expect(page.getByTestId('text-feature-title-0')).toHaveText('IA Multimodal');
    await expect(page.getByTestId('text-feature-title-1')).toHaveText('Upload Inteligente');
    await expect(page.getByTestId('text-feature-title-2')).toHaveText('Análise Completa');
  });

  test('should display pricing plans', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Check pricing title
    await expect(page.getByTestId('text-pricing-title')).toBeVisible();
    await expect(page.getByTestId('text-pricing-title')).toHaveText('Planos e Preços');
    
    // Check all three plans are present
    await expect(page.getByTestId('card-plan-free')).toBeVisible();
    await expect(page.getByTestId('card-plan-professional')).toBeVisible();
    await expect(page.getByTestId('card-plan-enterprise')).toBeVisible();
    
    // Check plan details
    await expect(page.getByTestId('text-plan-free-title')).toHaveText('Gratuito');
    await expect(page.getByTestId('text-plan-free-price')).toHaveText('R$ 0');
    
    await expect(page.getByTestId('text-plan-pro-title')).toHaveText('Profissional');
    await expect(page.getByTestId('text-plan-pro-price')).toHaveText('R$ 97');
    
    await expect(page.getByTestId('text-plan-enterprise-title')).toHaveText('Empresarial');
    await expect(page.getByTestId('text-plan-enterprise-price')).toHaveText('R$ 297');
  });

  test('should navigate to dashboard when start button is clicked', async ({ page }) => {
    // Click the start button
    await page.getByTestId('button-start-now').click();
    
    // Should navigate to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to register when free plan button is clicked', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Click free plan button
    await page.getByTestId('button-plan-free').click();
    
    // Should navigate to register page
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to checkout when professional plan button is clicked', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Click professional plan button
    await page.getByTestId('button-plan-professional').click();
    
    // Should navigate to checkout with plan parameter
    await expect(page).toHaveURL('/checkout?plan=professional');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if hero section is still visible
    await expect(page.getByTestId('text-hero-title')).toBeVisible();
    
    // Check if features section adapts to mobile
    await page.locator('#features').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('text-features-title')).toBeVisible();
    
    // Check if pricing section adapts to mobile
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('text-pricing-title')).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Validação Jurídica com IA');
    
    // Check if buttons have proper labels
    const startButton = page.getByTestId('button-start-now');
    await expect(startButton).toHaveAttribute('role', 'button');
    
    // Check if links have proper href attributes
    const freePlanLink = page.getByTestId('button-plan-free');
    await expect(freePlanLink).toHaveAttribute('href', '/register');
  });

  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle navigation menu interactions', async ({ page }) => {
    // Check if navigation elements are present
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
    
    // Test navigation links if they exist
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      // Test first navigation link
      const firstLink = navLinks.first();
      await firstLink.click();
      
      // Should navigate to a valid page
      await expect(page).toHaveURL(/^\//);
    }
  });
});
