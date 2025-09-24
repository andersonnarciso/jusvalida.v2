import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      // Check if login form elements are present
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show password toggle functionality', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const toggleButton = page.locator('button[aria-label*="password"]');
      
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle to hide password again
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should validate email format', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      // Enter invalid email
      await emailInput.fill('invalid-email');
      await submitButton.click();
      
      // Should show validation error
      await expect(page.locator('text=Email inválido')).toBeVisible();
    });

    test('should handle login with valid credentials', async ({ page }) => {
      // Mock successful login
      await page.route('**/auth/v1/token', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token',
            user: {
              id: '1',
              email: 'test@example.com',
              user_metadata: { first_name: 'Test' }
            }
          })
        });
      });
      
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle login with invalid credentials', async ({ page }) => {
      // Mock failed login
      await page.route('**/auth/v1/token', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid credentials'
          })
        });
      });
      
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('test@example.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();
      
      // Should show error message
      await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
    });

    test('should navigate to register page', async ({ page }) => {
      const registerLink = page.locator('a[href="/register"]');
      await expect(registerLink).toBeVisible();
      
      await registerLink.click();
      await expect(page).toHaveURL('/register');
    });

    test('should navigate to forgot password page', async ({ page }) => {
      const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
      await expect(forgotPasswordLink).toBeVisible();
      
      await forgotPasswordLink.click();
      await expect(page).toHaveURL('/forgot-password');
    });
  });

  test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should display registration form', async ({ page }) => {
      // Check if all form fields are present
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="acceptTerms"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      
      // Try to submit without filling required fields
      await submitButton.click();
      
      // Should show validation errors
      await expect(page.locator('text=Campo obrigatório')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      const emailInput = page.locator('input[name="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('invalid-email');
      await submitButton.click();
      
      // Should show email validation error
      await expect(page.locator('text=Email inválido')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await passwordInput.fill('123');
      await submitButton.click();
      
      // Should show password strength error
      await expect(page.locator('text=Senha muito fraca')).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
      const firstNameInput = page.locator('input[name="firstName"]');
      const lastNameInput = page.locator('input[name="lastName"]');
      const usernameInput = page.locator('input[name="username"]');
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      // Fill all fields except terms
      await firstNameInput.fill('Test');
      await lastNameInput.fill('User');
      await usernameInput.fill('testuser');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      await submitButton.click();
      
      // Should show terms error
      await expect(page.locator('text=Você deve aceitar os termos de uso')).toBeVisible();
    });

    test('should handle successful registration', async ({ page }) => {
      // Mock successful registration
      await page.route('**/auth/v1/signup', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token',
            user: {
              id: '1',
              email: 'test@example.com',
              user_metadata: { 
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser'
              }
            }
          })
        });
      });
      
      const firstNameInput = page.locator('input[name="firstName"]');
      const lastNameInput = page.locator('input[name="lastName"]');
      const usernameInput = page.locator('input[name="username"]');
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const termsCheckbox = page.locator('input[name="acceptTerms"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await firstNameInput.fill('Test');
      await lastNameInput.fill('User');
      await usernameInput.fill('testuser');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await termsCheckbox.check();
      
      await submitButton.click();
      
      // Should show success message and redirect
      await expect(page.locator('text=Conta criada com sucesso!')).toBeVisible();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle registration with existing email', async ({ page }) => {
      // Mock email already exists error
      await page.route('**/auth/v1/signup', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'User already registered'
          })
        });
      });
      
      const firstNameInput = page.locator('input[name="firstName"]');
      const lastNameInput = page.locator('input[name="lastName"]');
      const usernameInput = page.locator('input[name="username"]');
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const termsCheckbox = page.locator('input[name="acceptTerms"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await firstNameInput.fill('Test');
      await lastNameInput.fill('User');
      await usernameInput.fill('testuser');
      await emailInput.fill('existing@example.com');
      await passwordInput.fill('password123');
      await termsCheckbox.check();
      
      await submitButton.click();
      
      // Should show error message
      await expect(page.locator('text=Erro ao criar conta')).toBeVisible();
    });
  });

  test.describe('Forgot Password Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/forgot-password');
    });

    test('should display forgot password form', async ({ page }) => {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should handle password reset request', async ({ page }) => {
      // Mock successful password reset
      await page.route('**/auth/v1/recover', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset email sent'
          })
        });
      });
      
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('test@example.com');
      await submitButton.click();
      
      // Should show success message
      await expect(page.locator('text=Email de recuperação enviado')).toBeVisible();
    });

    test('should handle invalid email for password reset', async ({ page }) => {
      // Mock email not found error
      await page.route('**/auth/v1/recover', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email not found'
          })
        });
      });
      
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('nonexistent@example.com');
      await submitButton.click();
      
      // Should show error message
      await expect(page.locator('text=Email não encontrado')).toBeVisible();
    });
  });

  test.describe('Reset Password Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/reset-password?token=mock-token');
    });

    test('should display reset password form', async ({ page }) => {
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await passwordInput.fill('password123');
      await confirmPasswordInput.fill('differentpassword');
      await submitButton.click();
      
      // Should show password mismatch error
      await expect(page.locator('text=Senhas não coincidem')).toBeVisible();
    });

    test('should handle successful password reset', async ({ page }) => {
      // Mock successful password reset
      await page.route('**/auth/v1/verify', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset successful'
          })
        });
      });
      
      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await passwordInput.fill('newpassword123');
      await confirmPasswordInput.fill('newpassword123');
      await submitButton.click();
      
      // Should show success message and redirect
      await expect(page.locator('text=Senha alterada com sucesso')).toBeVisible();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Logout', () => {
    test('should logout user and redirect to login', async ({ page }) => {
      // Mock authenticated user
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      await page.goto('/dashboard');
      
      // Mock logout
      await page.route('**/auth/v1/logout', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Logged out successfully'
          })
        });
      });
      
      // Find and click logout button (assuming it exists in the header)
      const logoutButton = page.locator('button:has-text("Sair")');
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        
        // Should redirect to login page
        await expect(page).toHaveURL('/login');
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      const protectedRoutes = ['/dashboard', '/profile', '/billing', '/analyses'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/login');
      }
    });

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // Mock authenticated user
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      const protectedRoutes = ['/dashboard', '/profile', '/billing'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        // Should not redirect to login
        await expect(page).not.toHaveURL('/login');
      }
    });
  });
});
