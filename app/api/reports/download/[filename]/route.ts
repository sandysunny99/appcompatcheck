import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.REPORT_READ)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { filename } = params;
    
    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'reports');
    const filepath = path.join(reportsDir, filename);

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch (error) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Read file
    const content = await fs.readFile(filepath, 'utf-8');
    const reportData = JSON.parse(content);

    // Return as downloadable file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Download report error:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a report
export async function DELETE(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.REPORT_DELETE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { filename } = params;
    
    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'reports');
    const filepath = path.join(reportsDir, filename);

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch (error) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Delete file
    await fs.unlink(filepath);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });

  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
