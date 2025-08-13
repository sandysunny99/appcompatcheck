import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const healthData = {
    status: 'healthy',
    version: '1.0.0',
    timestamp: Date.now(),
    components: {
      api: { status: 'healthy' },
      database: { status: 'healthy' }, 
      redis: { status: 'healthy' },
    },
  };
  
  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0.0',
    },
  });
}