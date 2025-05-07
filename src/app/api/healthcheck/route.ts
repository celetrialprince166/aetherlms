import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check that doesn't require database access
  return NextResponse.json({ 
    status: 'ok',
    message: 'Service is healthy',
    timestamp: new Date().toISOString()
  });
} 