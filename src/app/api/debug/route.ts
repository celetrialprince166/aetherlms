import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    // Calculate server uptime
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);
    
    // Get system memory info
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Get process memory usage
    const memoryUsage = process.memoryUsage();
    
    // Format memory values in MB
    const formatMemory = (bytes: number) => Math.round(bytes / 1024 / 1024);
    
    // Get request headers
    const headersList = headers();
    const allHeaders = Object.fromEntries(headersList.entries());
    
    // Get environment info
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      SKIP_DB_CHECK: process.env.SKIP_DB_CHECK,
      BUILD_MODE: process.env.BUILD_MODE,
    };
    
    // Return server diagnostics
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
        cpus: os.cpus().length,
        hostname: os.hostname(),
        loadAverage: os.loadavg(),
      },
      memory: {
        totalMB: formatMemory(totalMemory),
        freeMB: formatMemory(freeMemory),
        usedMB: formatMemory(usedMemory),
        usedPercent: Math.round((usedMemory / totalMemory) * 100),
        process: {
          rssMB: formatMemory(memoryUsage.rss),
          heapTotalMB: formatMemory(memoryUsage.heapTotal),
          heapUsedMB: formatMemory(memoryUsage.heapUsed),
          externalMB: formatMemory(memoryUsage.external),
        },
      },
      request: {
        url: request.url,
        method: request.method,
        headers: allHeaders,
      },
      environment: env,
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 