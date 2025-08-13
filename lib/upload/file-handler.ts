import { NextRequest } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import Papa from 'papaparse';
import { z } from 'zod';

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['application/json', 'text/csv', 'application/csv'],
  allowedExtensions: ['.json', '.csv'],
  uploadDir: process.cwd() + '/uploads',
  tempDir: process.cwd() + '/temp',
} as const;

// File metadata schema
const FileMetadataSchema = z.object({
  originalName: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  uploadedBy: z.number(),
  organizationId: z.number().optional(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

// File validation schema for security scanning logs
const SecurityLogSchema = z.object({
  timestamp: z.string(),
  tool: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

export type SecurityLogEntry = z.infer<typeof SecurityLogSchema>;

// CSV row schema for compatibility data
const CompatibilityDataSchema = z.object({
  application: z.string(),
  version: z.string().optional(),
  security_tool: z.string(),
  tool_version: z.string().optional(),
  compatibility_status: z.enum(['compatible', 'incompatible', 'partial', 'unknown']),
  issues: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  recommendations: z.string().optional(),
  last_tested: z.string().optional(),
});

export type CompatibilityDataEntry = z.infer<typeof CompatibilityDataSchema>;

// File upload error types
export class FileUploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'FileUploadError';
  }
}

// Ensure upload directories exist
export async function ensureUploadDirectories() {
  try {
    await mkdir(UPLOAD_CONFIG.uploadDir, { recursive: true });
    await mkdir(UPLOAD_CONFIG.tempDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directories:', error);
    throw new FileUploadError(
      'Failed to initialize upload directories',
      'DIRECTORY_CREATION_FAILED',
      500
    );
  }
}

// Generate secure filename
export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
}

// Validate file type and extension
export function validateFileType(file: File): void {
  const fileType = file.type;
  const extension = path.extname(file.name).toLowerCase();

  if (!UPLOAD_CONFIG.allowedTypes.includes(fileType)) {
    throw new FileUploadError(
      `Invalid file type: ${fileType}. Allowed types: ${UPLOAD_CONFIG.allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE'
    );
  }

  if (!UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
    throw new FileUploadError(
      `Invalid file extension: ${extension}. Allowed extensions: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
      'INVALID_FILE_EXTENSION'
    );
  }
}

// Validate file size
export function validateFileSize(file: File): void {
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    const maxSizeMB = UPLOAD_CONFIG.maxFileSize / (1024 * 1024);
    throw new FileUploadError(
      `File size exceeds limit. Maximum allowed: ${maxSizeMB}MB`,
      'FILE_SIZE_EXCEEDED'
    );
  }
}

// Save file to disk
export async function saveFile(
  file: File,
  filename: string,
  directory: string = UPLOAD_CONFIG.uploadDir
): Promise<string> {
  await ensureUploadDirectories();
  
  const filePath = path.join(directory, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  
  await writeFile(filePath, buffer);
  
  return filePath;
}

// Parse JSON file
export async function parseJsonFile(filePath: string): Promise<any[]> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      throw new FileUploadError(
        'JSON file must contain an array of objects',
        'INVALID_JSON_FORMAT'
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof FileUploadError) throw error;
    throw new FileUploadError(
      'Failed to parse JSON file',
      'JSON_PARSE_ERROR'
    );
  }
}

// Parse CSV file
export async function parseCsvFile(filePath: string): Promise<any[]> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            reject(new FileUploadError(
              `CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`,
              'CSV_PARSE_ERROR'
            ));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(new FileUploadError(
            `CSV parsing failed: ${error.message}`,
            'CSV_PARSE_ERROR'
          ));
        }
      });
    });
  } catch (error) {
    if (error instanceof FileUploadError) throw error;
    throw new FileUploadError(
      'Failed to read CSV file',
      'CSV_READ_ERROR'
    );
  }
}

// Validate security log data
export function validateSecurityLogData(data: any[]): SecurityLogEntry[] {
  const validatedData: SecurityLogEntry[] = [];
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    try {
      const validated = SecurityLogSchema.parse(item);
      validatedData.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`Row ${index + 1}: ${error.errors.map(e => e.message).join(', ')}`);
      } else {
        errors.push(`Row ${index + 1}: Invalid data format`);
      }
    }
  });
  
  if (errors.length > 0 && validatedData.length === 0) {
    throw new FileUploadError(
      `Validation failed for all rows: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? `... and ${errors.length - 5} more` : ''}`,
      'VALIDATION_FAILED'
    );
  }
  
  return validatedData;
}

