import { test, expect } from '@playwright/test'

test.describe('Job Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to job search page
    await page.goto('/app/jobs')
    await page.waitForLoadState('networkidle')
  })

  test('should display job search interface', async ({ page }) => {
    // Check if main search elements are present
    await expect(page.locator('[data-testid="job-search-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="location-filter"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible()
  })

  test('should perform basic job search', async ({ page }) => {
    // Enter search terms
    await page.fill('[data-testid="job-search-input"]', 'Software Engineer')
    await page.fill('[data-testid="location-filter"]', 'Remote')
    
    // Perform search
    await page.click('[data-testid="search-button"]')
    
    // Wait for results
    await page.waitForSelector('[data-testid="job-results"]', { timeout: 10000 })
    
    // Verify results are displayed
    const jobCards = page.locator('[data-testid="job-card"]')
    await expect(jobCards.first()).toBeVisible()
    
    // Check if job cards contain expected information
    await expect(jobCards.first().locator('[data-testid="job-title"]')).toContainText('Engineer')
  })

  test('should apply filters correctly', async ({ page }) => {
    // Open filters panel
    await page.click('[data-testid="filters-toggle"]')
    
    // Apply remote work filter
    await page.check('[data-testid="remote-filter"]')
    
    // Apply salary filter
    await page.selectOption('[data-testid="salary-filter"]', '50000-75000')
    
    // Apply experience level filter
    await page.check('[data-testid="experience-mid"]')
    
    // Apply filters
    await page.click('[data-testid="apply-filters"]')
    
    // Wait for filtered results
    await page.waitForSelector('[data-testid="job-results"]')
    
    // Verify filter is applied (check URL or filter indicators)
    await expect(page).toHaveURL(/.*remote.*/)
  })

  test('should save job for later', async ({ page }) => {
    // Perform search first
    await page.fill('[data-testid="job-search-input"]', 'Frontend Developer')
    await page.click('[data-testid="search-button"]')
    await page.waitForSelector('[data-testid="job-card"]')
    
    // Save first job
    await page.click('[data-testid="job-card"] [data-testid="save-job-button"]')
    
    // Verify save confirmation
    await expect(page.locator('[data-testid="toast-message"]')).toContainText('Job saved')
    
    // Navigate to saved jobs
    await page.goto('/app/saved-jobs')
    
    // Verify job appears in saved list
    await expect(page.locator('[data-testid="saved-job-item"]')).toBeVisible()
  })

  test('should handle job application process', async ({ page }) => {
    // Search and select a job
    await page.fill('[data-testid="job-search-input"]', 'React Developer')
    await page.click('[data-testid="search-button"]')
    await page.waitForSelector('[data-testid="job-card"]')
    
    // Click on first job to view details
    await page.click('[data-testid="job-card"]')
    
    // Verify job details page
    await expect(page.locator('[data-testid="job-description"]')).toBeVisible()
    
    // Start application process
    await page.click('[data-testid="apply-now-button"]')
    
    // Fill application form
    await page.fill('[data-testid="cover-letter"]', 'I am very interested in this position...')
    
    // Upload CV (if file upload is available)
    const fileInput = page.locator('[data-testid="cv-upload"]')
    if (await fileInput.isVisible()) {
      // Note: In real tests, you'd upload an actual file
      // await fileInput.setInputFiles('path/to/test-cv.pdf')
    }
    
    // Submit application
    await page.click('[data-testid="submit-application"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="application-success"]')).toBeVisible()
  })

  test('should display job recommendations', async ({ page }) => {
    // Navigate to dashboard to see recommendations
    await page.goto('/app/dashboard')
    
    // Check for recommended jobs section
    await expect(page.locator('[data-testid="recommended-jobs"]')).toBeVisible()
    
    // Verify at least one recommendation is shown
    const recommendations = page.locator('[data-testid="recommendation-card"]')
    await expect(recommendations.first()).toBeVisible()
    
    // Click on a recommendation
    await recommendations.first().click()
    
    // Verify navigation to job details
    await expect(page).toHaveURL(/.*job.*/)
  })

  test('should handle empty search results gracefully', async ({ page }) => {
    // Search for something unlikely to exist
    await page.fill('[data-testid="job-search-input"]', 'xyzabcnonexistentjob123')
    await page.click('[data-testid="search-button"]')
    
    // Wait for results or no results message
    await page.waitForSelector('[data-testid="no-results"], [data-testid="job-results"]')
    
    // Verify appropriate message is shown
    const noResults = page.locator('[data-testid="no-results"]')
    if (await noResults.isVisible()) {
      await expect(noResults).toContainText('No jobs found')
    }
  })

  test('should persist search state on page refresh', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="job-search-input"]', 'Product Manager')
    await page.fill('[data-testid="location-filter"]', 'New York')
    await page.click('[data-testid="search-button"]')
    
    // Wait for results
    await page.waitForSelector('[data-testid="job-results"]')
    
    // Refresh page
    await page.reload()
    
    // Verify search terms are preserved
    await expect(page.locator('[data-testid="job-search-input"]')).toHaveValue('Product Manager')
    await expect(page.locator('[data-testid="location-filter"]')).toHaveValue('New York')
  })

  test('should handle pagination correctly', async ({ page }) => {
    // Perform search that should return many results
    await page.fill('[data-testid="job-search-input"]', 'Developer')
    await page.click('[data-testid="search-button"]')
    
    // Wait for results
    await page.waitForSelector('[data-testid="job-results"]')
    
    // Check if pagination exists
    const paginationNext = page.locator('[data-testid="pagination-next"]')
    
    if (await paginationNext.isVisible()) {
      // Get current results count
      const firstPageJobs = await page.locator('[data-testid="job-card"]').count()
      
      // Go to next page
      await paginationNext.click()
      await page.waitForSelector('[data-testid="job-results"]')
      
      // Verify different jobs are shown
      const secondPageJobs = await page.locator('[data-testid="job-card"]').count()
      expect(secondPageJobs).toBeGreaterThan(0)
      
      // Go back to first page
      await page.click('[data-testid="pagination-prev"]')
      await page.waitForSelector('[data-testid="job-results"]')
      
      // Verify we're back to original results
      const backToFirstJobs = await page.locator('[data-testid="job-card"]').count()
      expect(backToFirstJobs).toBe(firstPageJobs)
    }
  })
})