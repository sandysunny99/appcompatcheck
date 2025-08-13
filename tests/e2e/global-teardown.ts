import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
    console.log(`🔗 Connecting to ${baseURL} for cleanup`)
    
    // Login as admin for cleanup operations
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'admin@example.com',
        password: 'admin123',
      },
    })

    if (loginResponse.ok()) {
      console.log('🔑 Logged in as admin for cleanup')
      
      // Clean up test data
      await cleanupTestData(page, baseURL)
    } else {
      console.warn('⚠️ Could not login as admin for cleanup')
    }

    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any, baseURL: string) {
  console.log('🗑️ Cleaning up test data...')

  // Clean up test scans
  await cleanupTestScans(page, baseURL)
  
  // Clean up test files
  await cleanupTestFiles(page, baseURL)
  
  // Clean up test notifications
  await cleanupTestNotifications(page, baseURL)
  
  // Note: We typically don't clean up users and organizations
  // as they might be needed across test runs and are relatively harmless
}

async function cleanupTestScans(page: any, baseURL: string) {
  try {
    // Get all test scans
    const scansResponse = await page.request.get(`${baseURL}/api/scans`)
    
    if (scansResponse.ok()) {
      const scansData = await scansResponse.json()
      const testScans = scansData.scans?.filter((scan: any) => 
        scan.name.includes('Test') || 
        scan.name.includes('test') ||
        scan.description?.includes('test')
      ) || []
      
      for (const scan of testScans) {
        try {
          const deleteResponse = await page.request.delete(`${baseURL}/api/scans/${scan.id}`)
          if (deleteResponse.ok()) {
            console.log(`✅ Cleaned up test scan: ${scan.name}`)
          }
        } catch (error) {
          console.warn(`⚠️ Failed to cleanup scan ${scan.name}:`, error)
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error during scan cleanup:', error)
  }
}

async function cleanupTestFiles(page: any, baseURL: string) {
  try {
    // Clean up uploaded test files
    const response = await page.request.post(`${baseURL}/api/files/cleanup`, {
      data: { testFilesOnly: true },
    })
    
    if (response.ok()) {
      console.log('✅ Cleaned up test files')
    }
  } catch (error) {
    console.warn('⚠️ Error during file cleanup:', error)
  }
}

async function cleanupTestNotifications(page: any, baseURL: string) {
  try {
    // Clear test notifications
    const response = await page.request.delete(`${baseURL}/api/notifications/test`)
    
    if (response.ok()) {
      console.log('✅ Cleaned up test notifications')
    }
  } catch (error) {
    console.warn('⚠️ Error during notification cleanup:', error)
  }
}

export default globalTeardown