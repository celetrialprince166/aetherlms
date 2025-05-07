import { NextResponse } from 'next/server';
import { isConnected, getConnectionError, reconnect } from '@/lib/prisma';

export async function GET() {
  const startTime = process.hrtime();
  
  // Check database connection status (won't fail the health check)
  let dbStatus = 'unknown';
  let dbError = null;
  
  try {
    if (process.env.SKIP_DB_CHECK !== 'true') {
      // Get current database status
      const connected = isConnected();
      dbStatus = connected ? 'connected' : 'disconnected';
      
      // Get error if any
      dbError = getConnectionError()?.message;
      
      // Try to reconnect if disconnected but don't fail health check
      if (!connected) {
        console.log('[HealthCheck] Database disconnected, attempting reconnection...');
        reconnect().catch(() => {}); // Don't wait for this to complete
      }
    } else {
      dbStatus = 'skipped';
    }
  } catch (error) {
    dbStatus = 'error';
    dbError = error instanceof Error ? error.message : String(error);
  }
  
  // Calculate response time
  const diffTime = process.hrtime(startTime);
  const responseTimeMs = (diffTime[0] * 1e9 + diffTime[1]) / 1e6;
  
  // Return health status
  return NextResponse.json({
    status: 'ok', // Always return ok for Render health check
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    responseTime: `${responseTimeMs.toFixed(2)}ms`,
    database: {
      status: dbStatus,
      error: dbError,
    }
  });
} 