import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { db } from '@/lib/db/drizzle';
import { users, organizations, scans } from '@/lib/db/schema';
import { eq, and, or, desc, like, count, sql } from 'drizzle-orm';
import { logActivity } from '@/lib/db/activity';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, Permission.USER_READ)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const organizationId = searchParams.get('organizationId');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query with user information and scan counts
    let query = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
        organizationName: organizations.name,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        scanCount: sql<number>`COALESCE(${sql`scan_counts.count`}, 0)`,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .leftJoin(
        sql`(
          SELECT user_id, COUNT(*) as count 
          FROM scan_sessions 
          GROUP BY user_id
        ) AS scan_counts`,
        sql`scan_counts.user_id = ${users.id}`
      );

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`, `%${search}%`)
        )
      );
    }
    
    if (role && role !== 'all') {
      conditions.push(eq(users.role, role));
    }
    
    if (organizationId && organizationId !== 'all') {
      conditions.push(eq(users.organizationId, parseInt(organizationId)));
    }
    
    if (isActive && isActive !== 'all') {
      conditions.push(eq(users.isActive, isActive === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering, limit, and offset
    const usersList = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db
      .select({ count: count() })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count: total }] = await countQuery;

    return NextResponse.json({
      users: usersList,
      total,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, Permission.USER_WRITE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      email, 
      firstName, 
      lastName, 
      role = 'user', 
      organizationId, 
      isActive = true,
      password 
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, lastName' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate organization if provided
    if (organizationId) {
      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (!org) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 400 }
        );
      }
    }

    // Generate default password if not provided
    const defaultPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create the user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        firstName,
        lastName,
        role,
        organizationId: organizationId || null,
        isActive,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    // Log the activity
    await logActivity(
      session.user.id,
      'user_created',
      `Created user account: ${email}`,
      { 
        userId: newUser.id, 
        userEmail: email, 
        role,
        organizationId: organizationId || null
      },
      session.user.organizationId
    );

    return NextResponse.json({ 
      user: newUser,
      ...(password ? {} : { temporaryPassword: defaultPassword })
    });

  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}