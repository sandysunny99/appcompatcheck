import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
    console.log(`📡 Checking if application is ready at ${baseURL}`)
    
    // Try to connect to the application
    await page.goto(baseURL, { timeout: 60000 })
    
    // Set up test data
    console.log('📝 Setting up test data...')
    
    // Create test users
    await setupTestUsers(page, baseURL)
    
    // Create test organizations
    await setupTestOrganizations(page, baseURL)
    
    // Create test scans
    await setupTestScans(page, baseURL)
    
    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestUsers(page: any, baseURL: string) {
  const testUsers = [
    {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    },
    {
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user',
    },
  ]

  for (const user of testUsers) {
    try {
      // Try to register the user
      const response = await page.request.post(`${baseURL}/api/auth/register`, {
        data: user,
      })
      
      if (response.ok()) {
        console.log(`✅ Created test user: ${user.email}`)
      } else if (response.status() === 409) {
        console.log(`ℹ️ Test user already exists: ${user.email}`)
      } else {
        console.warn(`⚠️ Failed to create user ${user.email}: ${response.status()}`)
      }
    } catch (error) {
      console.warn(`⚠️ Error creating user ${user.email}:`, error)
    }
  }
}

async function setupTestOrganizations(page: any, baseURL: string) {
  // Login as admin to create organizations
  const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
    data: {
      email: 'admin@example.com',
      password: 'admin123',
    },
  })

  if (!loginResponse.ok()) {
    console.warn('⚠️ Could not login as admin to create organizations')
    return
  }

  const testOrganizations = [
    {
      name: 'Test Organization',
      slug: 'test-org',
      description: 'Test organization for e2e tests',
    },
    {
      name: 'Demo Company',
      slug: 'demo-company',
      description: 'Demo company for testing',
    },
  ]

  for (const org of testOrganizations) {
    try {
      const response = await page.request.post(`${baseURL}/api/organizations`, {
        data: org,
      })
      
      if (response.ok()) {
        console.log(`✅ Created test organization: ${org.name}`)
      } else if (response.status() === 409) {
        console.log(`ℹ️ Test organization already exists: ${org.name}`)
      } else {
        console.warn(`⚠️ Failed to create organization ${org.name}: ${response.status()}`)
      }
    } catch (error) {
      console.warn(`⚠️ Error creating organization ${org.name}:`, error)
    }
  }
}

async function setupTestScans(page: any, baseURL: string) {
  // Login as test user to create scans
  const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
    data: {
      email: 'test@example.com',
      password: 'password123',
    },
  })

  if (!loginResponse.ok()) {
    console.warn('⚠️ Could not login as test user to create scans')
    return
  }

  const testScans = [
    {
      name: 'Completed Test Scan',
      type: 'compatibility',
      description: 'A completed scan for testing',
      status: 'completed',
    },
    {
      name: 'Pending Test Scan',
      type: 'security',
      description: 'A pending scan for testing',
      status: 'pending',
    },
  ]

  for (const scan of testScans) {
    try {
      const response = await page.request.post(`${baseURL}/api/scans`, {
        data: scan,
      })
      
      if (response.ok()) {
        console.log(`✅ Created test scan: ${scan.name}`)
      } else {
        console.warn(`⚠️ Failed to create scan ${scan.name}: ${response.status()}`)
      }
    } catch (error) {
      console.warn(`⚠️ Error creating scan ${scan.name}:`, error)
    }
  }
}

export default globalSetup