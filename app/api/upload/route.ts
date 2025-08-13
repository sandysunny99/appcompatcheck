import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, Permission, hasPermission } from '@/lib/auth/session';
import { handleFileUpload, FileUploadError } from '@/lib/upload/file-handler';
import { db } from '@/lib/db/drizzle';
import { fileUploads, ActivityType } from '@/lib/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth();
    
    // Check permissions
    if (!hasPermission(session, Permission.SCAN_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get client info for logging
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     request.ip || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Handle file upload
    const uploadResult = await handleFileUpload(
      request,
      session.user.id,
      session.user.organizationId
    );

    // Save file metadata to database
    const [fileRecord] = await db.insert(fileUploads).values({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      fileName: uploadResult.fileName,
      originalName: uploadResult.originalName,
      fileType: request.headers.get('content-type')?.split(';')[0] || 'unknown',
      fileSize: uploadResult.fileSize,
      filePath: `uploads/${uploadResult.fileName}`,
      uploadStatus: 'completed',
      processedAt: new Date(),
    }).returning();

    // Log activity
    await logActivity({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      action: ActivityType.FILE_UPLOADED,
      entityType: 'file_upload',
      entityId: fileRecord.id,
      description: `File uploaded: ${uploadResult.originalName}`,
      ipAddress,
      userAgent,
      metadata: {
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        originalName: uploadResult.originalName,
        fileSize: uploadResult.fileSize,
        totalRows: uploadResult.processResult.totalRows,
        validRows: uploadResult.processResult.validRows,
        invalidRows: uploadResult.processResult.invalidRows,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        fileId: uploadResult.fileId,
        uploadId: fileRecord.id,
        originalName: uploadResult.originalName,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        uploadedAt: fileRecord.createdAt,
        processResult: {
          totalRows: uploadResult.processResult.totalRows,
          validRows: uploadResult.processResult.validRows,
          invalidRows: uploadResult.processResult.invalidRows,
          hasErrors: uploadResult.processResult.errors && uploadResult.processResult.errors.length > 0,
          errors: uploadResult.processResult.errors,
        },
      },
    });

  } catch (error) {
    console.error('File upload error:', error);

    if (error instanceof FileUploadError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// Get user's uploaded files
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const files = await db
      .select({
        id: fileUploads.id,
        fileName: fileUploads.fileName,
        originalName: fileUploads.originalName,
        fileType: fileUploads.fileType,
        fileSize: fileUploads.fileSize,
        uploadStatus: fileUploads.uploadStatus,
        processedAt: fileUploads.processedAt,
        createdAt: fileUploads.createdAt,
      })
      .from(fileUploads)
      .where(
        session.user.organizationId
          ? or(
              eq(fileUploads.userId, session.user.id),
              eq(fileUploads.organizationId, session.user.organizationId)
            )
          : eq(fileUploads.userId, session.user.id)
      )
      .orderBy(desc(fileUploads.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: files,
      pagination: {
        page,
        limit,
        total: files.length, // This should be a separate count query in production
      },
    });

  } catch (error) {
    console.error('Get files error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}