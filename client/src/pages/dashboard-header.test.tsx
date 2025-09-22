import { test, expect } from '@playwright/test';

test('Dashboard header should be visible', async ({ page }) => {
  // Navegar para a página de dashboard
  await page.goto('/dashboard');
  
  // Verificar se o cabeçalho está presente
  await expect(page.getByTestId('link-dashboard-home')).toBeVisible();
  await expect(page.getByTestId('button-user-menu')).toBeVisible();
});