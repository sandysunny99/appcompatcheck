import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Common validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  pagination?: ApiResponse<T>['pagination']
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0.0',
    },
  });
}

// Created response helper
export function createCreatedResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0.0',
      },
    }
  );
}

// Error response helpers
export function createErrorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
    },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0.0',
      },
    }
  );
}

export function createValidationErrorResponse(
  errors: z.ZodError
): NextResponse<ApiResponse> {
  const details = errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));

  return createErrorResponse(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    details
  );
}

export function createUnauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 401, 'UNAUTHORIZED');
}

export function createForbiddenResponse(
  message: string = 'Insufficient permissions'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 403, 'FORBIDDEN');
}

export function createNotFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 404, 'NOT_FOUND');
}

export function createInternalErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 500, 'INTERNAL_ERROR');
}

// Request validation utility
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

// Query parameter validation
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse<ApiResponse> } {
  const searchParams = request.nextUrl.searchParams;
  const params = Object.fromEntries(searchParams.entries());
  
  const validation = validateRequest(schema, params);
  
  if (!validation.success) {
    return {
      success: false,
      response: createValidationErrorResponse(validation.error),
    };
  }
  
  return { success: true, data: validation.data };
}

// Path parameter validation
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse<ApiResponse> } {
  const validation = validateRequest(schema, params);
  
  if (!validation.success) {
    return {
      success: false,
      response: createValidationErrorResponse(validation.error),
    };
  }
  
  return { success: true, data: validation.data };
}

// Request body validation
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiResponse> }> {
  try {
    const body = await request.json();
    const validation = validateRequest(schema, body);
    
    if (!validation.success) {
      return {
        success: false,
        response: createValidationErrorResponse(validation.error),
      };
    }
    
    return { success: true, data: validation.data };
  } catch (error) {
    return {
      success: false,
      response: createErrorResponse('Invalid JSON in request body', 400, 'INVALID_JSON'),
    };
  }
}

// Rate limiting response
export function createRateLimitResponse(): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        message: 'Too many requests. Please try again later.',
      },
    },
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0.0',
        'Retry-After': '60',
      },
    }
  );
}

// CORS headers utility
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

// Health check response
export function createHealthCheckResponse(data: {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: number;
  components?: Record<string, any>;
}): NextResponse<ApiResponse> {
  const status = data.status === 'healthy' ? 200 : data.status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(
    {
      success: data.status !== 'unhealthy',
      data,
    },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

// Middleware wrapper for consistent error handling
export function withErrorHandling(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof z.ZodError) {
        return createValidationErrorResponse(error);
      }
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message === 'Unauthorized') {
          return createUnauthorizedResponse();
        }
        
        if (error.message === 'Forbidden') {
          return createForbiddenResponse();
        }
        
        if (error.message === 'Not Found') {
          return createNotFoundResponse();
        }
        
        return createInternalErrorResponse(error.message);
      }
      
      return createInternalErrorResponse();
    }
  };
}

// API versioning utility
export function getApiVersion(request: NextRequest): string {
  return (
    request.headers.get('X-API-Version') ||
    request.headers.get('Accept-Version') ||
    '1.0.0'
  );
}

// Content negotiation
export function getAcceptedContentType(request: NextRequest): string {
  const accept = request.headers.get('Accept') || 'application/json';
  
  if (accept.includes('application/json')) {
    return 'application/json';
  }
  
  if (accept.includes('text/csv')) {
    return 'text/csv';
  }
  
  if (accept.includes('application/xml')) {
    return 'application/xml';
  }
  
  return 'application/json'; // Default
}

// Request logging utility
export function logApiRequest(
  request: NextRequest,
  response: NextResponse,
  startTime: number
) {
  const duration = Date.now() - startTime;
  const method = request.method;
  const url = request.url;
  const status = response.status;
  const userAgent = request.headers.get('User-Agent') || 'Unknown';
  const ip = request.headers.get('X-Forwarded-For') || 
             request.headers.get('X-Real-IP') || 
             'Unknown';
  
  console.log(`API ${method} ${url} ${status} ${duration}ms - ${ip} - ${userAgent}`);
}