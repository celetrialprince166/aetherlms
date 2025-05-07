/**
 * Build-safe mock database client
 * This provides mock database functionality during static builds 
 * to avoid connection errors when exporting static pages
 */

import { PrismaClient } from '@prisma/client'

// Check if we're in build mode or explicitly told to use mocks
const isBuildOrSkipDB = 
  process.env.NODE_ENV === 'production' && 
  (process.env.SKIP_DB_CHECK === 'true' || process.env.BUILD_MODE === 'static');

// Enhanced mock client for build process with more comprehensive mocks
const mockClient = {
  $connect: async () => Promise.resolve(),
  $disconnect: async () => Promise.resolve(),
  // Mock query capabilities
  $queryRaw: async () => Promise.resolve([]),
  $executeRaw: async () => Promise.resolve({}),
  $transaction: async (fn: (prisma: PrismaClient) => Promise<any>) => Promise.resolve(fn(mockClient)),
  
  // Core models
  course: {
    findMany: async () => Promise.resolve([]),
    findUnique: async () => Promise.resolve(null),
    findFirst: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
    count: async () => Promise.resolve(0),
    upsert: async () => Promise.resolve({}),
  },
  user: {
    findMany: async () => Promise.resolve([]),
    findUnique: async () => Promise.resolve(null),
    findFirst: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
    count: async () => Promise.resolve(0),
    upsert: async () => Promise.resolve({}),
  },
  workspace: {
    findMany: async () => Promise.resolve([]),
    findUnique: async () => Promise.resolve(null),
    findFirst: async () => Promise.resolve(null),
    count: async () => Promise.resolve(0),
  },
  lesson: {
    findMany: async () => Promise.resolve([]),
    findUnique: async () => Promise.resolve(null),
    findFirst: async () => Promise.resolve(null), 
    count: async () => Promise.resolve(0),
  },
  enrollment: {
    findMany: async () => Promise.resolve([]),
    findUnique: async () => Promise.resolve(null),
    count: async () => Promise.resolve(0),
  },
  section: {
    findMany: async () => Promise.resolve([]),
    findUnique: async () => Promise.resolve(null),
    count: async () => Promise.resolve(0),
  },
  // Add other models as needed
} as unknown as PrismaClient

// Export the appropriate client with logging
console.log(`[Database] Using ${isBuildOrSkipDB ? 'MOCK' : 'REAL'} database client`);
export const buildSafeClient = isBuildOrSkipDB ? mockClient : new PrismaClient();

// Export helper functions that always return successful results during build
export const isConnected = () => true;
export const getConnectionError = () => null;
export const reconnect = async () => true;

// Add compatibility export for direct db import
export const db = buildSafeClient; 