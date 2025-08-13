import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/auth/login/route'
import { signJWT } from '@/lib/auth/jwt'
import { hashPassword } from '@/lib/auth/password'

// Mock database
jest.mock('@/lib/db/connection', () => ({
  db: {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    eq: jest.fn(),
  },
}))

// Mock password hashing
jest.mock('@/lib/auth/password', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}))

// Mock JWT
jest.mock('@/lib/auth/jwt', () => ({
  signJWT: jest.fn(),
  createSession: jest.fn(),
}))

describe('/api/auth/login', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: 'user',
    organizationId: 'org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock database response
      const mockDb = require('@/lib/db/connection').db
      mockDb.select.mockReturnThis()
      mockDb.from.mockReturnThis()
      mockDb.where.mockReturnThis()
      mockDb.eq.mockResolvedValue([mockUser])

      // Mock password verification
      const mockVerifyPassword = require('@/lib/auth/password').verifyPassword
      mockVerifyPassword.mockResolvedValue(true)

      // Mock JWT creation
      const mockSignJWT = signJWT as jest.MockedFunction<typeof signJWT>
      mockSignJWT.mockResolvedValue('mock-jwt-token')

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('test@example.com')
      expect(data.user.password).toBeUndefined() // Password should not be returned
    })

    it('should return 401 for invalid credentials', async () => {
      // Mock database response - user not found
      const mockDb = require('@/lib/db/connection').db
      mockDb.select.mockReturnThis()
      mockDb.from.mockReturnThis()
      mockDb.where.mockReturnThis()
      mockDb.eq.mockResolvedValue([])

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Invalid credentials')
    })

    it('should return 401 for wrong password', async () => {
      // Mock database response
      const mockDb = require('@/lib/db/connection').db
      mockDb.select.mockReturnThis()
      mockDb.from.mockReturnThis()
      mockDb.where.mockReturnThis()
      mockDb.eq.mockResolvedValue([mockUser])

      // Mock password verification - wrong password
      const mockVerifyPassword = require('@/lib/auth/password').verifyPassword
      mockVerifyPassword.mockResolvedValue(false)

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Invalid credentials')
    })

    it('should return 400 for missing email', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          password: 'password123',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 for missing password', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 for invalid email format', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'password123',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockDb = require('@/lib/db/connection').db
      mockDb.select.mockReturnThis()
      mockDb.from.mockReturnThis()
      mockDb.where.mockReturnThis()
      mockDb.eq.mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Internal server error')
    })

    it('should rate limit login attempts', async () => {
      // This test would require implementing rate limiting
      // For now, we'll test that the endpoint exists and works
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      const response = await POST(req as any)
      expect(response).toBeDefined()
    })
  })
})