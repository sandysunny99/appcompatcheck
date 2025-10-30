import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateId } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'
import { registrationRateLimiter, checkRateLimit } from '@/lib/auth/rate-limit'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string(),
  organizationName: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  try {
    // Apply comprehensive rate limiting
    const rateLimitResponse = await checkRateLimit(request, registrationRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists',
          message: 'An account with this email address already exists',
        },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds)

    // Generate verification token
    const verificationToken = generateId(32)
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    let organizationId: string | null = null

    // Create organization if provided
    if (validatedData.organizationName) {
      const orgId = generateId(16)
      
      await db.insert(organizations).values({
        id: orgId,
        name: validatedData.organizationName,
        slug: validatedData.organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
        plan: 'free',
        settings: {
          maxUsers: 5,
          maxScansPerMonth: 100,
          features: ['basic-scanning', 'basic-reporting'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      organizationId = orgId
    }

    // Create user
    const userId = generateId(16)
    
    await db.insert(users).values({
      id: userId,
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: organizationId ? 'owner' : 'user',
      organizationId,
      verificationToken,
      verificationExpires,
      emailVerified: null,
      isActive: true,
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          browser: true,
          scanComplete: true,
          securityAlerts: true,
        },
        timezone: 'America/New_York',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send verification email
    try {
      await sendVerificationEmail(validatedData.email, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails, but log it
    }

    // Prepare response data (exclude sensitive information)
    const userData = {
      id: userId,
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: organizationId ? 'owner' : 'user',
      organizationId,
      emailVerified: null,
      createdAt: new Date(),
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: userData,
          requiresVerification: true,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

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

    // Handle database errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        {
          error: 'User already exists',
          message: 'An account with this email address already exists',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during registration',
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