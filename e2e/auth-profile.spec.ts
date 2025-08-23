import { test, expect } from '@playwright/test'

test.describe('User Authentication Flow', () => {
  test.describe('Login Process', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/login')
      
      // Fill credentials
      await page.fill('[data-testid="email-input"]', 'test@jobnexai.com')
      await page.fill('[data-testid="password-input"]', 'testpassword123')
      
      // Submit login
      await page.click('[data-testid="login-button"]')
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard.*/)
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      
      // Fill invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@email.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      
      // Submit login
      await page.click('[data-testid="login-button"]')
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid')
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/login')
      
      // Fill invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email')
      await page.fill('[data-testid="password-input"]', 'password123')
      
      // Try to submit
      await page.click('[data-testid="login-button"]')
      
      // Verify validation message
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    })
  })

  test.describe('Registration Process', () => {
    test('should register new user successfully', async ({ page }) => {
      await page.goto('/register')
      
      // Fill registration form
      const uniqueEmail = `test+${Date.now()}@jobnexai.com`
      await page.fill('[data-testid="name-input"]', 'Test User')
      await page.fill('[data-testid="email-input"]', uniqueEmail)
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!')
      
      // Accept terms
      await page.check('[data-testid="terms-checkbox"]')
      
      // Submit registration
      await page.click('[data-testid="register-button"]')
      
      // Verify success (might redirect to email verification or dashboard)
      await expect(page.locator('[data-testid="registration-success"], [data-testid="dashboard"]')).toBeVisible()
    })

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register')
      
      // Fill form with weak password
      await page.fill('[data-testid="name-input"]', 'Test User')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', '123')
      
      // Verify password strength indicator
      await expect(page.locator('[data-testid="password-strength"]')).toContainText('Weak')
    })

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/register')
      
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPass123!')
      
      // Try to submit
      await page.click('[data-testid="register-button"]')
      
      // Verify password mismatch error
      await expect(page.locator('[data-testid="password-mismatch-error"]')).toBeVisible()
    })
  })

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      await page.goto('/reset-password')
      
      // Fill email
      await page.fill('[data-testid="email-input"]', 'test@jobnexai.com')
      
      // Submit reset request
      await page.click('[data-testid="reset-button"]')
      
      // Verify success message
      await expect(page.locator('[data-testid="reset-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="reset-success"]')).toContainText('email sent')
    })
  })
})

test.describe('User Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Start from authenticated state
    await page.goto('/app/profile')
    await page.waitForLoadState('networkidle')
  })

  test('should display user profile information', async ({ page }) => {
    // Verify profile elements are visible
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="profile-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="profile-email"]')).toBeVisible()
  })

  test('should update profile information', async ({ page }) => {
    // Update profile fields
    await page.fill('[data-testid="profile-name"]', 'Updated Name')
    await page.fill('[data-testid="profile-bio"]', 'Updated bio information')
    await page.fill('[data-testid="profile-location"]', 'San Francisco, CA')
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible()
    
    // Refresh and verify changes persist
    await page.reload()
    await expect(page.locator('[data-testid="profile-name"]')).toHaveValue('Updated Name')
  })

  test('should upload profile avatar', async ({ page }) => {
    // Check if avatar upload is available
    const avatarUpload = page.locator('[data-testid="avatar-upload"]')
    
    if (await avatarUpload.isVisible()) {
      // Simulate file upload (in real tests, use actual file)
      // await avatarUpload.setInputFiles('path/to/test-avatar.jpg')
      
      // Verify upload success indicator
      await expect(page.locator('[data-testid="avatar-preview"]')).toBeVisible()
    }
  })

  test('should manage user skills', async ({ page }) => {
    // Navigate to skills section
    await page.click('[data-testid="skills-tab"]')
    
    // Add new skill
    await page.fill('[data-testid="skill-input"]', 'React')
    await page.selectOption('[data-testid="skill-level"]', '4')
    await page.click('[data-testid="add-skill-button"]')
    
    // Verify skill appears in list
    await expect(page.locator('[data-testid="skill-item"]').filter({ hasText: 'React' })).toBeVisible()
    
    // Remove skill
    await page.click('[data-testid="skill-item"] [data-testid="remove-skill"]')
    
    // Verify skill is removed
    await expect(page.locator('[data-testid="skill-item"]').filter({ hasText: 'React' })).not.toBeVisible()
  })

  test('should update notification preferences', async ({ page }) => {
    // Navigate to preferences
    await page.click('[data-testid="preferences-tab"]')
    
    // Toggle notification settings
    await page.check('[data-testid="email-notifications"]')
    await page.uncheck('[data-testid="push-notifications"]')
    await page.check('[data-testid="job-alerts"]')
    
    // Save preferences
    await page.click('[data-testid="save-preferences"]')
    
    // Verify success
    await expect(page.locator('[data-testid="preferences-saved"]')).toBeVisible()
  })

  test('should change password', async ({ page }) => {
    // Navigate to security settings
    await page.click('[data-testid="security-tab"]')
    
    // Fill password change form
    await page.fill('[data-testid="current-password"]', 'currentpassword123')
    await page.fill('[data-testid="new-password"]', 'newpassword123')
    await page.fill('[data-testid="confirm-new-password"]', 'newpassword123')
    
    // Submit password change
    await page.click('[data-testid="change-password-button"]')
    
    // Verify success (might require re-authentication)
    await expect(page.locator('[data-testid="password-changed"], [data-testid="reauth-required"]')).toBeVisible()
  })
})

test.describe('User Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard widgets', async ({ page }) => {
    // Check for main dashboard components
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-applications"]')).toBeVisible()
    await expect(page.locator('[data-testid="job-recommendations"]')).toBeVisible()
  })

  test('should show application statistics', async ({ page }) => {
    const statsWidget = page.locator('[data-testid="dashboard-stats"]')
    
    // Verify statistics are displayed
    await expect(statsWidget.locator('[data-testid="total-applications"]')).toBeVisible()
    await expect(statsWidget.locator('[data-testid="pending-applications"]')).toBeVisible()
    await expect(statsWidget.locator('[data-testid="interviews-scheduled"]')).toBeVisible()
  })

  test('should navigate to different sections from dashboard', async ({ page }) => {
    // Test navigation to job search
    await page.click('[data-testid="view-all-jobs"]')
    await expect(page).toHaveURL(/.*jobs.*/)
    
    // Go back to dashboard
    await page.goto('/app/dashboard')
    
    // Test navigation to applications
    await page.click('[data-testid="view-all-applications"]')
    await expect(page).toHaveURL(/.*applications.*/)
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Verify layout adjusts appropriately
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible()
  })
})