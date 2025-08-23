import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  
  console.log('🚀 Starting global setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Check if the application is running
    console.log(`Checking if application is running at ${baseURL}`)
    await page.goto(baseURL || 'http://localhost:5173', { timeout: 30000 })
    await page.waitForLoadState('networkidle')
    
    console.log('✅ Application is running and responsive')
    
    // Perform any global setup tasks here
    // For example: seed test data, clear caches, etc.
    
    // Check if test user exists, create if not
    await setupTestUser(page)
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('✅ Global setup completed')
}

async function setupTestUser(page) {
  try {
    const testEmail = process.env.E2E_TEST_EMAIL || 'test@jobnexai.com'
    
    // Navigate to signup page to ensure test user exists
    await page.goto('/login')
    
    // Check if we can login with test credentials
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', process.env.E2E_TEST_PASSWORD || 'testpassword123')
    
    const loginButton = page.locator('[data-testid="login-button"]')
    await loginButton.click()
    
    // If login fails, we might need to create the user
    // This is a simplified version - in practice you'd have API endpoints for test data
    const isLoggedIn = await page.locator('[data-testid="dashboard"]').isVisible({ timeout: 5000 }).catch(() => false)
    
    if (isLoggedIn) {
      console.log('✅ Test user exists and can login')
      await page.goto('/logout') // Logout for clean state
    } else {
      console.log('ℹ️ Test user may not exist or credentials are incorrect')
      // In a real scenario, you'd create the user via API or database setup
    }
    
  } catch (error) {
    console.log('⚠️ Could not verify test user setup:', error.message)
  }
}

export default globalSetup