import { test, expect } from '@playwright/test';

// Mock the auth responses
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Supabase auth responses
    await page.route('**/auth/v1/token', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
          user: mockUser,
        }),
      });
    });

    await page.route('**/auth/v1/user', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    // Mock job applications endpoint
    await page.route('**/rest/v1/job_applications*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'new-app-id' }]),
        });
      }
    });
  });

  test('should allow user to sign in with email and password', async ({ page }) => {
    await page.goto('/login');

    // Fill in the login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Click the sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Check if user is redirected to dashboard
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    // Click the sign in button without filling the form
    await page.click('button[type="submit"]');

    // Check for validation error messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Mock invalid credentials response
    await page.route('**/auth/v1/token', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid login credentials',
          message: 'Email or password is incorrect',
        }),
      });
    });

    await page.goto('/login');

    // Fill in the login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Click the sign in button
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });

  test('should redirect authenticated user from login page to dashboard', async ({ page }) => {
    // Set localStorage to simulate authenticated user
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('sb-auth-token', JSON.stringify('test-access-token'));
    });

    // Reload the page
    await page.reload();

    // Check if user is redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow user to sign out', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on the user menu
    await page.click('button[aria-label="User menu"]');

    // Click on the sign out button
    await page.click('text=Sign Out');

    // Wait for navigation to login page
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');

    // Check if auth token is removed from localStorage
    const authToken = await page.evaluate(() => localStorage.getItem('sb-auth-token'));
    expect(authToken).toBeNull();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated user from protected route to login', async ({ page }) => {
    await page.goto('/dashboard/jobs');

    // Check if user is redirected to login page
    await expect(page).toHaveURL('/login');
  });

  test('should allow authenticated user to access protected routes', async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/v1/user', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    // Set localStorage to simulate authenticated user
    await page.goto('/dashboard/jobs');
    await page.evaluate(() => {
      localStorage.setItem('sb-auth-token', JSON.stringify('test-access-token'));
    });

    // Reload the page
    await page.reload();

    // Check if user can access the protected route
    await expect(page).toHaveURL('/dashboard/jobs');
    await expect(page.locator('h2')).toContainText('Suivi des candidatures');
  });
});

test.describe('Password Reset Flow', () => {
  test('should allow user to request password reset', async ({ page }) => {
    // Mock password reset endpoint
    await page.route('**/auth/v1/recover', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/forgot-password');

    // Fill in the email form
    await page.fill('input[name="email"]', 'test@example.com');

    // Click the reset password button
    await page.click('button[type="submit"]');

    // Check for success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });

  test('should show error for invalid email in password reset', async ({ page }) => {
    // Mock error response
    await page.route('**/auth/v1/recover', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid email',
          message: 'Email not found',
        }),
      });
    });

    await page.goto('/forgot-password');

    // Fill in the email form with invalid email
    await page.fill('input[name="email"]', 'nonexistent@example.com');

    // Click the reset password button
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator('text=Email not found')).toBeVisible();
  });
});