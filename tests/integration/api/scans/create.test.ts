import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/scans/route'
import { verifySession } from '@/lib/auth/jwt'

// Mock authentication
jest.mock('@/lib/auth/jwt', () => ({
  verifySession: jest.fn(),
}))

// Mock database
jest.mock('@/lib/db/connection', () => ({
  db: {
    insert: jest.fn(),
    into: jest.fn(),
    values: jest.fn(),
    returning: jest.fn(),
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    eq: jest.fn(),
  },
}))

// Mock scanning service
jest.mock('@/lib/scanning/scan-manager', () => ({
  ScanManager: jest.fn().mockImplementation(() => ({
    createScan: jest.fn(),
    startScan: jest.fn(),
  })),
}))

describe('/api/scans', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    organizationId: 'org-1',
  }

  const mockScan = {
    id: 'scan-1',
    name: 'Test Scan',
    type: 'compatibility',
    status: 'pending',
    organizationId: 'org-1',
    userId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/scans', () => {
    it('should create a new scan successfully', async () => {
      // Mock authentication
      const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>
      mockVerifySession.mockResolvedValue(mockUser)

      // Mock database operations
      const mockDb = require('@/lib/db/connection').db
      mockDb.insert.mockReturnThis()
      mockDb.into.mockReturnThis()
      mockDb.values.mockReturnThis()
      mockDb.returning.mockResolvedValue([mockScan])

      // Mock scan manager
      const MockScanManager = require('@/lib/scanning/scan-manager').ScanManager
      const mockScanManager = new MockScanManager()
      mockScanManager.createScan.mockResolvedValue(mockScan)
      mockScanManager.startScan.mockResolvedValue(true)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': 'session=valid-session-token',
        },
        body: {
          name: 'Test Scan',
          type: 'compatibility',
          config: {
            rules: ['deprecated-api', 'security-issues'],
            fileTypes: ['js', 'ts'],
          },
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.scan.name).toBe('Test Scan')
      expect(data.scan.id).toBe('scan-1')
    })

    it('should return 401 when user is not authenticated', async () => {
      // Mock authentication failure
      const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>
      mockVerifySession.mockResolvedValue(null)

      const { req } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Scan',
          type: 'compatibility',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Unauthorized')
    })

    it('should return 400 for missing required fields', async () => {
      // Mock authentication
      const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>
      mockVerifySession.mockResolvedValue(mockUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': 'session=valid-session-token',
        },
        body: {
          // Missing required 'name' field
          type: 'compatibility',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toBeDefined()
    })

    it('should return 400 for invalid scan type', async () => {
      // Mock authentication
      const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>
      mockVerifySession.mockResolvedValue(mockUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': 'session=valid-session-token',
        },
        body: {
          name: 'Test Scan',
          type: 'invalid-type', // Invalid scan type
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      // Mock authentication
      const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>
      mockVerifySession.mockResolvedValue(mockUser)

      // Mock database error
      const mockDb = require('@/lib/db/connection').db
      mockDb.insert.mockReturnThis()
      mockDb.into.mockReturnThis()
      mockDb.values.mockReturnThis()
      mockDb.returning.mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': 'session=valid-session-token',
        },
        body: {
          name: 'Test Scan',
          type: 'compatibility',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Internal server error')
    })

    it('should validate scan configuration', async () => {
      // Mock authentication
      const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>
      mockVerifySession.mockResolvedValue(mockUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': 'session=valid-session-token',
        },
        body: {
          name: 'Test Scan',
          type: 'compatibility',
          config: {
            rules: [], // Empty rules array should be invalid
            fileTypes: ['invalid-type'], // Invalid file type
          },
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should enforce organization access control', async () => {
      // Mock authentication with different organization
      const differentOrgUser = {
        ...mockUser,
        organizationId: 'different-org',
      }
      
      const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>
      mockVerifySession.mockResolvedValue(differentOrgUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': 'session=valid-session-token',
        },
        body: {
          name: 'Test Scan',
          type: 'compatibility',
          organizationId: 'org-1', // Different from user's organization
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Access denied')
    })
  })
})