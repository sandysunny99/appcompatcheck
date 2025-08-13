import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { db } from '@/lib/db/drizzle';
import { compatibilityRules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logActivity } from '@/lib/db/activity';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, Permission.RULE_READ)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    const [rule] = await db
      .select()
      .from(compatibilityRules)
      .where(eq(compatibilityRules.id, ruleId))
      .limit(1);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });

  } catch (error) {
    console.error('Failed to fetch rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, Permission.RULE_WRITE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, category, severity, pattern, enabled } = body;

    // Validate severity if provided
    if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    // Check if rule exists
    const [existingRule] = await db
      .select({ name: compatibilityRules.name })
      .from(compatibilityRules)
      .where(eq(compatibilityRules.id, ruleId))
      .limit(1);

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Update the rule
    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (severity !== undefined) updates.severity = severity;
    if (pattern !== undefined) updates.pattern = pattern;
    if (enabled !== undefined) updates.enabled = enabled;

    const [updatedRule] = await db
      .update(compatibilityRules)
      .set(updates)
      .where(eq(compatibilityRules.id, ruleId))
      .returning();

    // Log the activity
    await logActivity(
      session.user.id,
      'rule_updated',
      `Updated compatibility rule: ${existingRule.name}`,
      { ruleId, changes: Object.keys(updates) },
      session.user.organizationId
    );

    return NextResponse.json({ rule: updatedRule });

  } catch (error) {
    console.error('Failed to update rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, Permission.RULE_DELETE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    // Check if rule exists and get its name for logging
    const [existingRule] = await db
      .select({ name: compatibilityRules.name, usageCount: compatibilityRules.usageCount })
      .from(compatibilityRules)
      .where(eq(compatibilityRules.id, ruleId))
      .limit(1);

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Check if rule is being used
    if (existingRule.usageCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete rule that is being used in scans',
          usageCount: existingRule.usageCount 
        }, 
        { status: 409 }
      );
    }

    // Delete the rule
    await db
      .delete(compatibilityRules)
      .where(eq(compatibilityRules.id, ruleId));

    // Log the activity
    await logActivity(
      session.user.id,
      'rule_deleted',
      `Deleted compatibility rule: ${existingRule.name}`,
      { ruleId, ruleName: existingRule.name },
      session.user.organizationId
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}