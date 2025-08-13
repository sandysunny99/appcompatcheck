import { NextRequest, NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/api/openapi-spec';

export async function GET(request: NextRequest) {
  try {
    // Return the OpenAPI specification as JSON
    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
}