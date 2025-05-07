// src/lib/prisma.ts
// Use our build-safe client for static exports
import { buildSafeClient, isConnected, getConnectionError, reconnect } from './build-safe-db'

// During build, use mock client. In runtime, use real DB connections
export const client = buildSafeClient

// Re-export connection helpers
export { isConnected, getConnectionError, reconnect }
