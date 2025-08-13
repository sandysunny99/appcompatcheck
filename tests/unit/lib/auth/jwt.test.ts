import { signJWT, verifyJWT, createSession, verifySession } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock crypto for consistent testing
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => 'test-uuid-123',
}))

describe('JWT Authentication', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    organizationId: 'org-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signJWT', () => {
    it('should create a valid JWT token', async () => {
      const token = await signJWT(mockUser)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include user data in token payload', async () => {
      const token = await signJWT(mockUser)
      const verified = await verifyJWT(token)
      
      expect(verified.payload.id).toBe(mockUser.id)
      expect(verified.payload.email).toBe(mockUser.email)
      expect(verified.payload.role).toBe(mockUser.role)
    })
  })

  describe('verifyJWT', () => {
    it('should verify a valid token', async () => {
      const token = await signJWT(mockUser)
      const result = await verifyJWT(token)
      
      expect(result.payload).toBeDefined()
      expect(result.payload.id).toBe(mockUser.id)
    })

    it('should reject an invalid token', async () => {
      const result = await verifyJWT('invalid-token')
      
      expect(result.payload).toBeNull()
    })

    it('should reject an expired token', async () => {
      // Create token with very short expiry
      const shortLivedToken = await signJWT(mockUser, '1ms')
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const result = await verifyJWT(shortLivedToken)
      expect(result.payload).toBeNull()
    })
  })

  describe('createSession', () => {
    it('should create session cookie', async () => {
      const mockCookies = {
        set: jest.fn(),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)

      await createSession(mockUser)

      expect(mockCookies.set).toHaveBeenCalledWith(
        'session',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: false, // false in test environment
          sameSite: 'lax',
          maxAge: 86400,
        })
      )
    })
  })

  describe('verifySession', () => {
    it('should verify valid session', async () => {
      const token = await signJWT(mockUser)
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: token }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)

      const session = await verifySession()

      expect(session).toBeDefined()
      expect(session?.id).toBe(mockUser.id)
    })

    it('should return null for invalid session', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)

      const session = await verifySession()

      expect(session).toBeNull()
    })

    it('should return null when no session cookie exists', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)

      const session = await verifySession()

      expect(session).toBeNull()
    })
  })
})