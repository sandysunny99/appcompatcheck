import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Scanning Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create a new scan', async ({ page }) => {
    await page.goto('/scans/new')
    
    // Fill scan form
    await page.fill('input[name="name"]', 'Test Compatibility Scan')
    await page.selectOption('select[name="type"]', 'compatibility')
    await page.fill('textarea[name="description"]', 'Test scan description')
    
    // Select scan rules
    await page.check('input[name="rules"][value="deprecated-api"]')
    await page.check('input[name="rules"][value="security-issues"]')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to scan details page
    await expect(page).toHaveURL(/\/scans\/[a-zA-Z0-9-]+/)
    await expect(page.locator('h1')).toContainText('Test Compatibility Scan')
  })

  test('should upload files for scanning', async ({ page }) => {
    // Create a new scan first
    await page.goto('/scans/new')
    await page.fill('input[name="name"]', 'File Upload Test')
    await page.selectOption('select[name="type"]', 'compatibility')
    await page.click('button[type="submit"]')
    
    // Wait for scan creation
    await expect(page.locator('h1')).toContainText('File Upload Test')
    
    // Upload test file
    const testFile = path.join(__dirname, '../fixtures/test-code.js')
    await page.setInputFiles('input[type="file"]', testFile)
    
    // Wait for upload to complete
    await expect(page.locator('text=Upload completed')).toBeVisible()
    
    // File should appear in files list
    await expect(page.locator('text=test-code.js')).toBeVisible()
  })

  test('should start scan and show progress', async ({ page }) => {
    // Create scan with uploaded files
    await page.goto('/scans/new')
    await page.fill('input[name="name"]', 'Progress Test Scan')
    await page.selectOption('select[name="type"]', 'compatibility')
    await page.click('button[type="submit"]')
    
    // Upload test file
    const testFile = path.join(__dirname, '../fixtures/test-code.js')
    await page.setInputFiles('input[type="file"]', testFile)
    await expect(page.locator('text=Upload completed')).toBeVisible()
    
    // Start scan
    await page.click('button:has-text("Start Scan")')
    
    // Should show scanning progress
    await expect(page.locator('text=Scanning in progress')).toBeVisible()
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    
    // Wait for scan completion (with timeout)
    await expect(page.locator('text=Scan completed')).toBeVisible({ timeout: 30000 })
  })

  test('should display scan results', async ({ page }) => {
    // Navigate to a completed scan (this would need to be set up in test data)
    await page.goto('/scans')
    
    // Find and click on a completed scan
    await page.click('[data-testid="scan-item"]:has-text("completed")')
    
    // Should show scan results
    await expect(page.locator('h2:has-text("Scan Results")')).toBeVisible()
    await expect(page.locator('[data-testid="issues-summary"]')).toBeVisible()
    
    // Should show issues list
    await expect(page.locator('[data-testid="issues-list"]')).toBeVisible()
  })

  test('should filter and sort scan results', async ({ page }) => {
    // Navigate to scan results
    await page.goto('/scans')
    await page.click('[data-testid="scan-item"]:has-text("completed")')
    
    // Filter by severity
    await page.selectOption('select[name="severity-filter"]', 'high')
    await expect(page.locator('[data-testid="issue-item"]')).toHaveCount(0) // Assuming no high severity issues
    
    // Reset filter
    await page.selectOption('select[name="severity-filter"]', 'all')
    
    // Sort by file name
    await page.selectOption('select[name="sort-by"]', 'file')
    
    // Check that results are sorted
    const firstIssue = page.locator('[data-testid="issue-item"]').first()
    await expect(firstIssue).toBeVisible()
  })

  test('should generate and download reports', async ({ page }) => {
    // Navigate to scan results
    await page.goto('/scans')
    await page.click('[data-testid="scan-item"]:has-text("completed")')
    
    // Generate PDF report
    const [download] = await Promise.all([
      page.waitForDownload(),
      page.click('button:has-text("Export PDF")')
    ])
    
    expect(download.suggestedFilename()).toMatch(/scan-report.*\.pdf/)
    
    // Generate CSV report
    const [csvDownload] = await Promise.all([
      page.waitForDownload(),
      page.click('button:has-text("Export CSV")')
    ])
    
    expect(csvDownload.suggestedFilename()).toMatch(/scan-results.*\.csv/)
  })

  test('should show real-time updates during scanning', async ({ page }) => {
    // Create and start a scan
    await page.goto('/scans/new')
    await page.fill('input[name="name"]', 'Real-time Test')
    await page.selectOption('select[name="type"]', 'compatibility')
    await page.click('button[type="submit"]')
    
    // Upload multiple files for longer scan
    const testFiles = [
      path.join(__dirname, '../fixtures/test-code.js'),
      path.join(__dirname, '../fixtures/test-styles.css'),
    ]
    
    for (const file of testFiles) {
      await page.setInputFiles('input[type="file"]', file)
      await page.waitForTimeout(1000) // Wait between uploads
    }
    
    // Start scan
    await page.click('button:has-text("Start Scan")')
    
    // Should see real-time progress updates
    await expect(page.locator('[data-testid="current-file"]')).toBeVisible()
    await expect(page.locator('[data-testid="files-processed"]')).toBeVisible()
    
    // Progress should update
    const initialProgress = await page.locator('[data-testid="progress-percentage"]').textContent()
    await page.waitForTimeout(5000)
    const updatedProgress = await page.locator('[data-testid="progress-percentage"]').textContent()
    
    expect(updatedProgress).not.toBe(initialProgress)
  })

  test('should handle scan cancellation', async ({ page }) => {
    // Create and start a scan
    await page.goto('/scans/new')
    await page.fill('input[name="name"]', 'Cancellation Test')
    await page.selectOption('select[name="type"]', 'compatibility')
    await page.click('button[type="submit"]')
    
    // Upload test file
    const testFile = path.join(__dirname, '../fixtures/large-test-file.js')
    await page.setInputFiles('input[type="file"]', testFile)
    await expect(page.locator('text=Upload completed')).toBeVisible()
    
    // Start scan
    await page.click('button:has-text("Start Scan")')
    await expect(page.locator('text=Scanning in progress')).toBeVisible()
    
    // Cancel scan
    await page.click('button:has-text("Cancel Scan")')
    
    // Should show cancelled status
    await expect(page.locator('text=Scan cancelled')).toBeVisible()
    await expect(page.locator('button:has-text("Start Scan")')).toBeVisible()
  })

  test('should validate scan configuration', async ({ page }) => {
    await page.goto('/scans/new')
    
    // Try to submit without required fields
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Scan name is required')).toBeVisible()
    await expect(page.locator('text=Scan type is required')).toBeVisible()
  })

  test('should show scan history and statistics', async ({ page }) => {
    await page.goto('/scans')
    
    // Should show scans list
    await expect(page.locator('h1:has-text("Scans")')).toBeVisible()
    await expect(page.locator('[data-testid="scans-table"]')).toBeVisible()
    
    // Should show statistics
    await expect(page.locator('[data-testid="total-scans"]')).toBeVisible()
    await expect(page.locator('[data-testid="completed-scans"]')).toBeVisible()
    await expect(page.locator('[data-testid="issues-found"]')).toBeVisible()
  })

  test('should handle different file types', async ({ page }) => {
    await page.goto('/scans/new')
    await page.fill('input[name="name"]', 'Multi-file Type Test')
    await page.selectOption('select[name="type"]', 'compatibility')
    await page.click('button[type="submit"]')
    
    // Upload different file types
    const files = [
      path.join(__dirname, '../fixtures/test-code.js'),
      path.join(__dirname, '../fixtures/test-code.ts'),
      path.join(__dirname, '../fixtures/test-styles.css'),
      path.join(__dirname, '../fixtures/test-config.json'),
    ]
    
    for (const file of files) {
      await page.setInputFiles('input[type="file"]', file)
      await page.waitForTimeout(500)
    }
    
    // All files should be listed
    await expect(page.locator('text=test-code.js')).toBeVisible()
    await expect(page.locator('text=test-code.ts')).toBeVisible()
    await expect(page.locator('text=test-styles.css')).toBeVisible()
    await expect(page.locator('text=test-config.json')).toBeVisible()
    
    // Start scan
    await page.click('button:has-text("Start Scan")')
    
    // Should process all file types
    await expect(page.locator('text=Scanning in progress')).toBeVisible()
  })
})