// Validate compatibility data
export function validateCompatibilityData(data: any[]): CompatibilityDataEntry[] {
  const validatedData: CompatibilityDataEntry[] = [];
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    try {
      const validated = CompatibilityDataSchema.parse(item);
      validatedData.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`Row ${index + 1}: ${error.errors.map(e => e.message).join(', ')}`);
      } else {
        errors.push(`Row ${index + 1}: Invalid data format`);
      }
    }
  });
  
  if (errors.length > 0 && validatedData.length === 0) {
    throw new FileUploadError(
      `Validation failed for all rows: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? `... and ${errors.length - 5} more` : ''}`,
      'VALIDATION_FAILED'
    );
  }
  
  return validatedData;
}

// Process uploaded file
export async function processUploadedFile(
  filePath: string,
  fileType: string,
  dataType: 'security_log' | 'compatibility_data' = 'security_log'
): Promise<{
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: SecurityLogEntry[] | CompatibilityDataEntry[];
  errors?: string[];
}> {
  let rawData: any[];
  
  // Parse file based on type
  if (fileType === 'application/json') {
    rawData = await parseJsonFile(filePath);
  } else {
    rawData = await parseCsvFile(filePath);
  }
  
  // Validate data based on expected format
  let validatedData: SecurityLogEntry[] | CompatibilityDataEntry[];
  let validationErrors: string[] = [];
  
  try {
    if (dataType === 'security_log') {
      validatedData = validateSecurityLogData(rawData);
    } else {
      validatedData = validateCompatibilityData(rawData);
    }
  } catch (error) {
    if (error instanceof FileUploadError) {
      // Try to extract partial data if possible
      validatedData = [];
      validationErrors.push(error.message);
    } else {
      throw error;
    }
  }
  
  return {
    totalRows: rawData.length,
    validRows: validatedData.length,
    invalidRows: rawData.length - validatedData.length,
    data: validatedData,
    errors: validationErrors.length > 0 ? validationErrors : undefined,
  };
}

// Clean up temporary files
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    const fs = await import('fs/promises');
    await fs.unlink(filePath);
  } catch (error) {
    console.warn('Failed to cleanup temp file:', filePath, error);
  }
}

// Scan file for malware/security issues
export async function scanFileForSecurity(filePath: string): Promise<{
  safe: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    
    // Check file size
    if (stats.size === 0) {
      issues.push('File is empty');
      return { safe: false, issues };
    }
    
    // Read first few bytes to check for suspicious content
    const fd = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(1024);
    await fd.read(buffer, 0, 1024, 0);
    await fd.close();
    
    const content = buffer.toString('utf8');
    
    // Basic security checks
    const suspiciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /__import__/gi,
      /eval\s*\(/gi,
      /exec\s*\(/gi,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        issues.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }
    
    return {
      safe: issues.length === 0,
      issues
    };
    
  } catch (error) {
    console.error('File security scan failed:', error);
    return {
      safe: false,
      issues: ['Failed to perform security scan']
    };
  }
}

// Extract file from FormData
export async function extractFileFromRequest(request: NextRequest): Promise<{
  file: File;
  metadata: any;
}> {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new FileUploadError(
      'No file provided in request',
      'NO_FILE_PROVIDED'
    );
  }
  
  // Extract additional metadata
  const metadata = {
    dataType: formData.get('dataType') || 'security_log',
    description: formData.get('description') || '',
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
  };
  
  return { file, metadata };
}

// Main file upload handler
export async function handleFileUpload(
  request: NextRequest,
  userId: number,
  organizationId?: number
): Promise<{
  fileId: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  processResult: Awaited<ReturnType<typeof processUploadedFile>>;
}> {
  const { file, metadata } = await extractFileFromRequest(request);
  
  // Validate file
  validateFileType(file);
  validateFileSize(file);
  
  // Generate secure filename
  const fileName = generateSecureFilename(file.name);
  const fileId = crypto.randomUUID();
  
  // Save file
  const filePath = await saveFile(file, fileName);
  
  // Security scan
  const securityScan = await scanFileForSecurity(filePath);
  if (!securityScan.safe) {
    await cleanupTempFile(filePath);
    throw new FileUploadError(
      `File failed security scan: ${securityScan.issues.join(', ')}`,
      'SECURITY_SCAN_FAILED'
    );
  }
  
  try {
    // Process file content
    const processResult = await processUploadedFile(
      filePath,
      file.type,
      metadata.dataType
    );
    
    return {
      fileId,
      originalName: file.name,
      fileName,
      fileSize: file.size,
      processResult,
    };
    
  } catch (error) {
    // Clean up file if processing fails
    await cleanupTempFile(filePath);
    throw error;
  }
}