/**
 * Environment configuration helper with fallbacks
 * Provides safe access to environment variables with default values
 */

// Database configuration
export const DATABASE_CONFIG = {
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/opal?schema=public',
  retryCount: parseInt(process.env.DATABASE_RETRY_COUNT || '3', 10),
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000', 10)
}

// Feature flags
export const FEATURE_FLAGS = {
  enableResilientAuth: process.env.ENABLE_RESILIENT_AUTH === 'true',
  disableVideoProcessing: process.env.DISABLE_VIDEO_PROCESSING === 'true',
  disableCloudinary: process.env.DISABLE_CLOUDINARY === 'true',
  disableStripe: process.env.DISABLE_STRIPE === 'true',
  disableWebhook: process.env.DISABLE_WEBHOOK === 'true',
}

// Build configuration
export const BUILD_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  // Set this to handle static vs dynamic routes
  enableStaticRendering: process.env.ENABLE_STATIC_RENDERING === 'true'
}

// Helper functions
export function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

export function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key]
  if (value === undefined || value === '') return defaultValue
  return value.toLowerCase() === 'true'
} 