import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { db } from '@/lib/db/drizzle';
import { compatibilityRules } from '@/lib/db/schema';
import { eq, and, or, desc, asc, like } from 'drizzle-orm';
import { logActivity } from '@/lib/db/activity';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, Permission.RULE_READ)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const enabled = searchParams.get('enabled');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select({
      id: compatibilityRules.id,
      name: compatibilityRules.name,
      description: compatibilityRules.description,
      category: compatibilityRules.category,
      severity: compatibilityRules.severity,
      pattern: compatibilityRules.pattern,
      enabled: compatibilityRules.enabled,
      createdAt: compatibilityRules.createdAt,
      updatedAt: compatibilityRules.updatedAt,
      usageCount: compatibilityRules.usageCount,
    }).from(compatibilityRules);

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(compatibilityRules.name, `%${search}%`),
          like(compatibilityRules.description, `%${search}%`)
        )
      );
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(compatibilityRules.category, category));
    }
    
    if (severity && severity !== 'all') {
      conditions.push(eq(compatibilityRules.severity, severity as any));
    }
    
    if (enabled && enabled !== 'all') {
      conditions.push(eq(compatibilityRules.enabled, enabled === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering, limit, and offset
    const rules = await query
      .orderBy(desc(compatibilityRules.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: compatibilityRules.id })
      .from(compatibilityRules)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      rules,
      total: count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Failed to fetch rules:', error);
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

    if (!hasPermission(session.user.role, Permission.RULE_WRITE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, severity, pattern, enabled = true } = body;

    // Validate required fields
    if (!name || !description || !category || !severity || !pattern) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    // Create the rule
    const [rule] = await db
      .insert(compatibilityRules)
      .values({
        name,
        description,
        category,
        severity,
        pattern,
        enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Log the activity
    await logActivity(
      session.user.id,
      'rule_created',
      `Created compatibility rule: ${name}`,
      { ruleId: rule.id, ruleName: name },
      session.user.organizationId
    );

    return NextResponse.json({ rule });

  } catch (error) {
    console.error('Failed to create rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}