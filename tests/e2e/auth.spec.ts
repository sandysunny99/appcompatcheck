import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display validation errors for invalid input', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should display error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Use test credentials (these would be set up in test environment)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show register form', async ({ page }) => {
    await page.goto('/register')
    
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register')
    
    const timestamp = Date.now()
    const email = `test-${timestamp}@example.com`
    
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard')
  })

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/register')
    
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different-password')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard')
    
    // Click logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should maintain session across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Reload page
    await page.reload()
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should handle session expiry', async ({ page }) => {
    // This test would require manipulating the session cookie or waiting for expiry
    // For now, we'll test that the logout endpoint works
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Go to logout endpoint directly
    await page.goto('/api/auth/logout')
    
    // Then try to access protected page
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should show forgot password form', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Forgot password?')
    
    await expect(page).toHaveURL('/forgot-password')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle forgot password request', async ({ page }) => {
    await page.goto('/forgot-password')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Password reset email sent')).toBeVisible()
  })
})

test.describe('Authentication - Role-based Access', () => {
  test('should allow admin to access admin pages', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Navigate to admin page
    await page.goto('/admin')
    
    // Should be able to access admin page
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
  })

  test('should prevent regular user from accessing admin pages', async ({ page }) => {
    // Login as regular user
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'user123')
    await page.click('button[type="submit"]')
    
    // Try to navigate to admin page
    await page.goto('/admin')
    
    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible()
  })
})