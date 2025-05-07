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

// Create a more resilient Prisma client with connection handling
class ResilientPrismaClient {
  private prisma: PrismaClient;
  private isConnected: boolean = false;
  private connectionError: Error | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error'],
    });
    // Initial connection
    this.connectWithRetry();
  }

  // Connect with automatic retry
  private async connectWithRetry(retries = this.maxRetries): Promise<boolean> {
    try {
      console.log("[Database] Attempting to connect...");
      await this.prisma.$connect();
      this.isConnected = true;
      this.connectionError = null;
      console.log("[Database] Connection successful");
      return true;
    } catch (error) {
      this.isConnected = false;
      this.connectionError = error as Error;
      console.error(`[Database] Connection failed: ${error}`);
      
      if (retries > 0) {
        console.log(`[Database] Retrying connection in ${this.retryDelay}ms... (${retries} remaining)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connectWithRetry(retries - 1);
      } else {
        console.error("[Database] Max retries reached. Connection failed.");
        return false;
      }
    }
  }

  // Public method to manually reconnect
  public async reconnect(): Promise<boolean> {
    try {
      // First try to disconnect if we think we're connected
      if (this.isConnected) {
        await this.prisma.$disconnect().catch(() => {});
        this.isConnected = false;
      }
      return this.connectWithRetry();
    } catch (error) {
      console.error("[Database] Reconnection failed:", error);
      return false;
    }
  }

  // Check if connected
  public getIsConnected(): boolean {
    return this.isConnected;
  }

  // Get connection error
  public getConnectionError(): Error | null {
    return this.connectionError;
  }

  // Get the proxied client
  public getClient(): PrismaClient {
    return this.createClientProxy();
  }

  // Create a proxy for the Prisma client
  private createClientProxy(): PrismaClient {
    const self = this;
    
    return new Proxy(this.prisma, {
      get: (target, prop: string | symbol) => {
        // Handle special methods directly
        if (prop === '$connect') return () => self.connectWithRetry();
        if (prop === '$disconnect') return () => {
          self.isConnected = false;
          return target.$disconnect();
        };

        // For regular properties and methods
        const originalValue = target[prop as keyof PrismaClient];
        
        // If it's a nested model (like user, post, etc.)
        if (typeof originalValue === 'object' && originalValue !== null) {
          return new Proxy(originalValue, {
            get: (modelTarget: any, modelProp: string | symbol) => {
              const modelMethod = modelTarget[modelProp as keyof typeof modelTarget];
              
              // If it's a method, add resilience
              if (typeof modelMethod === 'function') {
                return async (...args: any[]) => {
                  // Wrapper with retry logic
                  const executeWithRetry = async (retryCount = self.maxRetries): Promise<any> => {
                    try {
                      // Use call instead of apply and bind this context properly
                      return await modelMethod.call(modelTarget, ...args);
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : String(error);
                      
                      // Check if it's a connection error
                      const isConnectionError = 
                        errorMessage.includes('terminating connection') || 
                        errorMessage.includes('Connection') || 
                        errorMessage.includes('ECONNRESET') ||
                        errorMessage.includes('prisma:error');
                      
                      if (isConnectionError && retryCount > 0) {
                        console.log(`[Database] Operation failed due to connection issue. Reconnecting... (${retryCount} retries left)`);
                        await self.reconnect();
                        await new Promise(resolve => setTimeout(resolve, self.retryDelay));
                        return executeWithRetry(retryCount - 1);
                      }
                      
                      // For other errors or if max retries reached
                      throw error;
                    }
                  };
                  
                  return executeWithRetry();
                };
              }
              
              return modelMethod;
            }
          });
        }
        
        // For methods directly on the client
        if (typeof originalValue === 'function') {
          return async (...args: any[]) => {
            try {
              return await (originalValue as Function).call(target, ...args);
            } catch (error) {
              // If it's potentially a connection error, try to reconnect once
              console.error(`[Database] Client operation failed: ${error}`);
              if (!self.isConnected) {
                await self.reconnect();
                return (originalValue as Function).call(target, ...args);
              }
              throw error;
            }
          };
        }
        
        return originalValue;
      }
    }) as PrismaClient;
  }
}

// Create the resilient client instance
const resilientPrismaInstance = isBuildOrSkipDB 
  ? undefined 
  : new ResilientPrismaClient();

// Export the appropriate client with logging
const resilientClient = isBuildOrSkipDB 
  ? mockClient 
  : resilientPrismaInstance?.getClient();

console.log(`[Database] Using ${isBuildOrSkipDB ? 'MOCK' : 'RESILIENT'} database client`);
export const buildSafeClient = resilientClient;

// Export helper functions
export const isConnected = () => {
  if (isBuildOrSkipDB) return true;
  return resilientPrismaInstance?.getIsConnected() ?? false;
};

export const getConnectionError = () => {
  if (isBuildOrSkipDB) return null;
  return resilientPrismaInstance?.getConnectionError() ?? null;
};

export const reconnect = async () => {
  if (isBuildOrSkipDB) return true;
  return await resilientPrismaInstance?.reconnect() ?? false;
};

// Add compatibility export for direct db import
export const db = buildSafeClient; 