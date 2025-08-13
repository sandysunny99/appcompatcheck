import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous'
    const { success, limit, reset, remaining } = await rateLimit(
      identifier,
      10, // 10 attempts
      60 * 15 // 15 minutes
    )

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many login attempts',
          message: 'Please try again later',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }

    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.',
        },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email not verified',
          message: 'Please verify your email address before logging in.',
        },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        { status: 401 }
      )
    }

    // Update last login
    await db
      .update(users)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Generate JWT token
    const tokenExpiry = validatedData.rememberMe ? '30d' : '7d'
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: tokenExpiry }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '90d' }
    )

    // Prepare response data (exclude sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      avatar: user.avatar,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token,
          refreshToken,
          expiresIn: tokenExpiry,
        },
      },
      { status: 200 }
    )

    // Set HTTP-only cookies for tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    }

    response.cookies.set('auth-token', token, {
      ...cookieOptions,
      maxAge: validatedData.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
    })

    response.cookies.set('refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 90 * 24 * 60 * 60, // 90 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid input data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}