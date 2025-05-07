import { PrismaClient } from '@prisma/client'
import { toast } from 'sonner'

// Initialize Prisma Client with connection retry logic
const MAX_RETRY_COUNT = 3
const RETRY_DELAY_MS = 1000

// Used to track connection status across the app
let dbIsConnected = false
let connectionError: Error | null = null
let retryCount = 0

// Create a wrapper for Prisma client that handles connection issues gracefully
const createClient = () => {
  // Create the base client
  const prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty',
  })

  // Add connection handling
  const connectWithRetry = async () => {
    try {
      await prisma.$connect()
      dbIsConnected = true
      connectionError = null
      console.log('Database connection established')
      return true
    } catch (error) {
      connectionError = error as Error
      console.error('Database connection error:', error)
      
      if (retryCount < MAX_RETRY_COUNT) {
        retryCount++
        console.log(`Retrying database connection (${retryCount}/${MAX_RETRY_COUNT})...`)
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        return connectWithRetry()
      }
      
      return false
    }
  }

  // Connect immediately
  connectWithRetry()
  
  return {
    client: prisma,
    isConnected: () => dbIsConnected,
    getConnectionError: () => connectionError,
    reconnect: connectWithRetry
  }
}

// Export client and connection status
export const { client, isConnected, getConnectionError, reconnect } = createClient() 