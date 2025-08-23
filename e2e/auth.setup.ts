import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle')
  
  // Check if we need to perform authentication
  const isAlreadyLoggedIn = await page.locator('[data-testid="dashboard"]').isVisible().catch(() => false)
  
  if (isAlreadyLoggedIn) {
    console.log('Already authenticated, skipping login')
    await page.context().storageState({ path: authFile })
    return
  }
  
  // Use test credentials from environment or defaults
  const testEmail = process.env.E2E_TEST_EMAIL || 'test@jobnexai.com'
  const testPassword = process.env.E2E_TEST_PASSWORD || 'testpassword123'
  
  console.log(`Attempting login with email: ${testEmail}`)
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', testEmail)
  await page.fill('[data-testid="password-input"]', testPassword)
  
  // Submit form
  await page.click('[data-testid="login-button"]')
  
  // Wait for successful login
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  
  // Verify we're logged in by checking for dashboard elements
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
  
  // Save signed-in state to 'authFile'
  await page.context().storageState({ path: authFile })
  
  console.log('Authentication successful, state saved')
})